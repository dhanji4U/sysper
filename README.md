<p align="center">
  <img alt="Emiote Sysper Icon" src="brand/sysper-icon-1024.png" width="96">
</p>

<h1 align="center">Emiote Sysper</h1>

<p align="center">
  <b>Find the dust eating your memory. Free 50GB in 10 seconds.</b><br>
  One-click cleaner for dev junk — <code>node_modules</code>, <code>dist</code>, <code>build</code>, <code>.next</code>, <code>target</code>, and logs.<br>
  Moves safely to your <b>OS Trash</b> (never permanent delete). 100% offline, zero telemetry, no signup.
</p>

<p align="center">
  <a href="https://github.com/dhanji4U/sysper/releases/latest"><img alt="Latest Release" src="https://img.shields.io/github/v/release/dhanji4U/sysper?style=flat-square&color=21262d&labelColor=21262d"></a>
  <a href="https://github.com/dhanji4U/sysper/actions/workflows/ci.yml"><img alt="CI Status" src="https://img.shields.io/github/actions/workflow/status/dhanji4U/sysper/ci.yml?branch=main&style=flat-square&label=CI&labelColor=21262d"></a>
  <img alt="Platforms" src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-21262d?style=flat-square&labelColor=21262d">
  <img alt="Offline" src="https://img.shields.io/badge/telemetry-100%25%20offline-3fb950?style=flat-square&labelColor=21262d">
  <img alt="Built with Tauri v2 + Rust" src="https://img.shields.io/badge/built%20with-Tauri%20v2%20%2B%20Rust-f97316?style=flat-square&labelColor=21262d">
  <a href="LICENSE"><img alt="MIT License" src="https://img.shields.io/github/license/dhanji4U/sysper?style=flat-square&labelColor=21262d&color=21262d"></a>
</p>

<h3 align="center">
  <a href="https://github.com/dhanji4U/sysper/releases/latest">Download Free v1.0.0</a>&nbsp;&nbsp;·&nbsp;&nbsp;
  <a href="https://emiote.com/sysper">Website</a>&nbsp;&nbsp;·&nbsp;&nbsp;
  <a href="#safety-first">Safety Guarantees</a>
</h3>

<p align="center">
  <sub>⭐️ <b>47GB average freed</b> &nbsp;·&nbsp; Moves to OS Trash only &nbsp;·&nbsp; Triple <code>.env</code> protection &nbsp;·&nbsp; Open Source MIT</sub>
</p>

---

## Downloads (v1.0.0)

