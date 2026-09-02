# Markdown Viewer sample

A **GFM** preview fixture for the Windows viewer.

## Features

- Headings, *emphasis*, **bold**, `inline code`
- Lists and task boxes

- [x] Render markdown
- [ ] Edit mode (later)

### Code

```js
function hello(name) {
  return `Hello, ${name}!`;
}
```

### Table

| Stack    | Role        |
|----------|-------------|
| Electron | Shell       |
| marked   | Parse       |
| DOMPurify| Sanitize    |

> External links open in the system browser: [example.com](https://example.com)

---

Remote image (https allowed by CSP):

![remote placeholder](https://via.placeholder.com/120x40.png?text=md)

Relative image (resolved under this file’s folder, sandboxed):

![local sample](./sample-dot.png)
