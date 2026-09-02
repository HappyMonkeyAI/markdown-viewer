# HERMES.md — Hermes workflow for Markdown Viewer

Companion to `CONTEXT.md`. Use when this repo is driven from Hermes Agent.

Canonical agent rules: **`AGENTS.md`**. This file adds Hermes-specific verify/packaging/lane commands.

## Grounding order

1. `README.md`
2. `CONTEXT.md`
3. `AGENTS.md`
4. `docs/adr/*` as needed
5. `.agent/memories/patterns_and_lessons.md`

## Verify after code changes

```bash
npm test
npm run smoke
```

UI path changes: also `npx electron . fixtures/sample.md` (manual look).

## Packaging

```bash
npm run dist:dir       # unpacked
npm run dist:portable
npm run dist:nsis      # associations
npm run dist           # all three
```

Associations need NSIS + optional OS default-app setting. Unsigned → SmartScreen once.

## Memory

LTM lives under `.agent/memories/`. Reseed via `BOOTSTRAP.md`.  
Do not store secrets, tokens, or private absolute credential paths in LTM.

## Voice announce (session)

Host Agent Voice daemon may be used for executive summaries. Prefer token-safe `avt-announce` CLI; never commit announce tokens into this repo.

## Git

Commit/push only when the user explicitly asks.

## Multi-agent (optional)

Default is solo Hermes. For larger or parallel work (pattern that worked well on bigger host projects):

1. **Git worktree per lane:** `.worktrees/<task-id>` on branch `agent/<task-id>` (or equivalent). Prefer this over in-place file locks.
2. **Subcontext per worker:** pass a self-contained brief (goal, owned paths, out-of-scope, verify commands, CONTEXT pointers). Do not assume shared chat history; `delegate_task` / CLI workers get only what you put in context.
3. Non-overlapping file ownership; hub files (`package.json`, `main.js`) serialize or stay with the parent.
4. After lanes finish: **final integration pass** on the integration branch (tests + smoke + cross-file glue). Parent verifies; do not trust worker self-report or task-board complete alone.
5. CLI routing: host MCP `suggest_cli_for_task` / teamwork `profiles/`; user-named CLI wins.
6. **OpenCode + AgentWorld lane (local):** see `docs/research/2026-09-02-opencode-agentworld-lane.md`.  
   `cp .env.example .env` → set `UNSLOTH_API_KEY` (+ `UNSLOTH_STUDIO_URL`) → `./scripts/lane-opencode-agentworld.sh`  
   Optional isolated tree: `./scripts/lane-opencode-agentworld.sh --worktree <task-id>`  
   Studio URL from env (example default `http://127.0.0.1:8888`); model `Qwen-AgentWorld-35B-A3B-GGUF:UD-IQ4_NL`. Parent still runs verify.
7. Manifest lock/task-board scripts: only if explicitly enabling same-worktree swarm (see CONTEXT + research note).
