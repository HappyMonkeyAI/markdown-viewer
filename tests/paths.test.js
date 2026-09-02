'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const {
  isMarkdownPath,
  extractOpenPathsFromArgv,
  normalizeOpenPath,
  markdownDialogFilter,
  MARKDOWN_DIALOG_EXTENSIONS,
  MARKDOWN_EXTS,
  isAllowedUserPath,
  MAX_MARKDOWN_BYTES,
} = require('../lib/paths');

describe('isMarkdownPath', () => {
  it('accepts common markdown extensions', () => {
    assert.equal(isMarkdownPath('notes.md'), true);
    assert.equal(isMarkdownPath('C:\\\\docs\\\\a.markdown'), true);
    assert.equal(isMarkdownPath('/tmp/x.MD'), true);
    assert.equal(isMarkdownPath('readme.mdx'), true);
    assert.equal(isMarkdownPath('x.mkdn'), true);
    assert.equal(isMarkdownPath('x.mkd'), true);
  });

  it('rejects non-markdown', () => {
    assert.equal(isMarkdownPath('notes.txt'), false);
    assert.equal(isMarkdownPath(''), false);
    assert.equal(isMarkdownPath(null), false);
    assert.equal(isMarkdownPath('file.'), false);
  });
});

describe('markdownDialogFilter', () => {
  it('matches MARKDOWN_EXTS (no drift vs dialog)', () => {
    const f = markdownDialogFilter();
    assert.equal(f.name, 'Markdown');
    for (const ext of f.extensions) {
      assert.equal(MARKDOWN_EXTS.has(`.${ext}`), true, `missing .${ext} in MARKDOWN_EXTS`);
    }
    assert.equal(f.extensions.length, MARKDOWN_DIALOG_EXTENSIONS.length);
    assert.equal(f.extensions.length, MARKDOWN_EXTS.size);
  });
});

describe('isAllowedUserPath', () => {
  const cur = path.resolve('C:', 'notes', 'a.md');
  const other = path.resolve('C:', 'notes', 'b.md');
  const stranger = path.resolve('C:', 'Windows', 'x.md');

  it('allows current, nav, and recents only', () => {
    assert.equal(isAllowedUserPath(cur, { currentFile: cur }), true);
    assert.equal(isAllowedUserPath(other, { navStack: [other] }), true);
    assert.equal(isAllowedUserPath(other, { recentPaths: [other] }), true);
    assert.equal(isAllowedUserPath(stranger, { currentFile: cur, navStack: [other] }), false);
    assert.equal(isAllowedUserPath('', { currentFile: cur }), false);
  });
});

describe('MAX_MARKDOWN_BYTES', () => {
  it('is a positive finite cap', () => {
    assert.equal(typeof MAX_MARKDOWN_BYTES, 'number');
    assert.ok(MAX_MARKDOWN_BYTES >= 1024 * 1024);
  });
});

describe('extractOpenPathsFromArgv', () => {
  const execPath = 'C:\\\\Program Files\\\\app\\\\electron.exe';
  const appPath = 'C:\\\\app';

  it('finds trailing markdown path and skips electron binary', () => {
    const argv = [
      execPath,
      appPath,
      'C:\\\\Users\\\\me\\\\Documents\\\\hello.md',
    ];
    const found = extractOpenPathsFromArgv(argv, { execPath, appPath });
    assert.equal(found.length, 1);
    assert.ok(found[0].toLowerCase().endsWith('hello.md'));
  });

  it('ignores flags and bare dot', () => {
    const argv = [execPath, '.', '--enable-logging', 'notes.txt'];
    const found = extractOpenPathsFromArgv(argv, { execPath, appPath });
    assert.deepEqual(found, []);
  });

  it('accepts multiple md paths in order', () => {
    const argv = ['electron', 'a.md', 'b.markdown'];
    const found = extractOpenPathsFromArgv(argv, {});
    assert.equal(found.length, 2);
  });
});

describe('normalizeOpenPath', () => {
  it('resolves a valid md path', () => {
    const r = normalizeOpenPath(path.join('fixtures', 'sample.md'));
    assert.equal(r.ok, true);
    assert.ok(path.isAbsolute(r.path));
  });

  it('rejects empty and non-md', () => {
    assert.equal(normalizeOpenPath('').ok, false);
    assert.equal(normalizeOpenPath('  ').ok, false);
    assert.equal(normalizeOpenPath('x.txt').ok, false);
  });
});

describe('extractOpenPathFromArgv', () => {
  it('returns first md path or null', () => {
    const {
      extractOpenPathFromArgv: one,
    } = require('../lib/paths');
    assert.equal(one(['electron', 'a.md', 'b.md']).endsWith('a.md'), true);
    assert.equal(one(['electron', '--foo']), null);
  });
});

describe('resolveRelativeMarkdownHref', () => {
  const { resolveRelativeMarkdownHref } = require('../lib/paths');
  const from = path.join('C:', 'notes', 'index.md');

  it('resolves sibling md', () => {
    const r = resolveRelativeMarkdownHref(from, './other.md');
    assert.ok(r);
    assert.ok(r.toLowerCase().endsWith(path.join('notes', 'other.md').toLowerCase()) || r.endsWith('other.md'));
  });

  it('appends .md for extensionless relative', () => {
    const r = resolveRelativeMarkdownHref(from, 'guide');
    assert.ok(r && r.endsWith('guide.md'));
  });

  it('rejects http and absolute', () => {
    assert.equal(resolveRelativeMarkdownHref(from, 'https://x.com/a.md'), null);
    assert.equal(resolveRelativeMarkdownHref(from, 'C:\\x\\a.md'), null);
    assert.equal(resolveRelativeMarkdownHref(from, '/etc/a.md'), null);
  });

  it('rejects non-markdown targets', () => {
    assert.equal(resolveRelativeMarkdownHref(from, './photo.png'), null);
    assert.equal(resolveRelativeMarkdownHref(from, './secret.exe'), null);
  });

  it('allows parent relative md', () => {
    const r = resolveRelativeMarkdownHref(from, '../readme.md');
    assert.ok(r && r.toLowerCase().endsWith('readme.md'));
  });
});
