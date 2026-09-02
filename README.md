# Markdown Viewer

Thin **Windows 11** desktop app to open and preview Markdown files (double-click / Open With / drag-drop).

## Agents Protocol

This repo follows [HappyMonkeyAI/AgentsProtocol](https://github.com/HappyMonkeyAI/AgentsProtocol).

| Doc | Purpose |
|-----|---------|
| [CONTEXT.md](./CONTEXT.md) | Operating manual — stack, non-negotiables, boundaries |
| [AGENTS.md](./AGENTS.md) | Agent rules (Agents Protocol) |
| [HERMES.md](./HERMES.md) | Hermes workflow + verify commands |
| [BOOTSTRAP.md](./BOOTSTRAP.md) | Reseed `.agent/memories/` from history |
| [SPEC.md](./SPEC.md) | Requirements + acceptance |
| [TASKS.md](./TASKS.md) | Phased work |
| [DESIGN.md](./DESIGN.md) | UI tokens |
| [PROGRESS.md](./PROGRESS.md) | Dated verification log |
| [docs/adr/](./docs/adr/) | Architecture decisions |
| `.agent/memories/` | Long-term agent memory |

## Stack

- **Electron** — shell, single-instance, file associations
- **marked** + **marked-highlight** + **highlight.js** — GFM + code coloring
- **DOMPurify** (+ jsdom in main) — sanitize HTML before IPC
- **electron-builder** — `dir` / portable / NSIS; associates `.md`, `.markdown`, `.mdown`

## Dev

```bash
npm install
npm test
npm run smoke
npm start
```

Open a file:

```bash
npx electron . fixtures/sample.md
```

## Package (Windows)

```bash
npm run dist:dir          # dist/win-unpacked/Markdown Viewer.exe
npm run dist:portable     # portable single EXE
npm run dist:nsis         # NSIS installer (file associations)
npm run dist              # dir + portable + nsis
```

| Artifact | Typical size | Use |
|----------|--------------|-----|
| `dist/win-unpacked/` | ~ unpacked tree | Local run / smoke packaged EXE |
| `dist/MarkdownViewer-0.1.0-portable.exe` | ~86 MB | Single-file carry (no shell association) |
| `dist/Markdown Viewer Setup 0.1.0.exe` | ~94 MB | Install + Start Menu / uninstall; **associations** |

**Icon:** `build/icon.ico` → `build.win.icon` (embedded when packaging; `signExecutable: false` so icon still applies without Authenticode).

**SmartScreen:** builds are **unsigned**. Windows may warn “Windows protected your PC” on first run — More info → Run anyway. That is not an app crash.

**Associations:** declared in `package.json` `build.fileAssociations` (`.md`, `.markdown`, `.mdown`). They register on **NSIS install** for the installing user. After install: run `powershell -ExecutionPolicy Bypass -File scripts/register-md-openwith.ps1` (user ProgId / Open with). If Windows has a locked UserChoice, also use Settings → Default apps or right-click → Open with → Always. Installed path: `%LOCALAPPDATA%\Programs\Markdown Viewer\`. `npm start` / portable / unpacked-dir alone do not own the system default handler.

Silent install smoke (advanced):  
`Setup.exe /S /D=C:\path\to\dir` then uninstall with `Uninstall Markdown Viewer.exe /S`.

## Security

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`
- Main process reads files and renders markdown; renderer gets sanitized HTML over IPC
- http(s) links open in the system browser; relative local **links** are not followed
- Relative **images** are inlined only if they resolve under the open file’s directory (no `..` escape), match an image extension, and are ≤2 MiB

## Scope (v0.2)

- Open one file (argv, dialog, drag-drop, second-instance); restore **last file** on launch
- Recents (menu + empty state), zoom persistence, Edit (VS Code / Notepad), Print
- GFM preview, relative images (sandboxed), light/dark theme, live reload on disk change
- Not a vault browser or wikilink graph (see **kb-vault-ui** for that)
