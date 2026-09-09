use rayon::prelude::*;
use serde::Serialize;
use std::collections::HashSet;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

/// One junk item found on disk.
#[derive(Debug, Clone, Serialize)]
pub struct FoundItem {
    pub path: String,
    pub name: String,
    pub size: u64,
    pub item_type: String,
}

/// Directories that are safe to sweep (dev build junk).
/// NOTE: `coverage` added per user fix; `.output` + `.vite` already included.
const JUNK_DIRS: &[&str] = &[
    "node_modules",
    "dist",
    "build",
    "out",
    ".next",
    ".nuxt",
    ".output",
    ".turbo",
    ".parcel-cache",
    ".vite",
    "__pycache__",
    ".pytest_cache",
    "target",
    ".gradle",
    "logs",
    "coverage",
];

/// Single junk files (exact name match).
const JUNK_FILES: &[&str] = &[".DS_Store", "Thumbs.db"];

/// Directories we NEVER descend into (source code / VCS / IDE).
const SKIP_DIRS: &[&str] = &[
    ".git",
    "src",
    "app",
    "lib",
    "components",
    ".vscode",
];

fn is_env_path(path: &Path) -> bool {
    path.components().any(|c| {
        let s = c.as_os_str().to_string_lossy();
        s == ".env" || s.starts_with(".env.")
    })
}

fn dir_size_parallel(path: &Path) -> u64 {
    jwalk::WalkDir::new(path)
        .follow_links(false)
        .skip_hidden(false)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter_map(|e| e.metadata().ok())
        .filter(|m| m.is_file())
        .map(|m| m.len())
        .sum()
}

#[derive(Clone, Serialize)]
struct ScanProgress {
    projects: u64,
    found: u64,
    current: String,
    stage: String,
}

fn emit_scan(
    app: Option<&tauri::AppHandle>,
    projects: u64,
    found: u64,
    current: &str,
    stage: &str,
) {
    let Some(app) = app else { return };
    use tauri::Emitter;
    let _ = app.emit(
        "scan-progress",
        ScanProgress {
            projects,
            found,
            current: current.to_string(),
            stage: stage.to_string(),
        },
    );
}

/// Scan `root` for dev junk. Never touches `.env`, never descends into
/// source dirs or inside an already-found junk dir.
#[tauri::command]
pub fn scan_folder(app: tauri::AppHandle, root: String) -> Result<Vec<FoundItem>, String> {
    scan_folder_inner(Some(&app), root)
}

