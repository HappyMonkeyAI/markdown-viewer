# Markdown Viewer

Thin **Windows 11** desktop app to open and preview Markdown files (double-click / Open With / drag-drop).

## Stack

- **Electron** — shell, single-instance, file associations
- **marked** + **marked-highlight** + **highlight.js** — GFM + code coloring
- **DOMPurify** — sanitize HTML before inject
- **electron-builder** — `dir` / portable / NSIS; associates `.md`, `.markdown`, `.mdown`

## Dev

```bash
npm install
npm test
npm run smoke
npm start
```

Open a file:

```bash
npx electron . fixtures/sample.md
```

## Package (Windows)

```bash
npm run dist:dir
# or full: npm run dist
```

After NSIS install, `.md` files can be opened via double-click / “Open with”. Unsigned builds may show SmartScreen once.

## Security

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`
- Main process reads files; renderer gets content over IPC only
- http(s) links open in the system browser; relative local links are not followed in v0.1

## v0.1 scope

- Open one file (argv, dialog, drag-drop, second-instance)
- GFM preview, light/dark theme, live reload on disk change
- Not an editor, vault browser, or wikilink graph (see kb-vault-ui for that)
