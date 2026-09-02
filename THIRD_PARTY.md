# Third-party notices

Markdown Viewer is MIT-licensed. It bundles or depends on other open-source packages.
This is a convenience summary, not a substitute for each package’s license file
in `node_modules` / upstream repositories.

| Package | Typical license | Role |
|---------|-----------------|------|
| [Electron](https://www.electronjs.org/) | MIT | Application shell |
| [marked](https://marked.js.org/) | MIT | Markdown parse |
| [marked-highlight](https://github.com/markedjs/marked-highlight) | MIT | Code highlight hook |
| [highlight.js](https://highlightjs.org/) | BSD-3-Clause | Syntax highlighting (+ vendored CSS under `renderer/vendor/`) |
| [DOMPurify](https://github.com/cure53/DOMPurify) | Apache-2.0 OR MPL-2.0 | HTML sanitization |
| [jsdom](https://github.com/jsdom/jsdom) | MIT | DOM for sanitize/render in main |
| [electron-builder](https://www.electron.build/) | MIT | Windows packaging (dev) |

Run `npx license-checker --summary` (or your preferred tool) on a full `npm install`
tree for a complete inventory before redistribution of binaries.