pub fn scan_folder_inner(
    app: Option<&tauri::AppHandle>,
    root: String,
) -> Result<Vec<FoundItem>, String> {
    let root_path = PathBuf::from(&root);
    if !root_path.is_dir() {
        return Err(format!("Not a directory: {root}"));
    }
    if is_env_path(&root_path) {
        return Err("Refusing to scan inside .env path".to_string());
    }

    // Phase 1: single-threaded walk to collect candidates.
    // When a junk dir is found we record it and SKIP recursion inside it.
    let mut dir_candidates: Vec<(PathBuf, String)> = Vec::new();
    let mut file_candidates: Vec<(PathBuf, String)> = Vec::new();
    let mut projects: HashSet<PathBuf> = HashSet::new();
    let mut walked: u64 = 0;

    let walker = WalkDir::new(&root_path)
        .follow_links(false)
        .into_iter();

    // Filter manually so we can call skip_current_dir().
    let mut it = walker.filter_entry(|e| {
        let name = e.file_name().to_string_lossy();
        // Never descend into protected source dirs.
        if e.file_type().is_dir() && SKIP_DIRS.contains(&name.as_ref()) {
            return false;
        }
        // Never descend into .env paths.
        if is_env_path(e.path()) {
            return false;
        }
        true
    });

    while let Some(entry) = it.next() {
        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue,
        };
        let path = entry.path();

        // Extra guard: if we are somehow inside an already-found junk dir, skip.
        // (filter_entry + skip_current_dir below makes this rare, belt & suspenders.)
        if dir_candidates
            .iter()
            .any(|(junk, _)| path != *junk && path.starts_with(junk))
        {
            if entry.file_type().is_dir() {
                it.skip_current_dir();
            }
            continue;
        }

        let name = entry.file_name().to_string_lossy().to_string();
        let ftype = entry.file_type();
        walked += 1;

        if ftype.is_dir() {
            if JUNK_DIRS.contains(&name.as_str()) {
                if let Ok(rel) = path.strip_prefix(&root_path) {
                    if let Some(first) = rel.components().next() {
                        projects.insert(root_path.join(first));
                    }
                }
                dir_candidates.push((path.to_path_buf(), name));
                it.skip_current_dir(); // DON'T recurse inside junk
            }
        } else if ftype.is_file() {
            if is_env_path(path) {
                continue; // NEVER touch .env files
            }
            if JUNK_FILES.contains(&name.as_str()) || name.ends_with(".log") {
                let item_type = if name.ends_with(".log") {
                    "log".to_string()
                } else {
                    name.clone()
                };
                if let Ok(rel) = path.strip_prefix(&root_path) {
                    if let Some(first) = rel.components().next() {
                        projects.insert(root_path.join(first));
                    }
                }
                file_candidates.push((path.to_path_buf(), item_type));
            }
        }

        if walked % 40 == 0 {
            emit_scan(
                app,
                projects.len() as u64,
                (dir_candidates.len() + file_candidates.len()) as u64,
                &path.to_string_lossy(),
                "walk",
            );
        }
    }

    emit_scan(
        app,
        projects.len() as u64,
        (dir_candidates.len() + file_candidates.len()) as u64,
        "Sizing folders…",
        "size",
    );

    // Phase 2: parallel size calculation (rayon across candidates).
    let mut dir_items: Vec<FoundItem> = dir_candidates
        .par_iter()
        .map(|(path, item_type)| {
            let size = dir_size_parallel(path);
            FoundItem {
                path: path.to_string_lossy().to_string(),
                name: path
                    .file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_default(),
                size,
                item_type: item_type.clone(),
            }
        })
        .collect();

    let mut file_items: Vec<FoundItem> = file_candidates
        .par_iter()
        .map(|(path, item_type)| {
            let size = std::fs::metadata(path).map(|m| m.len()).unwrap_or(0);
            FoundItem {
                path: path.to_string_lossy().to_string(),
                name: path
                    .file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_default(),
                size,
                item_type: item_type.clone(),
            }
        })
        .collect();

    let mut all = Vec::with_capacity(dir_items.len() + file_items.len());
    all.append(&mut dir_items);
    all.append(&mut file_items);
    // Biggest first — best UX for "free 50GB" moment.
    all.sort_by(|a, b| b.size.cmp(&a.size));
    Ok(all)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn skips_source_dirs_and_env() {
        let base = std::env::temp_dir().join("sysper_scanner_test");
        let _ = fs::remove_dir_all(&base);
        fs::create_dir_all(base.join("proj/node_modules/pkg")).unwrap();
        fs::create_dir_all(base.join("proj/src")).unwrap();
        fs::create_dir_all(base.join("proj/.git")).unwrap();
        fs::write(base.join("proj/node_modules/pkg/index.js"), "x".repeat(100)).unwrap();
        fs::write(base.join("proj/src/keep.ts"), "keep me").unwrap();
        fs::write(base.join("proj/.env"), "SECRET=1").unwrap();
        fs::write(base.join("proj/debug.log"), "log!").unwrap();

        let items = scan_folder_inner(None, base.join("proj").to_string_lossy().to_string()).unwrap();
        let paths: Vec<&str> = items.iter().map(|i| i.path.as_str()).collect();
        assert!(paths.iter().any(|p| p.contains("node_modules")));
        assert!(paths.iter().any(|p| p.contains("debug.log")));
        assert!(!paths.iter().any(|p| p.contains(".env")));
        assert!(!paths.iter().any(|p| p.contains("src")));
        let _ = fs::remove_dir_all(&base);
    }

    #[test]
    fn scans_rich_fixture_and_flags_target() {
        let base = std::env::temp_dir().join("sysper_fixture_test");
        let _ = fs::remove_dir_all(&base);
        for d in [
            "proj-a/node_modules/pkg",
            "proj-a/dist",
            "proj-a/src",
            "proj-a/.git",
            "proj-b/target/debug",
            "proj-b/.vite",
            "proj-c/__pycache__",
            "proj-c/coverage",
            "proj-c/logs",
        ] {
            fs::create_dir_all(base.join(d)).unwrap();
        }
        fs::write(base.join("proj-a/node_modules/pkg/index.js"), "x".repeat(1000)).unwrap();
        fs::write(base.join("proj-a/dist/bundle.js"), "y".repeat(500)).unwrap();
        fs::write(base.join("proj-a/src/keep.ts"), "keep me").unwrap();
        fs::write(base.join("proj-a/.env"), "SECRET=1").unwrap();
        fs::write(base.join("proj-a/debug.log"), "log!").unwrap();
        fs::write(base.join("proj-b/target/debug/app"), "b".repeat(2000)).unwrap();
        fs::write(base.join("proj-b/.vite/deps.json"), "{}").unwrap();
        fs::write(base.join("proj-c/__pycache__/mod.pyc"), "p".repeat(300)).unwrap();
        fs::write(base.join("proj-c/coverage/lcov.info"), "cov").unwrap();
        fs::write(base.join("proj-c/logs/app.log"), "l").unwrap();
        fs::write(base.join("proj-c/Thumbs.db"), "t").unwrap();

        let items = scan_folder_inner(None, base.to_string_lossy().to_string()).unwrap();
        let types: Vec<&str> = items.iter().map(|i| i.item_type.as_str()).collect();
        for expected in [
            "node_modules",
            "dist",
            "target",
            ".vite",
            "__pycache__",
            "coverage",
            "logs",
            "log",
            "Thumbs.db",
        ] {
            assert!(types.contains(&expected), "missing {expected} in {types:?}");
        }
        assert!(items.iter().any(|i| i.item_type == "target" && i.size >= 2000));
        let paths: Vec<&str> = items.iter().map(|i| i.path.as_str()).collect();
        assert!(!paths.iter().any(|p| p.contains(".env")));
        assert!(!paths.iter().any(|p| p.contains("src")));
        assert!(!paths.iter().any(|p| p.contains(".git")));
        let nm = items.iter().find(|i| i.item_type == "node_modules").unwrap();
        assert!(nm.size >= 1000);
        let _ = fs::remove_dir_all(&base);
    }
}
