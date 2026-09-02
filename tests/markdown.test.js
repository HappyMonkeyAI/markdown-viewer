'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { createMarkdownRenderer, extractTitle } = require('../lib/markdown');

function render(source) {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  const { render: r } = createMarkdownRenderer({ window: dom.window });
  return r(source);
}

describe('extractTitle', () => {
  it('uses first ATX heading', () => {
    assert.equal(extractTitle('# Hello\n\nbody'), 'Hello');
  });

  it('falls back to first line', () => {
    assert.equal(extractTitle('Just text\n\nmore'), 'Just text');
  });

  it('returns Untitled for empty', () => {
    assert.equal(extractTitle(''), 'Untitled');
    assert.equal(extractTitle(null), 'Untitled');
  });
});

describe('createMarkdownRenderer', () => {
  it('renders GFM headings and emphasis', () => {
    const { html, title } = render('# Title\n\nHello **world**');
    assert.equal(title, 'Title');
    assert.match(html, /<h1[^>]*>Title<\/h1>/);
    assert.match(html, /<strong>world<\/strong>/);
  });

  it('highlights fenced code', () => {
    const { html } = render('```js\nconst x = 1;\n```');
    assert.match(html, /hljs/);
    assert.match(html, /language-js|hljs/);
  });

  it('sanitizes script tags from raw HTML in markdown', () => {
    const { html } = render('Hello <script>alert(1)</script>');
    assert.doesNotMatch(html, /<script/i);
    assert.match(html, /Hello/);
  });

  it('renders GFM tables', () => {
    const md = '| A | B |\n|---|---|\n| 1 | 2 |';
    const { html } = render(md);
    assert.match(html, /<table>/i);
    assert.match(html, /<td[^>]*>1<\/td>/i);
  });

  it('renders task list items', () => {
    const { html } = render('- [x] done\n- [ ] todo');
    assert.match(html, /checkbox|type="checkbox"|task-list|checked/i);
  });
});
