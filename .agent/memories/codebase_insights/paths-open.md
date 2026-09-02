# Insight: path / open helpers

Status: Active  
Paths: `lib/paths.js`, `tests/paths.test.js`

## Why it exists

Centralize markdown extension allowlist, argv filtering, and normalize-open checks so main and tests share one definition of “openable file”.

## Non-obvious

- Skips flags, bare `.`, electron binary, and optional `appPath`.
- Only returns paths that look like markdown by extension (resolved).
- Existence is caller’s job (`fs.existsSync` in main IPC).

## Extensions allowlist

`.md`, `.markdown`, `.mdown`, `.mkd`, `.mdx`
