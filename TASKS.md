# TASKS.md — Markdown Viewer

## Phase 0 — Agents Protocol packet

- [x] `CONTEXT.md`, `AGENTS.md`, `BOOTSTRAP.md`, `SPEC.md`, `TASKS.md`, `DESIGN.md`, `PROGRESS.md`
- [x] `docs/adr/` initial ADRs
- [x] `docs/research/` links + sources
- [x] `.agent/memories/` seeded from v0.1 implementation
- [x] README points at protocol spine

## Phase 1 — v0.1 viewer (code) — DONE 2026-09-02

- [x] Electron main/preload/renderer shell
- [x] Path helpers + markdown pipeline
- [x] Open: argv, dialog, drop, second-instance
- [x] Theme, watch reload, external links
- [x] Unit tests + smoke
- [x] fileAssociations declared in electron-builder config
- [x] Initial git commit `7bc9752`

## Phase 2 — Packaging polish

- [x] Add `build/icon.ico` + wire `build.win.icon` (+ include in `files`)
- [x] Run `npm run dist:dir`; confirm `dist/win-unpacked/Markdown Viewer.exe`
- [x] Portable + NSIS artifacts (`dist:portable`, `dist:nsis`; `dist` builds all three)
- [x] Silent NSIS install/uninstall smoke to temp prefix (EXE + uninstaller present)
- [x] Install NSIS to `%LOCALAPPDATA%\Programs\Markdown Viewer`
- [x] Register user Open With / ProgId (`.md`/`.markdown`/`.mdown`) via `scripts/register-md-openwith.ps1`
- [x] Smoke: opening `fixtures/sample.md` launches Markdown Viewer
- [ ] Optional: if another app holds UserChoice, set default in Windows Settings UI
- [x] Document SmartScreen / unsigned + associations in README

## Phase 3 — Product extras — DONE 2026-09-02

- [x] Print (File → Print / Ctrl+P; system print dialog → PDF if chosen)
- [x] Remember last file / recent list (`userData/prefs.json`, File → Open recent, empty-state list)
- [x] Zoom persistence (toolbar + Ctrl+=/−/0; stored in prefs)
- [x] Relative image resolution from file directory (sandboxed: under note dir, image ext, ≤2MiB → data URL)
- [x] Explicit “open with default editor” (VS Code if on PATH, else Notepad; Ctrl+E / Edit button)
- [x] Relative `.md` links in-app + Back (Alt+Left); fixed `extractOpenPathFromArgv` for CLI/double-click open

## Phase 4 — Explicit non-goals unless ADR

- Vault tree, wikilinks, Basic Memory, multi-root workspace → use/extend `kb-vault-ui` instead
