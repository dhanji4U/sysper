# Emiote Sysper

One-click cleaner for **dev junk** — `node_modules`, `dist`, `build`, `.next`, `target`, logs. Moves to **OS Trash** (never permanent delete). 100% offline, no signup.

**Used it and something was wrong? [Open an issue](https://github.com/dhanji4U/sysper/issues/new/choose).** That is the main way to help. If a scan missed junk, skipped a folder, showed a Windows dialog, or touched something it should not — file it. Real reports from real machines matter more than drive-by PRs.

## Safety

- Trash / Recycle Bin only — no `remove_dir_all`
- Never touches `.env`, `src`, `lib`, `.git`, `app`
- Extra warning before `target/`
- You pick the folder; nothing is scanned without that

## Run locally

```bash
pnpm install
pnpm tauri dev
```

Build:

```bash
pnpm tauri build
```

Windows installers land in `src-tauri/target/release/bundle/`. Unsigned until code-signing certs are funded.

## Issues vs pull requests

| You found… | Do this |
| --- | --- |
| A bug, a bad skip, a wrong folder, a crash | **[Open an issue](https://github.com/dhanji4U/sysper/issues/new/choose)** |
| A feature idea | Open an issue first (do not send a PR) |
| A code change | Wait until an issue is accepted — unsolicited PRs may not be reviewed |

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. Part of [Emiote](https://emiote.com) — privacy-first offline dev tools.
