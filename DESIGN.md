# DESIGN.md — Markdown Viewer

Lightweight UI tokens for the v0.1 shell. Not a full DESIGN.md brand system.

## Layout

```
┌─────────────────────────────────────────────┐
│ Open  Reveal          filename.md    Theme  │  toolbar
├─────────────────────────────────────────────┤
│                                             │
│         markdown-body (max ~52rem)          │  scroll main
│                                             │
└─────────────────────────────────────────────┘
```

Empty state: centered short instructions when no file open.  
Toast: bottom-center, auto-hide ~3.2s; error uses danger color.

## Color tokens (CSS variables)

| Token | Light | Dark |
|-------|-------|------|
| `--bg` | `#fafafa` | `#1e1e1e` |
| `--fg` | `#1a1a1a` | `#e8e8e8` |
| `--muted` | `#666` | `#a0a0a0` |
| `--border` | `#e0e0e0` | `#333` |
| `--toolbar` | `#f0f0f0` | `#2a2a2a` |
| `--accent` / `--link` | `#0b57d0` | `#8ab4f8` |
| `--code-bg` | `#f4f4f5` | `#2d2d2d` |
| `--danger` | `#b3261e` | `#f2b8b5` |

Theme attribute: `document.documentElement[data-theme=light|dark]`.  
Default: follow `prefers-color-scheme`, persist `localStorage.md-viewer-theme`.

## Typography

- UI: Segoe UI / system-ui
- Body prose: 16px, line-height ~1.65
- Code: Cascadia Code / Consolas / monospace
- Content column: max-width 52rem, padding 24–28px

## Code highlighting

Vendored highlight.js themes:

- `renderer/vendor/hljs-github.min.css` (light)
- `renderer/vendor/hljs-github-dark.min.css` (dark)

Toggle enabled stylesheet with theme.

## Motion / density

- No animation library
- Drag-over: dashed accent outline on `#drop-zone`
- Buttons: 6px radius, 13px type, quiet borders

## Accessibility (baseline)

- Native buttons with titles
- Respect system dark preference on first run
- Zoom via Electron View menu roles

## Branding gap

v0.1 ships default Electron icon until `build/icon.ico` exists.
