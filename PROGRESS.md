# PROGRESS.md — Markdown Viewer

Updated: 2026-09-02

## 2026-09-02 — Phase 3 polish (v0.2.0)

**Implemented**

- `lib/media.js` — relative images under note dir only; traversal blocked; image ext allowlist; ≤2MiB data-URL rewrite
- `lib/prefs.js` — recents (12), lastFile restore on launch, zoomFactor
- Main menu: Open recent, Open in editor, Print; View zoom
- Toolbar: Edit, zoom ±, empty-state recent list
- Fixture `fixtures/sample-dot.png` + sample.md relative image

**Verified**

| Check | Result |
|-------|--------|
| `npm test` | 26/26 |
| `npm run smoke` | 6/6 |
| fixture rewrite | data URL present; no raw `./sample-dot` src |

## 2026-09-02 — Private GitHub + install associations

**Repo:** https://github.com/SPhillips1337/markdown-viewer (private)
**Commits:** `7bc9752` initial · `f5d9e07` docs/packaging/lane · follow-up register script

**Install**
- NSIS silent → `%LOCALAPPDATA%\Programs\Markdown Viewer\Markdown Viewer.exe`
- `scripts/register-md-openwith.ps1` → ProgId `MarkdownViewer.md`, `.md` default = that ProgId (no UserChoice lock)
- Opening `fixtures/sample.md` launched Markdown Viewer processes

**AGENTS.md:** root write blocked; content in `docs/protocol/AGENTS.proposed.md` (copy to root when allowlist approves)

## 2026-09-02 — GitHub private repo + AGENTS proposal

**Implemented**

- Commit packaging/docs/lane backlog; private GitHub remote (see below)
- `docs/protocol/AGENTS.proposed.md` — root `AGENTS.md` blocked by host allowlist; copy when approved

**Verified:** see commit message / `gh repo view`

## 2026-09-02 — OpenCode AgentWorld lane

**Implemented**

- `.env.example` + gitignored `.env` (local key; not for commit)
- `scripts/lane-opencode-agentworld.sh` (`--worktree`, `--dry-run`, `--print-env`)
- Research note + HERMES/CONTEXT/LINKS wiring

**Verified**

| Check | Result |
|-------|--------|
| `git check-ignore .env` | ignored |
| `./scripts/lane-opencode-agentworld.sh --print-env` | studio/model/workdir OK; key set (not printed) |
| `--dry-run` | command shape OK |
| `npm test` / `smoke` | still green |
| Live `unsloth start opencode` session | **not** left running from this pass |

## 2026-09-02 — Phase 2b NSIS + portable

**Implemented**

- `package.json` scripts: `dist` = dir+portable+nsis; `dist:portable`; `dist:nsis`
- Built installer + portable artifacts

**Verified**

| Check | Result |
|-------|--------|
| `npm test` / `npm run smoke` | 15/15 + 5/5 |
| `dist/MarkdownViewer-0.1.0-portable.exe` | ~85.7 MB |
| `dist/Markdown Viewer Setup 0.1.0.exe` | ~94.4 MB |
| Silent NSIS → temp dir | EXE + Uninstall present; launched with sample.md |
| Silent uninstall | smoke dir cleared; uninstall registry entry gone |
| OS default-app for `.md` | **Not claimed** — set manually in Settings if desired |
| Code signing | still unsigned |

## 2026-09-02 — Phase 2 packaging

**Implemented**

- `build/icon.ico` (+ `icon-256.png` preview) multi-size slate/MD icon
- `package.json` `build.win.icon` + `files` includes `build/icon.ico`
- Smoke checks icon path + config
- README packaging / SmartScreen / association notes

**Verified**

| Check | Result |
|-------|--------|
| `npm test` | 15/15 pass |
| `npm run smoke` | 5/5 PASS (incl. icon) |
| `npm run dist:dir` | OK → `dist/win-unpacked/Markdown Viewer.exe` |
| Packaged EXE brief launch | process stayed up with `fixtures/sample.md` |
| NSIS install + OS default `.md` | **Not run** — needs `npm run dist` + manual OS |
| Code signing | unsigned (`signExecutable: false`); SmartScreen expected once |

## 2026-09-02 — Teamwork prompt review

**Source:** HappyMonkeyAI/ai-agent-teamwork-prompt (`v0.1.0-beta`), local clone under happymonkey.

**Adopted (docs/process only)**

- Branch/solo default vs deferred manifest mode in `CONTEXT.md` + `HERMES.md`
- Research note + LINKS row
- `.gitignore` for coordination metadata / `.worktrees/`
- Follow-up: elevated **worktrees + subcontext** as preferred parallel pattern (host lesson from larger projects) in CONTEXT/HERMES/LTM

**Deferred:** tasks/lock scripts, in-repo CLI profile copies, `check_changed` npm lanes  
**Skipped:** nested projects layout, product-facing coordination UI

**Verified:** doc-only; no code path change. Re-run `npm test` + `npm run smoke` before next code claim.

## 2026-09-02 — v0.1 scaffold

**Commit:** `7bc9752` — feat: thin Electron markdown viewer for Windows 11

**Implemented**

- Electron main/preload/renderer
- GFM pipeline in main (`marked`, highlight.js, DOMPurify/jsdom)
- Open paths: argv, dialog, drag-drop, second-instance
- fileAssociations in electron-builder config
- Light/dark UI, disk watch reload

**Verified**

| Check | Result |
|-------|--------|
| `npm test` | 15/15 pass |
| `npm run smoke` | 5/5 PASS |
| GUI launch `electron . fixtures/sample.md` | Process stayed up; stopped after smoke |
| `npm run dist:dir` | Not run yet |
| OS double-click association | Needs NSIS install — not verified |

## 2026-09-02 — Agents Protocol packet

**Implemented**

- Documentation spine: CONTEXT, AGENTS, BOOTSTRAP, SPEC, TASKS, DESIGN, PROGRESS
- ADRs 0001–0002
- Research links
- `.agent/memories/` initial bootstrap from v0.1 code

**Verified**

- Files present under repo root and `.agent/memories/`
- `npm test` + `npm run smoke` still green after doc-only changes (re-run on commit)

## Next options

1. Icon + `dist:dir` packaging proof
2. NSIS install + set default `.md` handler (manual)
3. Sandboxed relative image loading from file dir
4. Stay thin; keep vault features in `kb-vault-ui`
