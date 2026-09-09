# Contributing

Sysper is **open source** so you can read the scanner and trash path. It is **not** a community-built product yet.

## If you use the app and find a problem

**Open a GitHub issue.** That is the contribution we want.

Include:

- OS (Windows / macOS / Linux) and version
- Sysper version (or `pnpm tauri dev`)
- Folder you scanned (you can redact names)
- What you expected vs what happened
- Whether anything went to Trash that should not have

Use the **Bug** template when you can. A short issue is better than no issue.

Safety / “it almost deleted source”: still use GitHub Issues, and say that in the title.

## Pull requests

Do not send a PR unless an issue already exists and a maintainer said it is wanted. Disk-touching code (`scanner.rs`, `trash.rs`) will not be merged without that.

Feature PRs (treemaps, extra junk types, UI rewrites) will likely be closed. File an issue instead.
