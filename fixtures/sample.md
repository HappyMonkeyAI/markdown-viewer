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

Plain paragraph with an image placeholder path that will not load:

![alt text](https://via.placeholder.com/120x40.png?text=md)
