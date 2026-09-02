# BOOTSTRAP.md — Markdown Viewer LTM seeder

**Role:** Agents Protocol Knowledge Architect for this repo.  
**Objective:** Keep `.agent/memories/` grounded in current code so future agents do not relearn solved problems.

Source protocol: https://github.com/HappyMonkeyAI/AgentsProtocol  
Upstream bootstrap pattern: https://github.com/HappyMonkeyAI/AgentsProtocol/blob/main/BOOTSTRAP.md

## 1. Context mining

Scan in this order:

1. `CONTEXT.md`, `SPEC.md`, `TASKS.md`, `PROGRESS.md`, `docs/adr/`
2. `main.js`, `preload.js`, `lib/paths.js`, `lib/markdown.js`, `renderer/*`, `package.json` (`build` + scripts)
3. `tests/*`, `scripts/smoke.js`, `fixtures/sample.md`
4. `docs/research/*` (reference only)
5. Recent git history (`git log --oneline -20`)

Extract:

- Major features and why they exist
- Security / IPC invariants
- Packaging and file-association facts
- Failed or rejected approaches (e.g. renderer ESM importing CJS marked; Tauri deferred)
- Sibling boundaries (`kb-vault-ui`)

## 2. Synthesis targets

| Bucket | Path |
|--------|------|
| Codebase insights | `.agent/memories/codebase_insights/*.md` |
| Architectural decisions | `.agent/memories/architectural_decisions/*.md` |
| Patterns & lessons | `.agent/memories/patterns_and_lessons.md` |
| Episodic history (optional) | `.agent/memories/history/` |

Each insight/decision file starts with `Status: Active` or `Status: Deprecated`.

## 3. Markdown Viewer focus areas

1. **Single-instance + argv open** — `app.requestSingleInstanceLock`, `extractOpenPathsFromArgv`
2. **Main-process render pipeline** — `lib/markdown.js` + jsdom DOMPurify; IPC sends HTML not raw MD for display path
3. **Secure preload** — `window.mdViewer` only; no Node in renderer
4. **File associations** — `package.json` `build.fileAssociations`; need NSIS install for OS double-click
5. **Electron install under agent policy** — `postinstall` / `node node_modules/electron/install.js`
6. **Not a vault** — do not absorb kb-vault-ui tree/search/BM without explicit ADR

## 4. Verification

- Every memory claim must map to a file path or ADR.
- No secrets in memory files.
- After bootstrap: `npm test` && `npm run smoke` still green; docs read back cleanly.
- Commit only if the user asked.
