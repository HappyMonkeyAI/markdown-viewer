# Insight: main process shell

Status: Active  
Paths: `main.js`, `preload.js`

## Why it exists

Owns window lifecycle, menus, single-instance lock, file dialogs, FS read/watch, markdown render, and IPC. Renderer is display-only.

## Non-obvious

- `app.setPath('userData', …/markdown-viewer)` avoids cache fights with other Electron apps.
- Initial argv open waits for `did-finish-load` so the renderer has listeners.
- `will-navigate` + `setWindowOpenHandler` keep the webContents from leaving the app origin except via `shell.openExternal`.
- Watcher uses 400ms debounce for Windows editors that replace files.

## Dependencies

- `lib/paths.js`, `lib/markdown.js`, `jsdom`
- Preload channel names must stay in sync with `preload.js` and renderer `window.mdViewer`
