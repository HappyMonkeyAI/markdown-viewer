'use strict';

const path = require('path');

/** Canonical markdown extensions (with leading dot, lowercase). */
const MARKDOWN_EXTS = new Set([
  '.md',
  '.markdown',
  '.mdown',
  '.mkd',
  '.mkdn',
  '.mdx',
]);

/** Extensions without dots for Electron open-dialog filters / NSIS-style lists. */
const MARKDOWN_DIALOG_EXTENSIONS = [...MARKDOWN_EXTS].map((e) => e.slice(1));

/** Soft cap for note body load on main process (8 MiB). */
const MAX_MARKDOWN_BYTES = 8 * 1024 * 1024;

/**
 * True if the path looks like a markdown file by extension.
 * @param {string} filePath
 */
function isMarkdownPath(filePath) {
  if (!filePath || typeof filePath !== 'string') return false;
  const ext = path.extname(filePath).toLowerCase();
  return MARKDOWN_EXTS.has(ext);
}

/**
 * Electron dialog filter entry for markdown.
 * @returns {{ name: string, extensions: string[] }}
 */
function markdownDialogFilter() {
  return {
    name: 'Markdown',
    extensions: MARKDOWN_DIALOG_EXTENSIONS.slice(),
  };
}

/**
 * Pull candidate file paths from Electron/process argv.
 * Skips electron binaries, app entry, flags, and bare ".".
 * @param {string[]} argv
 * @param {{ appPath?: string, execPath?: string }} [opts]
 * @returns {string[]}
 */
function extractOpenPathsFromArgv(argv, opts = {}) {
  if (!Array.isArray(argv)) return [];
  const skip = new Set();
  if (opts.execPath) skip.add(path.resolve(opts.execPath));
  if (opts.appPath) skip.add(path.resolve(opts.appPath));

  const out = [];
  for (const raw of argv) {
    if (!raw || typeof raw !== 'string') continue;
    if (raw === '.' || raw === '..') continue;
    if (raw.startsWith('-')) continue;
    const resolved = path.resolve(raw);
    if (skip.has(resolved)) continue;
    const base = path.basename(raw).toLowerCase();
    if (base === 'electron' || base === 'electron.exe') continue;
    if (base === 'main.js' || base === 'package.json') continue;
    if (isMarkdownPath(raw) || isMarkdownPath(resolved)) {
      out.push(resolved);
    }
  }
  return out;
}

/**
 * First markdown path from argv, or null.
 * @param {string[]} argv
 * @param {{ appPath?: string, execPath?: string }} [opts]
 * @returns {string | null}
 */
function extractOpenPathFromArgv(argv, opts = {}) {
  const found = extractOpenPathsFromArgv(argv, opts);
  return found.length ? found[0] : null;
}

/**
 * Normalize and reject empty / non-string paths for open.
 * Does not require the file to exist (caller checks FS).
 * @param {string} filePath
 * @returns {{ ok: true, path: string } | { ok: false, error: string }}
 */
function normalizeOpenPath(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    return { ok: false, error: 'Path is required' };
  }
  const trimmed = filePath.trim();
  if (!trimmed) {
    return { ok: false, error: 'Path is empty' };
  }
  const resolved = path.resolve(trimmed);
  if (!isMarkdownPath(resolved)) {
    return { ok: false, error: 'Not a markdown file' };
  }
  return { ok: true, path: resolved };
}

/**
 * Resolve a relative href from an open markdown file to another markdown path.
 * Rejects absolute / protocol URLs. Allows `../` (user already chose the source note).
 * Appends `.md` when the target has no extension.
 * @param {string} fromMarkdownFile
 * @param {string} href
 * @returns {string | null} absolute path or null
 */
function resolveRelativeMarkdownHref(fromMarkdownFile, href) {
  if (!fromMarkdownFile || typeof fromMarkdownFile !== 'string') return null;
  if (!href || typeof href !== 'string') return null;
  const raw = href.trim();
  if (!raw || raw.startsWith('#')) return null;
  if (/^(https?:|mailto:|data:|blob:|file:|javascript:)/i.test(raw)) return null;
  if (raw.startsWith('//')) return null;
  if (/^[a-zA-Z]:[\\/]/.test(raw) || raw.startsWith('/')) return null;

  const withoutHashQuery = raw.split(/[?#]/)[0];
  if (!withoutHashQuery) return null;

  let decoded = withoutHashQuery;
  try {
    decoded = decodeURIComponent(withoutHashQuery);
  } catch {
    decoded = withoutHashQuery;
  }

  const baseDir = path.dirname(path.resolve(fromMarkdownFile));
  let resolved = path.resolve(baseDir, decoded);

  if (!isMarkdownPath(resolved)) {
    const ext = path.extname(resolved);
    if (!ext) {
      const withMd = `${resolved}.md`;
      if (isMarkdownPath(withMd)) resolved = withMd;
      else return null;
    } else {
      return null;
    }
  }

  return resolved;
}

/**
 * Defense-in-depth: editor / reveal only for paths the session already touched.
 * @param {string} filePath
 * @param {{
 *   currentFile?: string | null,
 *   navStack?: string[],
 *   recentPaths?: string[],
 * }} ctx
 * @returns {boolean}
 */
function isAllowedUserPath(filePath, ctx = {}) {
  if (!filePath || typeof filePath !== 'string') return false;
  let resolved;
  try {
    resolved = path.resolve(filePath);
  } catch {
    return false;
  }
  if (ctx.currentFile && path.resolve(ctx.currentFile) === resolved) return true;
  if (Array.isArray(ctx.navStack)) {
    for (const p of ctx.navStack) {
      if (typeof p === 'string' && path.resolve(p) === resolved) return true;
    }
  }
  if (Array.isArray(ctx.recentPaths)) {
    for (const p of ctx.recentPaths) {
      if (typeof p === 'string' && path.resolve(p) === resolved) return true;
    }
  }
  return false;
}

module.exports = {
  MARKDOWN_EXTS,
  MARKDOWN_DIALOG_EXTENSIONS,
  MAX_MARKDOWN_BYTES,
  isMarkdownPath,
  markdownDialogFilter,
  extractOpenPathsFromArgv,
  extractOpenPathFromArgv,
  normalizeOpenPath,
  resolveRelativeMarkdownHref,
  isAllowedUserPath,
};
