# AGENTS.md — Markdown Viewer (proposed root file)

> Host may block writing root `AGENTS.md`. Copy this to repo root when approved:
> `cp docs/protocol/AGENTS.proposed.md AGENTS.md`

Project agent contract. Companion to `CONTEXT.md` and `HERMES.md`.  
Protocol base: [HappyMonkeyAI/AgentsProtocol](https://github.com/HappyMonkeyAI/AgentsProtocol).

## Role

Autonomous staff engineer on a **thin Windows 11 Electron markdown viewer** (double-click / Open With). Not a vault IDE.

## Grounding order

1. Code + tests (`main.js`, `preload.js`, `lib/`, `renderer/`, `tests/`, `scripts/smoke.js`)
2. `docs/adr/`
3. `CONTEXT.md`
4. Root `AGENTS.md` (this content) + `HERMES.md`
5. `SPEC.md` / `TASKS.md` / `DESIGN.md` / `PROGRESS.md`
6. `docs/research/` (reference only)
7. `.agent/memories/` (verify against code)

## Non-negotiables

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`
- Sanitize markdown HTML in main before IPC (no raw HTML to renderer)
- No vault tree / wikilinks / Basic Memory scope without ADR (use `kb-vault-ui`)
- No secrets in git, CONTEXT, LTM, or research notes (`.env` gitignored)
- Commit/push only when the user explicitly asks
- File associations need **NSIS install** + optional OS default-app; do not claim double-click default from unit tests alone

## Verify

```bash
npm test
npm run smoke
# UI: npx electron . fixtures/sample.md
# Package: npm run dist:dir | dist:portable | dist:nsis | dist
```

## Coordination

- Default: solo Hermes on main worktree
- Larger/parallel: **git worktrees** (`.worktrees/<id>`, branch `agent/<id>`) + **self-contained subcontext**
- Local leaf coding lane: OpenCode + Unsloth AgentWorld — `./scripts/lane-opencode-agentworld.sh` (see research note). Key in `.env` only.
- Parent re-runs tests after any lane; task-board complete ≠ acceptance
- Manifest lock swarm: only if user explicitly enables it

## LTM

- Store under `.agent/memories/`
- Reseed via `BOOTSTRAP.md`
- Never store tokens, private credential paths, or announce secrets

## Git

- Conventional commits preferred
- Do not force-push `master`/`main` unless user asks
- Ignore: `node_modules/`, `dist/`, `.env`, `.worktrees/`, coordination metadata

## Do not

- Enable nodeIntegration or disable contextIsolation
- Nest this app inside a markdown vault root
- Copy kb-vault-ui vault IPC by default
- Treat portable/unpacked builds as full shell-association installs
