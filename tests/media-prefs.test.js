'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { JSDOM } = require('jsdom');
const {
  isPathInside,
  resolveRelativeImagePath,
  rewriteLocalImageSrcs,
  fileToDataUrl,
} = require('../lib/media');
const { createPrefsStore } = require('../lib/prefs');

describe('isPathInside', () => {
  it('accepts nested paths', () => {
    assert.equal(isPathInside('C:\\notes', 'C:\\notes\\img\\a.png'), true);
  });
  it('rejects parent traversal', () => {
    assert.equal(isPathInside('C:\\notes', 'C:\\notes\\..\\secret.png'), false);
  });
});

describe('resolveRelativeImagePath', () => {
  const md = path.join('C:\\vault\\notes', 'doc.md');

  it('resolves simple relative png', () => {
    const r = resolveRelativeImagePath(md, './img/a.png');
    assert.ok(r);
    assert.ok(r.toLowerCase().endsWith(path.join('img', 'a.png').toLowerCase()) || r.endsWith('img\\a.png') || r.endsWith('img/a.png'));
  });

  it('rejects http and data', () => {
    assert.equal(resolveRelativeImagePath(md, 'https://x/a.png'), null);
    assert.equal(resolveRelativeImagePath(md, 'data:image/png;base64,xx'), null);
  });

  it('rejects path traversal', () => {
    assert.equal(resolveRelativeImagePath(md, '../outside.png'), null);
    assert.equal(resolveRelativeImagePath(md, '..\\..\\Windows\\x.png'), null);
  });

  it('rejects non-image extension', () => {
    assert.equal(resolveRelativeImagePath(md, './secret.exe'), null);
    assert.equal(resolveRelativeImagePath(md, './note.md'), null);
  });

  it('rejects absolute paths', () => {
    assert.equal(resolveRelativeImagePath(md, 'C:\\Windows\\a.png'), null);
    assert.equal(resolveRelativeImagePath(md, '/etc/passwd.png'), null);
  });
});

describe('rewriteLocalImageSrcs', () => {
  let tmp;
  let mdFile;
  let imgFile;

  before(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mdv-media-'));
    mdFile = path.join(tmp, 'note.md');
    fs.writeFileSync(mdFile, '# x\n', 'utf8');
    imgFile = path.join(tmp, 'pic.png');
    // 1x1 PNG
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    fs.writeFileSync(imgFile, png);
  });

  after(() => {
    try {
      fs.rmSync(tmp, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });

  it('inlines relative image as data URL', () => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    const html = rewriteLocalImageSrcs(
      '<p><img src="./pic.png" alt="x"></p>',
      mdFile,
      { window: dom.window }
    );
    assert.match(html, /data:image\/png;base64,/);
    assert.match(html, /src="data:image\/png/);
    assert.equal(html.includes('src="./pic.png"'), false);
  });

  it('does not rewrite https images', () => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    const html = rewriteLocalImageSrcs(
      '<img src="https://example.com/a.png">',
      mdFile,
      { window: dom.window }
    );
    assert.match(html, /https:\/\/example\.com\/a\.png/);
  });

  it('fileToDataUrl reads png', () => {
    const d = fileToDataUrl(imgFile);
    assert.ok(d && d.startsWith('data:image/png;base64,'));
  });
});

describe('createPrefsStore', () => {
  let tmp;
  before(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mdv-prefs-'));
  });
  after(() => {
    try {
      fs.rmSync(tmp, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });

  it('records recents and last file, persists zoom', () => {
    const store = createPrefsStore(tmp);
    store.recordOpen(path.join(tmp, 'a.md'));
    store.recordOpen(path.join(tmp, 'b.md'));
    store.setZoomFactor(1.25);
    assert.equal(store.getLastFile(), path.resolve(path.join(tmp, 'b.md')));
    assert.equal(store.getRecents()[0].name, 'b.md');
    assert.equal(store.getRecents().length, 2);
    assert.equal(store.getZoomFactor(), 1.25);

    const store2 = createPrefsStore(tmp);
    assert.equal(store2.getZoomFactor(), 1.25);
    assert.equal(store2.getRecents()[0].name, 'b.md');
  });
});
