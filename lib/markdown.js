'use strict';

const { Marked } = require('marked');
const { markedHighlight } = require('marked-highlight');
const hljs = require('highlight.js');
const createDOMPurify = require('dompurify');

/**
 * Build a markdown→safe HTML pipeline.
 * Pass a window (jsdom or browser) so DOMPurify can sanitize.
 * @param {{ window: object }} deps
 */
function createMarkdownRenderer(deps) {
  if (!deps || !deps.window) {
    throw new Error('createMarkdownRenderer requires { window }');
  }

  const DOMPurify = createDOMPurify(deps.window);

  const marked = new Marked(
    markedHighlight({
      langPrefix: 'hljs language-',
      highlight(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(code, { language: lang }).value;
          } catch {
            /* fall through */
          }
        }
        try {
          return hljs.highlightAuto(code).value;
        } catch {
          return escapeHtml(code);
        }
      },
    })
  );

  marked.setOptions({
    gfm: true,
    breaks: false,
  });

  /**
   * @param {string} source
   * @returns {{ html: string, title: string }}
   */
  function render(source) {
    const text = source == null ? '' : String(source);
    const dirty = marked.parse(text, { async: false });
    const html = DOMPurify.sanitize(dirty, {
      USE_PROFILES: { html: true },
      ADD_ATTR: ['target', 'rel'],
    });
    return {
      html,
      title: extractTitle(text),
    };
  }

  return { render };
}

/**
 * First ATX heading, else first non-empty line, else "Untitled".
 * @param {string} source
 */
function extractTitle(source) {
  const text = source == null ? '' : String(source);
  const atx = text.match(/^\s*#\s+(.+?)\s*$/m);
  if (atx) return stripMdInline(atx[1]).slice(0, 200);
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (t) return stripMdInline(t).slice(0, 200);
  }
  return 'Untitled';
}

function stripMdInline(s) {
  return String(s)
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/[`*_~]+/g, '')
    .trim();
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = {
  createMarkdownRenderer,
  extractTitle,
};
