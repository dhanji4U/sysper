# AGENTS.md - Emiote Sysper (System Sweeper) - Complete Build Spec v3

## 1. Project Overview

**Product:** Emiote Sysper
**Full Name:** Emiote Sysper - System Sweeper
**Old Name:** LogSweeper (keep `emiote.com/logsweeper` 301 redirect to `/sysper`)
**Domain:** `emiote.com/sysper`
**Tagline:** Find the dust eating your memory. Free 50GB in 10 seconds.
**One Liner:** One-click cleaner for dev junk: node_modules, dist, build, logs that eat your laptop.
**License:** 100% Free & Open Source (MIT)
**Goal:** Free momentum product -> 2000 users -> 500 emails -> upsell to Keyper (paid local secret keeper)
**Brand:** Emiote: Privacy-first, offline, indie dev tools. No cloud, no tracking.

---

## 2. Tech Stack & Versions

**Website:** Astro v4.x, Tailwind CSS v3.x, File: src/pages/sysper/index.astro
**Desktop App:** Tauri v2.1+, React 19 + TypeScript + Vite, Rust
**Rust Crates:** trash=3.x (CRITICAL), walkdir=2.x, rayon=1.x, jwalk
**Bundlers:** .dmg (Mac), .msi/.exe (Win), .AppImage + .deb (Linux)

---

## 3. What Sysper DOES vs DOES NOT DO

### DOES - 100% Free Open Source Feature Set:

1. Folder Select: User picks root folder (~/code)
2. Deep Scan for: node_modules, dist, build, out, .next, .nuxt, .turbo, .parcel-cache, **pycache**, target, .gradle, logs, *.log, .DS_Store, coverage, Thumbs.db
3. Size Calculation: per folder + total
4. Grouping by type
5. Checkboxes + Select All
6. Clean: Move to OS Trash (NOT delete)
7. Success: Freed totals + confetti + history
8. History Page: last 10 cleans with crash-resilient ledger
9. Settings: Whitelist, Dark/Light theme
10. Safety warning: Moved to Trash
11. Offline: 100% offline, no telemetry
12. Roadmap additions: weekly auto-clean background job, system tray icon, history export

### DOES NOT DO - Strictly Avoid:

1. NEVER permanently delete. Only Trash. No fs::remove_dir_all
2. NEVER delete source code. Never touch src, lib, .git, app
3. NEVER scan without permission
4. NEVER touch .env files (Keyper's job)
5. NEVER require signup, login, or payments
6. NEVER need internet
7. NEVER auto-clean without confirmation
8. NEVER clean target silently: extra warning required
9. NEVER bloat UI: No ads, popups, or donation nag screens
10. NEVER claim antivirus

---

## 4. How It Works (User Flow)

Welcome -> Select Folder -> Scanning "Scanning 127 projects..." -> Results "47.3GB in 84 folders" grouped + checkboxes + Total Selected + [Clean to Trash] -> Confirmation "Move to Trash? Restorable" -> Cleaning progress -> Success "Freed 47.3GB! Total: 127GB" + [Share] + [Keyper Waitlist] -> History

**Rust Scanner (scanner.rs):**
walkdir single-threaded discovery to skip junk internals, followed by parallel Rayon sizing. Return Vec<FoundFolder {path, type, size}>

---

## 5. Folder Structure

Website:
src/pages/sysper/index.astro (main)
src/pages/logsweeper/index.astro (301 redirect)

App:
src-tauri/src/scanner.rs
src-tauri/src/trash.rs
src/components/ScanButton, ResultsList, SuccessPage, HistoryPage, SettingsPage

---

## 6. Landing Page Spec - emiote.com/sysper (Astro)

Sections:

1. Header: Emiote logo + [Sysper] [Keyper] [Tools] [GitHub]
2. Hero: Badge FREE Open Source Offline Trash, H1 Emiote Sysper, H2 System Sweeper, Sub Free 50GB, CTAs Mac/Win/Linux 8MB, Trust ⭐️ 47GB avg, Demo GIF 5s
3. What it cleans: Grid 3x2 node_modules, dist/build/.next, .turbo, **pycache**, target, logs
4. How it works: 3 steps Select, See 47GB, One Click Trash
5. Safety: 🛡️ Moves to Trash, restore, offline, open source
6. Comparison: Manual 2h vs Sysper 10s
7. Testimonials after 100 users
8. FAQ: safe? free? internet? unknown publisher? .env?
9. Email Capture: Keyper waitlist first 50 FREE
10. Final CTA + Footer

SEO: Title "Emiote Sysper - Free System Sweeper | Free 50GB in 10s", Description "Free offline tool...", OG image 47GB screenshot, Canonical /sysper, Redirect /logsweeper -> /sysper 301

---

## 7. Build Phases & Versions

**Phase 0 Setup v0.0.1:**

- Init Tauri app, add crates trash, walkdir, rayon, tailwind
- Set up automated pre-push checks and test frameworks

**Phase 1 MVP v1.0.0 (Released):**

- Build scanner.rs scan_folder(root) -> Vec, skip .git/src, junk list, size calc parallel, skip nested
- Build trash.rs move_to_trash(paths) via trash crate
- Build UI ScanButton dialog, Scanning progress, ResultsList grouped checkboxes, Confirm modal, Success confetti, History localStorage
- Build unsigned binaries: dmg, msi, exe, AppImage, deb, rpm

**Phase 2 Landing & Distribution v1.0.1:**

- Finish Astro landing all sections
- Add package manager manifests: Winget, Homebrew tap
- Deploy /sysper production

**Phase 3 Launch & Community v1.0.2:**

- Launch Reddit r/webdev r/rust r/SideProject, Product Hunt, Twitter video, HN Show HN
- Title: "I built a free offline tool that freed 47GB: Emiote Sysper"
- Monitor downloads, stars, and email captures for Keyper

**Phase 4 Signed Builds v1.1.0:**

- Sign Windows binaries using SignPath.io open-source signing program
- Use commercial revenue from Keyper to fund Apple Developer account ($99/year)
- Configure Tauri signing credentials and produce signed binaries for macOS Gatekeeper

**Phase 5 Keyper Commercial Companion & Ecosystem:**

- Keyper repository emiote/keyper: encrypted local .env vault
- Early-bird launch: $11 to $22 lifetime
- In-app cross promotion: Sysper remains 100% free; users can optionally install Keyper for secret management

---

## 8. Certificate Strategy

**Phase 1 Unsigned Releases:**
Documentation on landing and README:
Windows: More info -> Run anyway
macOS: Right-click Open -> Open, or xattr -cr /Applications/Emiote\ Sysper.app

**Phase 2 Community & Package Manager Delivery:**
Winget and Homebrew distribution bypass browser SmartScreen warnings.
SignPath foundation program provides free Windows certificate signing for public open-source builds.

**Phase 3 Unified Developer Identity:**
Apple Developer Account ($99/year) funded by Keyper sales signs both products under Emiote.

---

## 9. Do's and Don'ts for Agents

DO: <15MB binary, FAST scan <10s 100GB 100 projects rayon jwalk, Always Trash, Minimal UI 1 black button, Offline no telemetry, localStorage history, human readable size, confetti

DON'T: No remove_dir_all, Don't scan inside node_modules, Don't scan .git .vscode src, Don't touch .env, No internet login, No auto-clean without modal, Don't clean target without warning, No heavy deps, No ads popups, No donation nag screens, No antivirus claim

---

## 10. Success Metrics

Week 1: 2000 downloads, 500 emails, 50 stars
Trust: 0 data loss, all Trash restorable, 0 .env files touched

---

## 11. Checklist Files

- src/pages/sysper/index.astro main landing
- src/pages/logsweeper/index.astro 301 redirect
- src-tauri/src/scanner.rs
- src-tauri/src/trash.rs
- AGENTS.md this file root
- GitHub github.com/emiote/sysper public MIT
- OG image 1200x630 47GB screenshot

---

## 12. Final Brand Copy

H1 Emiote Sysper, H2 System Sweeper - Find the dust eating your memory, Sub Free up 50GB dev junk in 10s One click Trash safely 100% offline No signup, CTA Download Free Mac/Win/Linux 8MB, Trust ⭐️ 47GB avg freed 100% offline Trash Open Source, Next Tease Keyper 1Password for .env first 50 FREE Join waitlist, Footer Part of Emiote Tools Privacy-first offline dev tools Built Tauri+Rust

---

## 13. Mandatory Engineering Lifecycle Protocol

Every task (defect fix, new feature, or routine content elevation) MUST strictly follow this exact lifecycle:

| Protocol Stage                    | Mandatory Rule Enforced                                                                                                                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1. Pre-Flight Status**          | Start from clean main (`git checkout main && git pull origin main --ff-only`).                                                                                                                   |
| **2. Issue First**                | Mandatory GitHub Issue (`gh issue create`) defining evidence, severity, and acceptance contract before writing code.                                                                             |
| **3. Branch Isolation**           | `fix/issue-<num>-<slug>` for defects, `feat/<slug>` for new features, `chore/<slug>` or `docs/<slug>` for routine tasks.                                                                         |
| **4. Local Pre-Push Gate**        | Never push without passing `pnpm check` (0 errors), `pnpm test` (all tests pass), and `cargo check/test`.                                                                                        |
| **5. Conventional Commits**       | Strict format: `fix(scope): ... (closes #<num>)` or `feat(scope): ... (<72 chars, imperative tense)`.                                                                                            |
| **6. Coldtea PR Lens**            | Every PR is pushed and marked Ready for review (`gh pr ready <num>`) so Coldtea PR Lens automatically renders visual architectural diagrams.                                                     |
| **7. CI Watching & Self-Healing** | Autonomously monitor `gh pr checks --watch`. If CI fails, diagnose root cause via `gh run view --log-failed`, resolve locally, and push until green.                                             |
| **8. Human Approval Gate**        | Never auto-merge into main without explicit user request. Deliver the green, verified PR link for final review.                                                                                  |
| **9. PR Completion Comment**      | ALWAYS post a comprehensive summary comment on the GitHub PR (`gh pr comment <num> --body "..."`) upon completion/merge detailing all gates passed, root causes resolved, and changes delivered. |

---

END v3
