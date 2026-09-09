# AGENTS.md - Emiote Sysper (System Sweeper) - Complete Build Spec v2

## 1. Project Overview

**Product:** Emiote Sysper
**Full Name:** Emiote Sysper - System Sweeper
**Old Name:** LogSweeper (keep `emiote.com/logsweeper` 301 redirect to `/sysper`)
**Domain:** `emiote.com/sysper`
**Tagline:** Find the dust eating your memory. Free 50GB in 10 seconds.
**One Liner:** One-click cleaner for dev junk - node_modules, dist, build, logs that eat your laptop.
**Goal:** Free momentum product -> 2000 users -> 500 emails -> fund certs ($184) via sponsorship -> upsell to Envault (paid)
**Brand:** Emiote - Privacy-first, offline, indie dev tools. No cloud, no tracking.

---

## 2. Tech Stack & Versions

**Website:** Astro v4.x, Tailwind CSS v3.x, File: src/pages/sysper/index.astro
**Desktop App:** Tauri v2.1+, React 18 + TypeScript + Vite, Rust
**Rust Crates:** trash=3.x (CRITICAL), walkdir=2.x, rayon=1.x, jwalk
**Bundlers:** .dmg (Mac), .msi/.exe (Win), .AppImage + .deb (Linux)
**Payments:** LemonSqueezy - sponsor-5, sponsor-10, sponsor-25

---

## 3. What Sysper DOES vs DOES NOT DO

### DOES - V1.0 FREE MVP (Current Phase):

1. Folder Select: User picks root folder (~/code)
2. Deep Scan for: node_modules, dist, build, out, .next, .nuxt, .turbo, .parcel-cache, **pycache**, target, .gradle, logs, *.log, .DS_Store
3. Size Calculation: per folder + total
4. Grouping by type
5. Checkboxes + Select All
6. Clean: Move to OS Trash (NOT delete)
7. Success: Freed 47GB + confetti + history
8. History Page: last 10 cleans
9. Sponsor Tab: Progress $/184 + sponsor buttons
10. Settings: Whitelist, Dark/Light
11. Safety warning: Moved to Trash
12. Offline: 100% offline, no telemetry

**V1.1 PRO ($17) - After 2000 users:**
Auto-clean weekly, extra types (logs/cache/target), one-click clean all, whitelist, export, tray icon

### DOES NOT DO - Strictly Avoid:

