'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { headingIdFromText, decorateHeadings } = require('../lib/outline');

describe('headingIdFromText', () => {
  it('slugifies text', () => {
    assert.equal(headingIdFromText('Hello World'), 'hello-world');
  });

  it('dedupes with used set', () => {
    const used = new Set();
    assert.equal(headingIdFromText('Same', used), 'same');
    assert.equal(headingIdFromText('Same', used), 'same-2');
  });
});

describe('decorateHeadings', () => {
  it('adds ids and returns outline', () => {
    const dom = new JSDOM('<article><h1>Title</h1><h2>Sub</h2><h2>Sub</h2></article>');
    const root = dom.window.document.querySelector('article');
    const outline = decorateHeadings(root);
    assert.equal(outline.length, 3);
    assert.equal(outline[0].id, 'title');
    assert.equal(outline[1].id, 'sub');
    assert.equal(outline[2].id, 'sub-2');
    assert.equal(root.querySelector('h1').id, 'title');
  });
});
