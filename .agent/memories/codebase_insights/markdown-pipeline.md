# Insight: markdown pipeline

Status: Active  
Paths: `lib/markdown.js`, tests in `tests/markdown.test.js`

## Why it exists

Shared factory for GFM parse + highlight + DOMPurify. Used by main at runtime and by unit/smoke tests under jsdom.

## Non-obvious

- `marked-highlight` wraps `Marked` class API (not the legacy singleton-only style).
- Title extraction prefers first ATX `#` heading, else first non-empty line.
- Sanitize profile is HTML; scripts in raw HTML markdown must not survive (covered by tests).

## Dependencies

- `marked`, `marked-highlight`, `highlight.js`, `dompurify`, `jsdom` (window host)