Grab the native installer for your operating system from [GitHub Releases](https://github.com/dhanji4U/sysper/releases/latest):

| Platform    | Format                        | Architecture                                 | Download Link                                                                 |
| ----------- | ----------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------- |
| **Windows** | `.msi` / `.exe` (NSIS)        | x64                                          | [Download Windows (.msi)](https://github.com/dhanji4U/sysper/releases/latest) |
| **macOS**   | `.dmg`                        | Apple Silicon (`aarch64`) / Intel (`x86_64`) | [Download macOS (.dmg)](https://github.com/dhanji4U/sysper/releases/latest)   |
| **Linux**   | `.AppImage` / `.deb` / `.rpm` | x64 / ARM64                                  | [Download Linux](https://github.com/dhanji4U/sysper/releases/latest)          |

> [!NOTE]
> **Unsigned Release Instructions:**
>
> - **Windows:** SmartScreen may display "Unknown Publisher" &mdash; click **More info** &rarr; **Run anyway**.
> - **macOS:** Right-click `Emiote Sysper.app` &rarr; **Open**, or run `xattr -cr /Applications/Emiote\ Sysper.app`.
> - Unsigned builds are provided directly while automated code-signing workflows are established.

---

## Features

<table>
<tr>
<td width="50%" valign="top">

### 🛡️ OS Trash Only (Zero Permanent Deletes)

Sysper **never** invokes `rm -rf` or `fs::remove_dir_all`. Everything moved can be restored immediately from your OS Recycle Bin or Trash. On Windows, Sysper uses an atomic `$Recycle.Bin` rename to bypass modal locked-file freezes.

</td>
<td width="50%" valign="top">

### 🔒 Triple `.env` & Source Protection

Source code (`src/`, `app/`, `lib/`, `components/`) and version control (`.git/`) are pruned upfront. Triple-layer filters guarantee `.env` and `.env.*` files are never touched or scanned.

</td>
</tr>

<tr>
<td width="50%" valign="top">

### ⚡ Parallel High-Speed Sizing

Two-phase engine: single-threaded discovery prevents lock contention and accurately skips junk internals, followed by multi-threaded Rayon work-stealing to calculate multi-gigabyte folder sizes in seconds.

</td>
<td width="50%" valign="top">

### 💾 Crash-Resilient History Ledger

Every item moved to Trash is committed to an atomic `sysper:historyDraft` immediately. If you force-quit or lose power mid-clean, the ledger automatically recovers and records what made it to Trash on the next startup.

</td>
</tr>

<tr>
<td width="50%" valign="top">

### ⚠️ Target Rebuild Warning

Rust `target/` directories can take 30+ minutes to recompile. Sysper explicitly flags `target/` selections with a prominent amber alert before asking for confirmation.

</td>
<td width="50%" valign="top">

### 🌓 Tailwind v4 + Dark/Light Theme

Clean "1 black button" minimalist UI built with React 19, TypeScript, and Tailwind CSS v4. Supports manual dark mode toggle and respects OS accessibility `prefers-reduced-motion` settings.

</td>
</tr>
</table>

---

## What Sysper Cleans

Sysper scans only within the directory you explicitly choose (e.g. `~/code` or `D:\projects`):

| Category                    | Targets Scanned                                                 | Purpose                                                 |
| --------------------------- | --------------------------------------------------------------- | ------------------------------------------------------- |
| **JavaScript / TypeScript** | `node_modules`, `dist`, `build`, `out`                          | Dependencies and compiler build output                  |
| **Fullstack Frameworks**    | `.next`, `.nuxt`, `.output`, `.turbo`, `.vite`, `.parcel-cache` | Framework caches and server builds                      |
| **Python**                  | `__pycache__`, `.pytest_cache`                                  | Bytecode and test execution caches                      |
| **Rust**                    | `target`                                                        | Cargo compilation artifacts (with explicit warning)     |
| **Java / Android**          | `.gradle`                                                       | Gradle build caches and wrappers                        |
| **Diagnostics & OS**        | `logs/`, `coverage/`, `*.log`, `.DS_Store`, `Thumbs.db`         | Transient logfiles, coverage HTML, and thumbnail caches |

---

## Safety First: What Sysper Does vs Does NOT Do

| Sysper DOES                                          | Sysper DOES NOT                                     |
| ---------------------------------------------------- | --------------------------------------------------- |
| ✅ Moves files strictly to OS Trash / Recycle Bin    | ❌ NEVER permanently deletes (`no remove_dir_all`)  |
| ✅ Enforces triple-layer `.env` protection           | ❌ NEVER touches source files (`src`, `lib`, `app`) |
| ✅ Asks for user directory selection before scanning | ❌ NEVER scans without explicit user permission     |
| ✅ Emits atomic rollback on metadata failure         | ❌ NEVER requires signup, accounts, or telemetry    |
| ✅ Warns prominently before cleaning `target/`       | ❌ NEVER connects to the internet for free features |
| ✅ 100% offline, zero tracking, open source MIT      | ❌ NEVER displays ads, popups, or claims antivirus  |

---

## Run & Build Locally

### Prerequisites

- Node.js (LTS) with `pnpm` (`npm i -g pnpm`)
- Rust toolchain (`rustup default stable`)
- Platform C++ build tools (Visual Studio C++ build tools on Windows, Xcode on macOS, build-essential/webkit2gtk on Linux)

### Development

```bash
# Clone the repository
git clone https://github.com/dhanji4U/sysper.git
cd sysper

# Install dependencies
pnpm install

# Run Vite frontend + Tauri desktop app
pnpm tauri dev
```

### Quality Verification (Pre-Push Gate)

Sysper enforces strict automated gates. All commands must exit with 0 errors:

```bash
# 1. Typecheck + ESLint + Prettier format check
pnpm check

# 2. Run Vitest unit test suite (25 tests)
pnpm test

# 3. Run Rust backend unit test suite
cargo test --manifest-path src-tauri/Cargo.toml
```

### Production Build

```bash
pnpm tauri build
```

The compiled installer will be available in `src-tauri/target/release/bundle/`.

---

## Contributing

We welcome bug reports, edge case identifications, and accepted feature discussions!

1. **Bug or safety report?** Please [Open an Issue](https://github.com/dhanji4U/sysper/issues/new/choose). Real reports from real machines help us ensure 100% data safety.
2. **Feature idea?** Open an issue first to discuss scope before opening a PR.
3. **Pull Requests:** All contributions must adhere to our [Mandatory Engineering Lifecycle Protocol](AGENTS.md#13-mandatory-engineering-lifecycle-protocol). See [CONTRIBUTING.md](CONTRIBUTING.md) for full instructions.

---

## License

[MIT](LICENSE) &copy; Emiote. Part of [Emiote Tools](https://emiote.com) — privacy-first offline developer tools.
