# ADR 0002 — Agents Protocol documentation + LTM

- **Status:** Active
- **Date:** 2026-09-02
- **Deciders:** project bootstrap (Hermes session)

## Context

Multi-agent / multi-session work needs durable context so agents do not relearn stack boundaries (especially vs `kb-vault-ui`).

## Decision

Adopt [HappyMonkeyAI/AgentsProtocol](https://github.com/HappyMonkeyAI/AgentsProtocol) spine:

- Root: `CONTEXT.md`, `AGENTS.md`, `BOOTSTRAP.md`, `SPEC.md`, `TASKS.md`, `DESIGN.md`, `PROGRESS.md`, `HERMES.md`
- `docs/adr/`, `docs/research/`
- LTM under `.agent/memories/` (codebase_insights, architectural_decisions, patterns_and_lessons, optional history)

Host override: **no autonomous git commit/push** unless the user asks.

## Consequences

- Pros: Matches AlongFor / sibling operating style; clear is/is-not vs vault UI.
- Cons: Doc drift risk — update CONTEXT/ADR when architecture changes; LTM must not outrank code.
