use serde::Serialize;
use std::path::Path;

/// Send `path` to the OS Recycle Bin / Trash.
/// NEVER permanently deletes.
fn send_to_trash(path: &Path) -> Result<(), String> {
    #[cfg(windows)]
    {
        win_recycle::recycle(path)
    }
    #[cfg(not(windows))]
    {
        trash::delete(path).map_err(|e| e.to_string())
    }
}

/// Windows Recycle Bin with **zero shell dialogs**.
///
/// IFileOperation / SHFileOperation enumerate every file in node_modules and
/// pop "An unknown error has occurred" with only Skip (no Skip All) — 100
/// clicks for 100 locked files. We instead `rename` the folder into
/// `$Recycle.Bin\<SID>` and write Vista+ `$I` metadata so Restore still works.
/// Failures skip the whole item once. Never permanently deletes.
#[cfg(windows)]
mod win_recycle {
    use std::ffi::OsString;
    use std::os::windows::ffi::{OsStrExt, OsStringExt};
    use std::path::{Path, PathBuf};
    use std::sync::OnceLock;
    use std::time::{SystemTime, UNIX_EPOCH};

    use windows_sys::Win32::Foundation::{CloseHandle, LocalFree, ERROR_SHARING_VIOLATION};
    use windows_sys::Win32::Security::Authorization::ConvertSidToStringSidW;
    use windows_sys::Win32::Security::{
        GetTokenInformation, TOKEN_USER, TOKEN_QUERY, TokenUser,
    };
    use windows_sys::Win32::System::Threading::{GetCurrentProcess, OpenProcessToken};

