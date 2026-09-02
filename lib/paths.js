'use strict';

const path = require('path');

const MARKDOWN_EXTS = new Set(['.md', '.markdown', '.mdown', '.mkd', '.mdx']);

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
    // Dev: `electron .` — ignore cwd marker already handled; also ignore app root when it's a dir flag only
    if (isMarkdownPath(raw) || isMarkdownPath(resolved)) {
      out.push(resolved);
    }
  }
  return out;
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

module.exports = {
  MARKDOWN_EXTS,
  isMarkdownPath,
  extractOpenPathsFromArgv,
  normalizeOpenPath,
};
