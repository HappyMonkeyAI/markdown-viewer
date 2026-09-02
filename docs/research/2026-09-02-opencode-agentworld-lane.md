# Research: OpenCode + Unsloth AgentWorld subagent lane

**Checked:** 2026-09-02  
**Host pattern:** LAN Unsloth Studio → `unsloth start opencode`  
**Studio (default):** `http://192.168.5.157:8888`  
**Model (default):** `unsloth/Qwen-AgentWorld-35B-A3B-GGUF:UD-IQ4_NL`  
**CLI profile:** teamwork `opencode` / `opencode-lane`  
**Secrets:** `UNSLOTH_API_KEY` in gitignored `.env` only (see `.env.example`)

## Role in the stack

| Actor | Owns |
|-------|------|
| Hermes / human parent | Goal, worktree, subcontext brief, merge, `npm test` + `npm run smoke` |
| OpenCode + AgentWorld | Implementation inside assigned paths on a worktree |
| Unsloth Studio @ .157 | Local inference (GGUF) |

This is a **leaf coding lane**, not the product acceptance gate.

## Launch

```bash
cp .env.example .env   # once; set UNSLOTH_API_KEY
./scripts/lane-opencode-agentworld.sh --print-env
./scripts/lane-opencode-agentworld.sh --dry-run
./scripts/lane-opencode-agentworld.sh
./scripts/lane-opencode-agentworld.sh --worktree my-task
```

Equivalent manual command (key from env):

```bash
export UNSLOTH_STUDIO_URL=http://192.168.5.157:8888
export UNSLOTH_API_KEY=…   # from .env
unsloth start opencode \
  --model unsloth/Qwen-AgentWorld-35B-A3B-GGUF:UD-IQ4_NL \
  --api-key "$UNSLOTH_API_KEY"
```

## Subcontext brief (paste into OpenCode)

```text
You are opencode-lane on markdown-viewer (Windows Electron md viewer).

Read: CONTEXT.md, HERMES.md, and only the files listed below.
Repo verify: npm test && npm run smoke

Goal: <one sentence>

Owned paths (only these):
- <path>
- <path>

Out of scope:
- vault/wikilink features
- unrelated refactors
- committing/pushing unless asked

Done when: owned paths changed as needed AND parent can pass npm test + npm run smoke.
Do not claim OS file-association or SmartScreen success without packaged proof.
```

## Worktree convention

- Path: `.worktrees/<task-id>` (gitignored)
- Branch: `agent/<task-id>`
- Script flag: `--worktree <task-id>` creates/adds the worktree then starts OpenCode there

## When to use

- Multi-file impl while Hermes orchestrates
- Preference for local AgentWorld over cloud subagents
- Parallel lanes with non-overlapping files

## When not to use

- Final packaging/NSIS/default-app judgment
- Security-sensitive Electron BrowserWindow flags without parent review
- Tasks that need live Windows Settings UX confirmation

## Related

- `docs/research/2026-09-02-ai-agent-teamwork-prompt.md` — worktrees + subcontext
- Host teamwork profiles: `happymonkey/ai-agent-teamwork-prompt/profiles/opencode.yaml`