    fn current_sid() -> Result<String, String> {
        static SID: OnceLock<Result<String, String>> = OnceLock::new();
        SID.get_or_init(|| unsafe {
            let mut token = std::ptr::null_mut();
            if OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &mut token) == 0 {
                return Err("Could not read Windows user for Recycle Bin".into());
            }
            let mut needed = 0u32;
            GetTokenInformation(token, TokenUser, std::ptr::null_mut(), 0, &mut needed);
            let mut buf = vec![0u8; needed as usize];
            let ok = GetTokenInformation(
                token,
                TokenUser,
                buf.as_mut_ptr().cast(),
                needed,
                &mut needed,
            );
            CloseHandle(token);
            if ok == 0 {
                return Err("Could not read Windows user SID".into());
            }
            let user = &*(buf.as_ptr() as *const TOKEN_USER);
            let mut sid_ptr: windows_sys::core::PWSTR = std::ptr::null_mut();
            if ConvertSidToStringSidW(user.User.Sid, &mut sid_ptr) == 0 {
                return Err("Could not convert Windows SID".into());
            }
            let mut len = 0usize;
            while *sid_ptr.add(len) != 0 {
                len += 1;
            }
            let sid = OsString::from_wide(std::slice::from_raw_parts(sid_ptr, len))
                .to_string_lossy()
                .into_owned();
            LocalFree(sid_ptr.cast());
            Ok(sid)
        })
        .clone()
    }

    fn as_win_path(path: &Path) -> Result<PathBuf, String> {
        let abs = if path.is_absolute() {
            path.to_path_buf()
        } else {
            std::env::current_dir()
                .map_err(|e| e.to_string())?
                .join(path)
        };
        let s = abs.to_string_lossy();
        let is_unc = (s.starts_with(r"\\") && !s.starts_with(r"\\?\"))
            || s.starts_with(r"\\?\UNC\");
        if is_unc {
            return Err("Network path — Recycle Bin is not used for UNC shares".into());
        }
        Ok(abs)
    }

    fn display_path(path: &Path) -> String {
        let s = path.to_string_lossy();
        s.strip_prefix(r"\\?\").unwrap_or(&s).to_string()
    }

    fn volume_root(path: &Path) -> Result<PathBuf, String> {
        let d = display_path(path);
        let prefix: String = d.chars().take(3).collect();
        if prefix.len() >= 2 && prefix.as_bytes().get(1) == Some(&b':') {
            Ok(PathBuf::from(&prefix[..2]).join(r"\"))
        } else {
            Err("Could not determine drive for Recycle Bin".into())
        }
    }

    fn filetime_now() -> u64 {
        const EPOCH_DIFF: u64 = 116_444_736_000_000_000;
        let ns = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos() as u64
            / 100;
        EPOCH_DIFF + ns
    }

    fn write_i_file(i_path: &Path, original: &Path, size: u64) -> std::io::Result<()> {
        let orig = display_path(original);
        let wide: Vec<u16> = OsString::from(&orig)
            .encode_wide()
            .chain(std::iter::once(0))
            .collect();
        let mut buf = Vec::with_capacity(28 + wide.len() * 2);
        buf.extend_from_slice(&2u64.to_le_bytes());
        buf.extend_from_slice(&size.to_le_bytes());
        buf.extend_from_slice(&filetime_now().to_le_bytes());
        buf.extend_from_slice(&(wide.len() as u32).to_le_bytes());
        for w in wide {
            buf.extend_from_slice(&w.to_le_bytes());
        }
        std::fs::write(i_path, buf)
    }

    fn io_reason(err: std::io::Error) -> String {
        if err.raw_os_error() == Some(ERROR_SHARING_VIOLATION as i32) || err.raw_os_error() == Some(32)
        {
            return "In use by another program — close Node/IDE/terminal using this folder".into();
        }
        if err.kind() == std::io::ErrorKind::PermissionDenied {
            return "Access denied".into();
        }
        format!("Could not move to Recycle Bin: {err}")
    }

    pub fn recycle(path: &Path) -> Result<(), String> {
        let abs = as_win_path(path)?;
        if !abs.exists() {
            return Err("Not found".into());
        }

        let sid = current_sid()?;
        let bin = volume_root(&abs)?.join("$Recycle.Bin").join(&sid);
        if !bin.is_dir() {
            std::fs::create_dir_all(&bin).map_err(|e| {
                format!("Could not open Recycle Bin folder: {e}")
            })?;
        }

        let size = std::fs::metadata(&abs).map(|m| m.len()).unwrap_or(0);
        let nonce = (filetime_now() ^ (abs.to_string_lossy().len() as u64)) & 0x00FF_FFFF;

        for n in 0..32u32 {
            let id = format!("{:06X}", (nonce.wrapping_add(n as u64)) & 0x00FF_FFFF);
            let r_path = bin.join(format!("$R{id}"));
            let i_path = bin.join(format!("$I{id}"));
            if r_path.exists() || i_path.exists() {
                continue;
            }

            if let Err(e) = std::fs::rename(&abs, &r_path) {
                return Err(io_reason(e));
            }
            if let Err(e) = write_i_file(&i_path, &abs, size) {
                let _ = std::fs::rename(&r_path, &abs);
                return Err(format!("Recycle Bin metadata failed: {e}"));
            }
            return Ok(());
        }

        Err("Could not allocate a Recycle Bin name".into())
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct SkippedItem {
    pub path: String,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct TrashResult {
    pub trashed: Vec<String>,
    pub skipped: Vec<SkippedItem>,
}

/// Move paths to the OS Trash/Recycle Bin.
///
/// CRITICAL SAFETY: Recycle Bin / Trash only.
/// NEVER `fs::remove_dir_all` / `fs::remove_file` anywhere in this codebase.
///
/// On Windows this does **not** call IFileOperation, so the shell cannot
/// show per-file Skip dialogs.
#[tauri::command]
pub fn move_to_trash(
    app: tauri::AppHandle,
    paths: Vec<String>,
    skip_all: Option<bool>,
) -> Result<TrashResult, String> {
    let skip_all = skip_all.unwrap_or(true);
    if paths.is_empty() {
        return Err("No paths provided".to_string());
    }
    move_to_trash_inner(&app, paths, skip_all)
}

#[derive(Clone, Serialize)]
struct TrashProgress {
    path: String,
    status: String,
    reason: Option<String>,
}

fn emit_progress(app: &tauri::AppHandle, path: &str, status: &str, reason: Option<String>) {
    use tauri::Emitter;
    let _ = app.emit(
        "trash-progress",
        TrashProgress {
            path: path.to_string(),
            status: status.to_string(),
            reason,
        },
    );
}

fn move_to_trash_inner(
    app: &tauri::AppHandle,
    paths: Vec<String>,
    skip_all: bool,
) -> Result<TrashResult, String> {
    let mut trashed: Vec<String> = Vec::with_capacity(paths.len());
    let mut skipped: Vec<SkippedItem> = Vec::new();

    for (i, p) in paths.iter().enumerate() {
        let path = Path::new(p);

        // Safety: never trash .env files (Keyper's job).
        if path.components().any(|c| {
            let s = c.as_os_str().to_string_lossy();
            s == ".env" || s.starts_with(".env.")
        }) {
            skipped.push(SkippedItem {
                path: p.clone(),
                reason: "Refused to trash .env path".to_string(),
            });
            emit_progress(app, p, "skipped", Some("Refused to trash .env path".into()));
            continue;
        }

        if !path.exists() {
            skipped.push(SkippedItem {
                path: p.clone(),
                reason: "Not found".to_string(),
            });
            emit_progress(app, p, "skipped", Some("Not found".into()));
            continue;
        }

        match send_to_trash(path) {
            Ok(_) => {
                trashed.push(p.clone());
                emit_progress(app, p, "trashed", None);
            }
            Err(e) => {
                skipped.push(SkippedItem {
                    path: p.clone(),
                    reason: e.clone(),
                });
                emit_progress(app, p, "skipped", Some(e));
                if !skip_all {
                    for rest in &paths[i + 1..] {
                        skipped.push(SkippedItem {
                            path: rest.clone(),
                            reason: "Not attempted (stopped after error)".to_string(),
                        });
                    }
                    break;
                }
            }
        }
    }

    if trashed.is_empty() && skipped.is_empty() {
        return Err("Nothing was moved to Trash".to_string());
    }

    Ok(TrashResult { trashed, skipped })
}
