# CONTEXT.md — Markdown Viewer operating manual

## Source of truth (highest → lowest)

1. **Code + tests** — `main.js`, `preload.js`, `lib/`, `renderer/`, `tests/`, `scripts/smoke.js`
2. **ADRs** — `docs/adr/`
3. **This file** — product boundaries, stack, non-negotiables
4. **AGENTS.md / HERMES.md** — agent workflow (HERMES.md stands in if AGENTS.md is blocked on host)
5. **SPEC.md / TASKS.md / DESIGN.md** — intent and sequencing (may lag code briefly)
6. **Plans** — `.hermes/plans/` (sequencing only)
7. **Research** — `docs/research/` (reference only; never canonical)
8. **Agent LTM** — `.agent/memories/` (session continuity; verify against code)

Protocol: [HappyMonkeyAI/AgentsProtocol](https://github.com/HappyMonkeyAI/AgentsProtocol)

## Product goal

Local **Windows 11** desktop app to **open and preview Markdown** by double-click / Open With / drag-drop / File → Open. Default system md viewer, not a vault IDE.

**Thesis:** One secure Electron window that renders GFM safely and associates with `.md` files after install.

## Is / is-not

| Is | Is not |
|----|--------|
| Single-file markdown **viewer** | Editor / IDE (no CodeMirror unless explicitly scoped later) |
| Double-click / file-association target | Network service or daemon |
| Sibling-friendly to `kb-vault-ui` | Second vault browser / wikilink graph / Basic Memory UI |
| Packaged Windows app (dir / portable / NSIS) | Cross-platform release requirement for v0.x |

## Stack & runtime

| Layer | Choice |
|-------|--------|
| Shell | Electron ≥37 (`main.js`) |
| Preload | `preload.js` — `contextBridge` only |
| Render | Static `renderer/` HTML/CSS/JS (no React/Vite in v0.1) |
| Parse | `marked` + `marked-highlight` + `highlight.js` |
| Sanitize | `DOMPurify` via `jsdom` **in main** |
| Paths | `lib/paths.js` — ext allowlist + argv extraction |
| Package | `electron-builder` — win x64 dir / portable / NSIS |
| Associations | `.md`, `.markdown`, `.mdown` (`package.json` → `build.fileAssociations`) |
| Tests | Node test runner + headless smoke (no GUI automation required) |

**Workspace:** `C:\Users\steph\Documents\development\markdown-viewer`  
**Platform:** Windows 11 · Node 24.x available · npm  
**userData:** `%APPDATA%\markdown-viewer` (isolated Chromium caches)

## Architecture (v0.1)

```
argv / dialog / drop / second-instance
        ↓
   main.js  (single-instance lock, FS read, watch, render)
        ↓ IPC (preload)
   renderer (display sanitized HTML, theme, toolbar)
```

- **Main owns FS and markdown→HTML.** Renderer never sees Node or raw file bytes beyond what IPC sends (`html`, `title`, `path`, `name`).
- **Security defaults:** `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, restrictive CSP, http(s) only for `shell.openExternal`.
- **Single-instance:** second launch focuses existing window and opens the new path.
- **Live reload:** `fs.watch` + ~400ms debounce; re-render and notify renderer.

## Non-negotiable rules

1. Do not enable `nodeIntegration` or disable `contextIsolation` on the BrowserWindow.
2. Do not render unsanitized markdown HTML.
3. Do not treat this repo as a vault shell — no recursive vault root, BM search, or wikilink index unless product scope changes via ADR.
4. File associations require a **packaged install** (NSIS); `npm start` alone does not register OS handlers.
5. After `npm install`, ensure Electron binary exists (`postinstall` → `node_modules/electron/install.js`). Agent/allow-scripts policy may skip installs — re-run install script if `electron.exe` missing.
6. No secrets in git, CONTEXT, or `.agent/memories/`.
7. Commits/pushes only when the user explicitly asks (host override vs upstream “autonomous ratchet”).
8. Prefer small verified slices; update CONTEXT + ADR when architecture changes.

## Verification baseline

```bash
npm test
npm run smoke
npm start
# optional open path:
npx electron . fixtures/sample.md
# package (unsigned → possible SmartScreen once):
npm run dist:dir
```

Claims about double-click open need a packaged NSIS install + manual OS check, not unit tests alone.

## Sibling projects

| Repo | Relationship |
|------|----------------|
| `kb-vault-ui` | Vault browser over `kb_vault` — thicker product; steal Electron security/packaging patterns only |
| `agent-voice-tts` | Unrelated runtime; session voice announce is host tooling, not this app |
| AgentsProtocol upstream | Docs/LTM shape only |

## What not to do

- Do not nest this app **inside** a markdown vault root (pollutes indexes).
- Do not bundle a second Chromium stack “framework” without need (keep thin).
- Do not open arbitrary non-md paths or follow local relative links as navigation (v0.1 blocks relative local links).
- Do not claim Windows-default-handler complete without install + association proof.
- Do not copy kb-vault-ui vault IPC surface by default.
- Do not put bearer tokens or LAN announce credentials in this repo.

## Entry points

| Path | Role |
|------|------|
| `main.js` | Window, menu, IPC, open/watch/render |
| `preload.js` | `window.mdViewer` bridge |
| `lib/paths.js` | Markdown path / argv helpers |
| `lib/markdown.js` | marked + highlight + DOMPurify factory |
| `renderer/` | UI shell |
| `fixtures/sample.md` | Dev/demo content |
| `tests/` | Unit tests |
| `scripts/smoke.js` | Headless gates |

## Multi-agent coordination

Default: **single primary agent (Hermes)**. Parallel or large multi-slice work uses **git worktrees + subcontext** (proven on larger sibling projects), not in-place lock swarms.

| Mode | When | How |
|------|------|-----|
| Solo | Day-to-day / thin slices | One owner; main worktree |
| Worktree + subcontext | Larger projects, parallel lanes, reviewable merges | One `.worktrees/<task-id>` + `agent/<task-id>` branch per lane; **self-contained subcontext** (goal, paths, constraints, verify commands) — workers do not inherit parent chat; parent merges after independent verify |
| OpenCode AgentWorld | Local leaf coding via Unsloth Studio | `./scripts/lane-opencode-agentworld.sh` (+ optional `--worktree`); key in `.env`; research note `2026-09-02-opencode-agentworld-lane.md` |
| Manifest / task board | Only if explicitly requested for same-worktree parallel edit | Claim → lock → build/test → unlock; metadata gitignored |

**Why worktrees + subcontext win for larger work:** filesystem isolation beats file locks; clean branch history; subcontext keeps workers focused and avoids cross-talk; parent remains the acceptance gate.

Do **not** mix modes casually. Task-board `completed` is a coordination signal, not acceptance — parent re-runs `npm test` + `npm run smoke`.  
Canonical swarm templates/profiles: HappyMonkeyAI/ai-agent-teamwork-prompt (local: `happymonkey/ai-agent-teamwork-prompt`). Full review: `docs/research/2026-09-02-ai-agent-teamwork-prompt.md`.  
Do not expose task boards, locks, or coordination scripts through the viewer product surface.

## Resolved decisions

- Thin Electron (not Tauri) for speed-to-association — ADR 0001
- Render in main with jsdom (not renderer-bundled marked) — ADR 0001
- Agents Protocol LTM under `.agent/memories/` — ADR 0002
- Parallel/large work: worktrees + subcontext preferred; manifest deferred — research 2026-09-02 + host practice
