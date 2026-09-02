'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const {
  isMarkdownPath,
  extractOpenPathsFromArgv,
  normalizeOpenPath,
} = require('../lib/paths');

describe('isMarkdownPath', () => {
  it('accepts common markdown extensions', () => {
    assert.equal(isMarkdownPath('notes.md'), true);
    assert.equal(isMarkdownPath('C:\\\\docs\\\\a.markdown'), true);
    assert.equal(isMarkdownPath('/tmp/x.MD'), true);
    assert.equal(isMarkdownPath('readme.mdx'), true);
  });

  it('rejects non-markdown', () => {
    assert.equal(isMarkdownPath('notes.txt'), false);
    assert.equal(isMarkdownPath(''), false);
    assert.equal(isMarkdownPath(null), false);
    assert.equal(isMarkdownPath('file.'), false);
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
