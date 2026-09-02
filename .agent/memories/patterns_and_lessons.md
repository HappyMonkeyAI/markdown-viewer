# Patterns and lessons — Markdown Viewer

## Success

- **Main-process render:** Sending sanitized HTML over IPC avoided bundling marked for the renderer and kept Node/CJS simple (`lib/markdown.js` + jsdom).
- **Argv path helper tests:** `extractOpenPathsFromArgv` unit tests catch electron/binary/dot false positives before GUI work.
- **Vendored hljs CSS:** Copy highlight themes into `renderer/vendor/` so packaged `loadFile` UI does not depend on fragile `node_modules` URL paths in HTML.
- **postinstall electron:** Agent allow-scripts can skip electron download; smoke checks for `electron/dist/electron.exe` and `postinstall` re-fetch saves thrash.
- **Single-instance lock:** Required for double-click UX; pair with `second-instance` argv parse.
- **Worktrees + subcontext (larger projects):** Isolated `.worktrees/<task>` + self-contained worker briefs beat same-dir lock swarms for parallel/large slices — clean merges, less clobber, parent stays acceptance gate. Prefer for multi-lane work; keep manifest mode rare.

## Failure / drag avoided

- **Renderer `import` of CJS marked:** Broken under plain script tags / ESM boundary — do not reintroduce without esbuild IIFE.
- **Treating portable exe as association install:** File handlers need NSIS (or explicit OS register); document clearly.
- **Absorbing kb-vault-ui scope:** Vault tree/BM/wikilinks are a different product — keep CONTEXT is/is-not honest.

## Guardrails

- No nodeIntegration; sanitize always; http(s) only for external open.
- LTM never outranks code/ADR.
- Commit only on user request (host override).
