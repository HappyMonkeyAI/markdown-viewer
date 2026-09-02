# SPEC.md — Markdown Viewer

## Goal

Ship a trustworthy Windows markdown **viewer** that can become the OS handler for common markdown extensions after install.

## Functional requirements

| ID | Requirement | v0.1 |
|----|-------------|------|
| FR1 | Open `.md` / `.markdown` / `.mdown` (and related allowlisted ext) from argv | Yes |
| FR2 | File → Open dialog | Yes |
| FR3 | Drag-drop file onto window | Yes |
| FR4 | Second-instance focuses window and opens path | Yes |
| FR5 | GFM render: headings, emphasis, tables, fenced code, task lists | Yes |
| FR6 | Sanitize HTML (no script execution from document) | Yes |
| FR7 | Syntax highlighting for fenced code | Yes |
| FR8 | Light/dark theme | Yes |
| FR9 | Reload when file changes on disk | Yes |
| FR10 | http(s) links open in system browser | Yes |
| FR11 | electron-builder fileAssociations for installers | Declared |
| FR12 | Double-click works after NSIS install | Manual / packaging |
| FR13 | Custom app icon | No |
| FR14 | In-app edit | No |
| FR15 | Multi-file vault / wikilinks / search | No |

## Non-functional requirements

| ID | Requirement |
|----|-------------|
| NFR1 | Secure Electron defaults (isolation, sandbox, no nodeIntegration) |
| NFR2 | Headless unit + smoke tests without GUI automation |
| NFR3 | userData isolated under app name |
| NFR4 | Unsigned local builds acceptable; document SmartScreen |
| NFR5 | Keep dependency surface small; avoid vault-product scope creep |

## Acceptance (v0.1 code slice)

- [x] `npm test` — all pass
- [x] `npm run smoke` — all PASS
- [x] `npx electron . fixtures/sample.md` launches and stays up
- [ ] `npm run dist:dir` produces unpacked exe (not yet run in first slice)
- [ ] NSIS install + double-click `.md` (user/OS verification)

## Pre-mortem (packaging / association)

| Risk | Mitigation |
|------|------------|
| Associations missing after portable-only run | Document NSIS for handlers; keep portable for carry |
| Electron binary missing post-npm | `postinstall` + smoke checks `electron.exe` |
| SmartScreen blocks first run | Expected unsigned; not an app crash |
| Relative link opens file:// escape | Block non-http(s) in renderer + will-navigate guard |
| Scope creep into kb-vault-ui | CONTEXT is/is-not + ADR |

## Out of scope (until ADR)

- Tauri rewrite
- Markdown editing / save
- Sync, preview themes marketplace, plugins
- LAN features
