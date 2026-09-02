# Windows GitHub Release pattern (unsigned Electron / desktop)

Reusable checklist used for **Markdown Viewer** (e.g. v0.2.2, v0.2.3). Copy for other local Windows projects.

## Preconditions

1. Repo is **public** (or you accept private-only download links for collaborators).
2. Version bumped in `package.json` / app metadata; tag matches (`v0.2.2`).
3. `npm test` (and project smoke) green on the commit you will tag.
4. Artifacts built **locally** (or CI) and **not** committed into git (`dist/` gitignored).
5. No `.env`, keys, or private LAN defaults in the tagged tree.

## Build (this repo)

```bash
npm run dist          # NSIS + portable + unpacked, or:
npm run dist:nsis
npm run dist:portable
```

Expect something like:

- `dist/Markdown Viewer Setup <ver>.exe`
- `dist/MarkdownViewer-<ver>-portable.exe`

## Tag + release (`gh`)

```bash
git tag -a "v${VER}" -m "AppName v${VER}"
git push origin "v${VER}"

# Notes file should include an UNSIGNED / SmartScreen section (see below)
gh release create "v${VER}" \
  --title "AppName v${VER}" \
  --notes-file ./RELEASE_NOTES.md \
  "dist/Setup ${VER}.exe" \
  "dist/AppName-${VER}-portable.exe"
```

GitHub may rewrite spaces in asset filenames to dots (e.g. `Markdown.Viewer.Setup.0.2.2.exe`). That is normal.

## Required release-note block (unsigned)

Always disclose when binaries are not Authenticode-signed:

```markdown
## ⚠️ Unsigned builds (SmartScreen)

These binaries are **not Authenticode-signed**. On first run Windows may show
“Windows protected your PC”. Choose **More info** → **Run anyway**.
That is expected for unsigned apps, not an application crash.
```

## Optional hardening later

- EV/OV code signing → fewer SmartScreen hits
- GitHub Actions `release` workflow that runs tests, builds, uploads assets
- SHA256 checksums in the notes or a `SHA256SUMS` asset
- `gh release upload` to add files to an existing release

## Do not

- Commit `dist/` into the git tree
- Attach `.env` or secrets as release assets
- Claim “signed” or “verified publisher” without a real certificate
- Tag a commit that still has private LAN IPs / keys in tracked files

## Verify after publish

```bash
gh release view "v${VER}"
# open the release URL; confirm both assets + SmartScreen wording
```

Live examples: [v0.2.3](https://github.com/HappyMonkeyAI/markdown-viewer/releases/tag/v0.2.3), [v0.2.2](https://github.com/HappyMonkeyAI/markdown-viewer/releases/tag/v0.2.2)
