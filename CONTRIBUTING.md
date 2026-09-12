# Contributing to Emiote Sysper

Thank you for your interest in helping improve Emiote Sysper!

Sysper is an **open source, offline, privacy-first system cleaner**. Our top priority is **absolute data safety**: we never permanently delete user files, never touch `.env` secrets, and never descend into source code directories.

---

## The Best Way to Help: Real Bug Reports

Because Sysper interacts with native operating system trash facilities across Windows, macOS, and Linux distributions, **real reports from real machines are the most valuable contributions**.

If you notice:

- A junk folder that wasn't detected
- A directory that was skipped unexpectedly
- A modal or locked-file warning on Windows
- An issue moving files to your OS Trash
- Any case where source files (`src`, `.env`, `.git`) were even considered

Please **[Open a GitHub Issue](https://github.com/dhanji4U/sysper/issues/new/choose)** immediately.

### When filing a bug, please include:

- **Operating System** (Windows 10/11, macOS Sequoia/Sonoma, Ubuntu/Debian/Arch)
- **Sysper Version** (e.g. `v1.0.0` or local build)
- **Folder Scanned** (redacted path names are completely fine)
- **Expected Behavior vs Observed Behavior**
- **Log / Error Message** (if shown in the error banner)

---

## Code Contributions & Pull Request Policy

To maintain strict safety guarantees and code quality, we follow an **Issue-First Engineering Protocol**:

1. **Do not send unsolicited PRs**: Always open an issue first to discuss the problem, evidence, and proposed contract.
2. **Safety invariants are non-negotiable**: Any code touching [`scanner.rs`](src-tauri/src/scanner.rs) or [`trash.rs`](src-tauri/src/trash.rs) is held to zero-data-loss standards. `fs::remove_dir_all` will never be accepted.
3. **No heavy dependencies or tracking**: Sysper must remain lightweight (<15MB binary), fast (<10s for 50GB), and 100% offline with zero analytics or telemetry.

---

## Mandatory Engineering Lifecycle Protocol

All accepted PRs must strictly follow the lifecycle documented in [AGENTS.md](AGENTS.md#14-mandatory-engineering-lifecycle-protocol):

| Stage                             | Rule                                                                                                                                    |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Pre-Flight**                 | Start from clean `main` (`git checkout main && git pull origin main --ff-only`).                                                        |
| **2. Issue First**                | A GitHub Issue must exist defining evidence, severity, and acceptance contract before writing code.                                     |
| **3. Branch Isolation**           | Branch from `main`: `fix/issue-<num>-<slug>` for bugs, `feat/<slug>` for features, `chore/<slug>` or `docs/<slug>` for routine content. |
| **4. Local Pre-Push Gate**        | Pass all 3 automated quality checks locally before pushing: `pnpm check`, `pnpm test`, and `cargo test`.                                |
| **5. Conventional Commits**       | Use `<type>(<scope>): <description> (closes #<num>)` format. Imperative tense, <72 chars summary.                                       |
| **6. Coldtea PR Lens**            | Push branch and open PR in "Ready for review" mode so PR Lens automatically renders architectural diagrams.                             |
| **7. CI Watching & Self-Healing** | Monitor `gh pr checks --watch`. If CI fails, diagnose with `gh run view --log-failed`, fix locally, and push until green.               |
| **8. Human Approval**             | Never auto-merge into `main`. The PR is reviewed and approved by repository maintainers.                                                |
| **9. PR Completion Comment**      | Post a completion summary comment on the GitHub PR (`gh pr comment <num> --body "..."`) upon merge.                                     |

---

## Local Development Workflow

### 1. Setup

```bash
git clone https://github.com/dhanji4U/sysper.git
cd sysper
pnpm install
```

### 2. Run in Development Mode

```bash
pnpm tauri dev
```

### 3. Run Quality Verification Gates

```bash
# Typecheck + Lint + Format check
pnpm check

# Frontend unit tests (Vitest)
pnpm test

# Backend unit tests (Rust)
cargo test --manifest-path src-tauri/Cargo.toml
```

---

## License

By contributing to Emiote Sysper, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
