# Research: HappyMonkeyAI/ai-agent-teamwork-prompt

**Checked:** 2026-09-02  
**URL:** https://github.com/HappyMonkeyAI/ai-agent-teamwork-prompt  
**Local clone:** `C:\Users\steph\happymonkey\ai-agent-teamwork-prompt`  
**License:** MIT (see clone `LICENSE`)  
**Maturity:** `v0.1.0-beta` — early coordination template, not a product runtime

## What it is

Lightweight **multi-agent coordination** layer: plain files + locks + shared task board. No central orchestrator required. Sibling to Agents Protocol docs/LTM spine; focused on **swarm workers** rather than single-agent memory.

## Inventory (local clone)

| Artifact | Role |
|----------|------|
| `setup-prompt.txt` | Doc structure bootstrap (README/CONTEXT/research/ADRs) |
| `bootstrap-project-prompt.md` | Full project + coordination init |
| `bootstrap-agent-prompt.md` | Worker join: claim → lock → build → verify → unlock |
| `final-review-prompt.md` | Integration pass after task board “done” |
| `templates/AGENTS.md` | Swarm worker rules + CLI profile routing table |
| `templates/checks.json` | Path→lane config for changed-aware validation |
| `scripts/check_changed.py` | Run only matching validation lanes (argv arrays, concurrent) |
| `profiles/*.yaml` | codex / agy / opencode / kiro / grok / hermes routing |
| `docs/agent-cli-profiles.md` | Heuristics + MCP `suggest_cli_for_task` |
| `.agent-manifest.json` / `.agent-status.md` | Lock/status samples (local-only) |

**Note:** This clone’s `scripts/` only ships `check_changed.py`. Full `tasks.py` / `lock.py` / `init.py` are referenced from a separate multi-agent-coordination skill path in the bootstrap prompt — do not assume they live in this repo root.

## Concepts worth keeping

1. **Two modes, pick one:** *manifest* (file locks + task board, rapid parallel) vs *branch* (worktrees/branches, clean merges). Do not mix casually.
2. **Claim → lock → work → real verify → unlock** — `verify-complete` is filesystem-only; build/tests are mandatory and separate.
3. **Final review agent** after board green — catches glue gaps task-complete misses.
4. **Changed-aware lanes** (`check_changed` + `checks.json`) — argv-only commands, no shell strings.
5. **CLI profiles + AGENT_ID** — parallel lanes without clobbering; user-named CLI wins over auto-route.
6. **Coordination metadata gitignored** — signals for agents, not product truth or CI proof.

## Fit for markdown-viewer

This repo is a **thin Windows Electron viewer**, mostly **single primary agent** (Hermes), with occasional delegated lanes. Full swarm overhead is usually wrong-sized.

| Element | Verdict | Why |
|---------|---------|-----|
| Agents Protocol spine (already here) | Keep | Overlaps setup-prompt; we already have CONTEXT/HERMES/ADRs/LTM |
| Branch / worktree mode as default | **Adopt** | Host practice: git worktrees + subcontext worked well on larger projects; clean history; matches solo + `delegate_task` |
| Subcontext per worker | **Adopt** | Self-contained goal/paths/verify; no inherited parent chat — pairs with worktrees |
| Manifest/task-board/locks | **Defer** | Only when explicitly same-worktree parallel edit |
| `final-review-prompt` pattern | **Adopt (process)** | After multi-task or packaging slices: one integration pass |
| `check_changed` + npm lanes | **Optional later** | Useful if parallel workers; today `npm test` + `npm run smoke` is enough |
| CLI profiles copy into repo | **Skip** | Canonical profiles stay in teamwork repo / MCP; point, don’t fork |
| Nested `projects/` monorepo layout | **Skip** | This app is its own git root |
| Unix `/home/stephen/.hermes/...` script paths | **Prohibit** | Windows host; use skill/MCP or relative scripts if added |
| Exposing task board via product/UI | **Prohibit** | Viewer is not a coordination surface |

## Cherry-pick applied in-repo (this review)

- Document mode default in `CONTEXT.md` / `HERMES.md`
- Ignore coordination + worktree paths in `.gitignore`
- Link this note from `docs/research/LINKS.md`
- Process: final integration pass after multi-agent or multi-phase code drops

## If enabling swarm later

1. Copy/adapt coordination scripts from the maintained skill (not hardcode Unix home paths).
2. Seed `.agent-tasks.json` with non-overlapping `files` per task.
3. Set distinct `AGENT_ID` per CLI lane (`codex-lane`, `agy-lane`, …).
4. Prefer `.worktrees/<task-id>` + `agent/<task-id>` in **branch mode** for reviewable merges.
5. Parent agent re-runs `npm test` + `npm run smoke` — board `completed` is not acceptance.