1. NEVER permanently delete - Only Trash. No fs::remove_dir_all
2. NEVER delete source code - Never touch src, lib, .git, app
3. NEVER scan without permission
4. NEVER touch .env files (Envault's job)
5. NEVER require signup/login for free
6. NEVER need internet
7. NEVER auto-clean without confirmation
8. NEVER clean target silently - extra warning
9. NEVER bloat UI - No ads/popups
10. NEVER claim antivirus

---

## 4. How It Works (User Flow)

Welcome -> Select Folder -> Scanning "Scanning 127 projects..." -> Results "47.3GB in 84 folders" grouped + checkboxes + Total Selected + [Clean to Trash] -> Confirmation "Move to Trash? Restorable" -> Cleaning progress -> Success "Freed 47.3GB! Total: 127GB" + [Share] + [Envault Waitlist] -> History

**Rust Scanner (scanner.rs):**
walkdir + rayon parallel, if name in junk list -> calc size, add to results, skip recursion inside it, else continue. Return Vec<FoundFolder {path, type, size}>

---

## 5. Folder Structure

Website:
src/pages/sysper/index.astro (main)
src/pages/sysper/thanks.astro (post-sponsor)
src/pages/logsweeper/index.astro (301 redirect)

App:
src-tauri/src/scanner.rs
src-tauri/src/trash.rs
src/components/ScanButton, ResultsList, SuccessPage, SponsorPage, HistoryPage, SettingsPage

---

## 6. Landing Page Spec - emiote.com/sysper (Astro)

Sections:

1. Header: Emiote logo + [Sysper] [Envault] [Tools] [GitHub]
2. Hero: Badge FREE No signup Offline Trash, H1 Emiote Sysper, H2 System Sweeper, Sub Free 50GB, CTAs Mac/Win/Linux 8MB, Trust ⭐️ 47GB avg, Demo GIF 5s
3. Sponsor Bar: ❤️ Help get Verified Publisher, Text certs cost $184, Progress Bar $112/$184, Buttons Sponsor $5/$10/$25 LemonSqueezy, Perk Envault FREE + name
4. What it cleans: Grid 3x2 node_modules, dist/build/.next, .turbo, **pycache**, target, logs
5. How it works: 3 steps Select, See 47GB, One Click Trash
6. Safety: 🛡️ Moves to Trash, restore, offline, open source
7. Comparison: Manual 2h vs Sysper 10s
8. Testimonials after 100 users
9. FAQ: safe? free? internet? unknown publisher? .env?
10. Email Capture: Envault waitlist first 50 FREE
11. Final CTA + Footer + Sponsors list #sponsors

SEO: Title "Emiote Sysper - Free System Sweeper | Free 50GB in 10s", Description "Free offline tool...", OG image 47GB screenshot, Canonical /sysper, Redirect /logsweeper -> /sysper 301

---

## 7. Build Phases & Versions

**Phase 0 Setup Day1 v0.0.1:**

- Create Astro page /sysper/index.astro hero placeholders
- Create /logsweeper redirect
- Init Tauri app, add crates trash, walkdir, rayon, tailwind
- Output: Empty window, Astro local

**Phase 1 MVP FREE Day2-3 v1.0.0-free-unsigned:**

- Build scanner.rs scan_folder(root) -> Vec, skip .git/src, junk list, size calc parallel, skip nested
- Build trash.rs move_to_trash(paths) via trash crate
- Build UI ScanButton dialog, Scanning progress, ResultsList grouped checkboxes, Confirm modal, Success confetti share Twitter, History localStorage
- Test ~/code 10 projects, verify trash
- Build tauri build -> dmg unsigned, msi unsigned, AppImage
- Output: v1.0.0 binaries

**Phase 2 Landing + Sponsor Day4 v1.0.1-landing:**

- Finish Astro landing all sections
- Create LemonSqueezy sponsor-5/10/25 donation
- Add sponsor bar manual progress, thanks.astro
- Deploy /sysper production
- Output: Landing live

**Phase 3 Launch + Fund Day5-6 v1.0.2-launch:**

- Launch Reddit r/webdev r/rust r/SideProject, Product Hunt, Twitter 15s video, HN Show HN
- Title: "I built free tool that freed 47GB - Emiote Sysper"
- Monitor downloads, sponsor $0->$184, emails 500 goal
- Output: 2000 users, $184 raised

**Phase 4 Signed Day7-10 v1.1.0-signed:**

- Trigger $184 reached
- Buy Windows OV cert SSL.com $84 pfx thumbprint
- Apple Dev $99 Team ID cert
- Update tauri.conf.json windows.certificateThumbprint + macos signing env APPLE_ID/PASSWORD/TEAM_ID
- Build signed dmg msi
- Update landing: Remove warning guide, badge ✅ Verified Publisher Emiote
- Update app sponsor tab to celebration "🎉 Goal Reached! Thanks sponsors list"
- Post celebration update
- Output: v1.1.0 signed trusted

**Phase 5 PRO + Envault Week2+ v1.2.0-pro & v0.1.0-envault:**

- Sysper PRO $17 auto-clean, extra types, whitelist, tray, LemonSqueezy license
- Envault repo emiote/envault Tauri, encrypted .env vault, pricing 50 FREE $11 $17 etc, landing /envault
- Bundle Sysper Pro + Envault $29
- Output: First revenue

---

## 8. Certificate Strategy

**Problem:** Win SmartScreen Unknown Publisher, Mac Gatekeeper cannot check

**Phase1 Unsigned $0:**
Guide on landing:
Windows: More info -> Run anyway, open source github.com/emiote/sysper
Mac: Right-click Open -> Open, or xattr -cr /Applications/Emiote\ Sysper.app

**Phase2 Signed $184/year:**
Win OV cert thumbprint in tauri.conf.json, Mac APPLE_ID env notarize, tauri build signed

**Sponsor Rules:**
Goal $184 one-time progress bar push, when hit STOP campaign, change to "🎉 $184 Goal Reached! Certs bought. Next build verified. Sponsors: list. Cert sponsor closed." Then forever monthly "Support Emiote Tools $5/mo" via GitHub Sponsors

---

## 9. Pricing Ladder (FOMO)

50 FREE momentum, 100 $11, 200 $17, 300 $19, 400 $20, 500 $21, After $22 lifetime
Counter "32/50 FREE left", Bundle Pro+Envault $29, Sysper FREE basic forever

---

## 10. Do's and Don'ts for Agents

DO: <15MB binary, FAST scan <10s 100GB 100 projects rayon jwalk, Always Trash, Minimal UI 1 black button, Astro <100KB JS Lighthouse 95+, Sponsor heart not intrusive, Offline no telemetry, localStorage history, human readable size, confetti

DON'T: No remove_dir_all, Don't scan inside node_modules, Don't scan .git .vscode src, Don't touch .env, No internet login free, No auto-clean without modal, Don't clean target without warning, No heavy deps, No ads popups, No antivirus claim, No heavy landing anim

---

## 11. Success Metrics

Week1: 2000 downloads, 500 emails, $184 sponsor, 50 stars
Month1: 5000 downloads, 1000 emails, 50 Envault early, 20 PRO $17 = $340
Trust: 0 data loss, all Trash restorable, 0 .env touched

---

## 12. Checklist Files

- src/pages/sysper/index.astro main landing
- src/pages/logsweeper/index.astro 301 redirect
- src/pages/sysper/thanks.astro thanks + waitlist
- src-tauri/src/scanner.rs
- src-tauri/src/trash.rs
- src/components/SponsorPage.tsx
- AGENTS.md this file root
- GitHub github.com/emiote/sysper public MIT
- LemonSqueezy sponsor-5/10/25
- OG image 1200x630 47GB screenshot

---

## 13. Final Brand Copy

H1 Emiote Sysper, H2 System Sweeper - Find the dust eating your memory, Sub Free up 50GB dev junk in 10s One click Trash safely 100% offline No signup, CTA Download Free Mac/Win/Linux 8MB, Trust ⭐️ 47GB avg freed 100% offline Trash Open Source, Sponsor CTA ❤️ Help get Verified Publisher $112/$184 Sponsors get Envault FREE, Next Tease Envault 1Password for .env first 50 FREE Join waitlist, Footer Part of Emiote Tools Privacy-first offline dev tools Built Tauri+Rust

END v2
