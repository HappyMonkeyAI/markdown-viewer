# ADR 0001 — Thin Electron viewer with main-process render

- **Status:** Active
- **Date:** 2026-09-02
- **Deciders:** project bootstrap (Hermes session)

## Context

Need a Windows 11 markdown viewer with double-click / file association. Electron is familiar from `kb-vault-ui`. Tauri is lighter but slower to first association. Renderer cannot cleanly `import` CJS `marked` without a bundler.

## Decision

1. Use **Electron** + plain `main.js` / `preload.js` / static `renderer/` (no React/Vite in v0.1).
2. Run **marked + highlight.js + DOMPurify** in the **main process** with **jsdom**, send sanitized `{ html, title }` over IPC.
3. Declare **electron-builder** `fileAssociations` for `.md`, `.markdown`, `.mdown`.
4. Enforce secure webPreferences: contextIsolation, no nodeIntegration, sandbox.

## Consequences

- Pros: Fast to ship; secure boundary; headless tests without GUI; associations ready for NSIS.
- Cons: jsdom weight in main; larger install than Tauri; unsigned SmartScreen friction.
- Follow-ups: icon, `dist:dir` proof, optional relative image resolution ADR later.
