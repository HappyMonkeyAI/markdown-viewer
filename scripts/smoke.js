'use strict';

/**
 * Headless smoke: paths + markdown pipeline + fixture read + required files.
 * Does not launch the Electron GUI.
 */
const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { normalizeOpenPath, extractOpenPathsFromArgv } = require('../lib/paths');
const { createMarkdownRenderer } = require('../lib/markdown');

const root = path.join(__dirname, '..');
const sample = path.join(root, 'fixtures', 'sample.md');

const required = [
  'main.js',
  'preload.js',
  'lib/paths.js',
  'lib/markdown.js',
  'renderer/index.html',
  'renderer/app.js',
  'renderer/styles.css',
  'package.json',
  'fixtures/sample.md',
];

let failed = 0;

function check(name, fn) {
  try {
    fn();
    console.log(`PASS  ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL  ${name}`);
    console.error(err && err.stack ? err.stack : err);
  }
}

check('required files exist', () => {
  for (const rel of required) {
    const p = path.join(root, rel);
    assert.ok(fs.existsSync(p), `missing ${rel}`);
  }
});

check('package.json main + fileAssociations', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.main, 'main.js');
  const exts = (pkg.build?.fileAssociations || []).map((f) => f.ext);
  assert.ok(exts.includes('md'));
  assert.ok(exts.includes('markdown'));
});

check('fixture opens and renders', () => {
  const norm = normalizeOpenPath(sample);
  assert.equal(norm.ok, true);
  const raw = fs.readFileSync(norm.path, 'utf8');
  assert.ok(raw.includes('Markdown Viewer sample'));
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  const { render } = createMarkdownRenderer({ window: dom.window });
  const { html, title } = render(raw);
  assert.equal(title, 'Markdown Viewer sample');
  assert.match(html, /<h1/i);
  assert.match(html, /Electron/i);
  assert.doesNotMatch(html, /<script/i);
});

check('argv extraction finds sample path', () => {
  const found = extractOpenPathsFromArgv(
    ['electron.exe', root, sample],
    { execPath: 'electron.exe', appPath: root }
  );
  assert.equal(found.length, 1);
  assert.equal(path.normalize(found[0]).toLowerCase(), path.normalize(sample).toLowerCase());
});

check('electron binary present after install', () => {
  const exe = path.join(
    root,
    'node_modules',
    'electron',
    'dist',
    process.platform === 'win32' ? 'electron.exe' : 'electron'
  );
  assert.ok(fs.existsSync(exe), `electron binary missing at ${exe} — run npm install`);
});

if (failed) {
  console.error(`\nSmoke failed: ${failed} check(s)`);
  process.exit(1);
}
console.log('\nSmoke OK');
