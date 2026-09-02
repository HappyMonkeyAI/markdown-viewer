# Markdown Viewer

Thin **Windows 11** desktop app to open and preview Markdown files — double-click, Open With, drag-and-drop, or `npm start`.

**v0.2.x** · [MIT License](./LICENSE) · Electron + GFM (marked) · sanitized HTML (DOMPurify)

## Features

- Open one `.md` / `.markdown` / `.mdown` file (argv, dialog, drop, second-instance)
- GitHub-Flavored Markdown, fenced code highlighting, light/dark theme
- Relative **images** (sandboxed under the note folder) and relative **`.md` links** (in-app + Back)
- Recents + restore last file, zoom, Find (Ctrl+F), heading outline (Ctrl+Shift+O)
- Edit in VS Code / Notepad, Print, live reload when the file changes on disk
- NSIS installer + portable EXE; optional user-level Open With registration script

**Not in scope:** vault tree, wikilinks, multi-root workspace editing (use a dedicated vault app).

## Quick start (dev)

```bash
npm install
npm test
npm run smoke
npm start
# or:
npx electron . fixtures/sample.md
```

Requires Node.js 18+ and Windows x64 for packaging targets.

## Install (Windows)

**Prebuilt:** [GitHub Release v0.2.3](https://github.com/HappyMonkeyAI/markdown-viewer/releases/tag/v0.2.3) (NSIS + portable). Builds are **unsigned** — SmartScreen may require More info → Run anyway. Playbook for other projects: [`docs/release-windows-unsigned.md`](./docs/release-windows-unsigned.md).

```bash
npm run dist:nsis       # dist/Markdown Viewer Setup <version>.exe
npm run dist:portable   # dist/MarkdownViewer-<version>-portable.exe
npm run dist:dir        # unpacked dir for local smoke
npm run dist            # all three
```

| Artifact | Use |
|----------|-----|
| `Markdown Viewer Setup *.exe` | Install + Start Menu / uninstall; best path for **file associations** |
| `MarkdownViewer-*-portable.exe` | Single-file carry (no shell association by itself) |
| `dist/win-unpacked/` | Local run of packaged tree |

After NSIS install, associations are stronger if you also run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/register-md-openwith.ps1
```

Installed path: `%LOCALAPPDATA%\Programs\Markdown Viewer\`.

**SmartScreen:** builds are **unsigned**. Windows may show “Windows protected your PC” on first run — More info → Run anyway. That is not an application crash.

**Default apps:** if another program owns `.md` via locked UserChoice, use Settings → Default apps or right-click → Open with → Always.

Silent install (advanced): `Setup.exe /S /D=C:\path\to\dir` then uninstall with `Uninstall Markdown Viewer.exe /S`.

## Security model

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`
- Main process reads files and renders markdown; renderer receives **sanitized** HTML over IPC
- http(s) links open in the system browser
- Relative markdown links open in-app; non-markdown relative targets are rejected
- Relative images inlined only under the open file’s directory, image extensions only, ≤2 MiB

## Configuration / agent lane (optional)

Local OpenCode + Unsloth AgentWorld helpers are optional and **not required** to run the viewer:

```bash
cp .env.example .env   # set UNSLOTH_STUDIO_URL + UNSLOTH_API_KEY for your studio
./scripts/lane-opencode-agentworld.sh --dry-run
```

Never commit `.env`. Defaults in examples use placeholders (`http://127.0.0.1:8888`), not a private LAN host.

## For AI agents / maintainers

This repo also carries an [Agents Protocol](https://github.com/HappyMonkeyAI/AgentsProtocol)-style spine:

| Doc | Purpose |
|-----|---------|
| [CONTEXT.md](./CONTEXT.md) | Operating manual — stack, non-negotiables |
| [AGENTS.md](./AGENTS.md) | Agent rules |
| [HERMES.md](./HERMES.md) | Hermes verify / packaging / lane commands |
| [SPEC.md](./SPEC.md) / [TASKS.md](./TASKS.md) / [PROGRESS.md](./PROGRESS.md) | Requirements and log |
| [docs/adr/](./docs/adr/) | Architecture decisions |
| [THIRD_PARTY.md](./THIRD_PARTY.md) | Major dependency licenses |

Verify: `npm test && npm run smoke`.

## License

[MIT](./LICENSE) © 2026 Stephen Phillips.

Application dependencies remain under their own licenses (see [THIRD_PARTY.md](./THIRD_PARTY.md) and `package-lock.json`).
