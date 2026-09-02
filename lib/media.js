'use strict';

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const IMAGE_EXTS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
  '.bmp',
  '.ico',
  '.avif',
]);

const MAX_BYTES = 2 * 1024 * 1024; // 2 MiB per image

/**
 * True if candidate is the same as or inside rootDir (after resolve).
 * @param {string} rootDir
 * @param {string} candidate
 */
function isPathInside(rootDir, candidate) {
  const root = path.resolve(rootDir);
  const target = path.resolve(candidate);
  const rel = path.relative(root, target);
  if (!rel) return true; // same path
  if (rel.startsWith('..') || path.isAbsolute(rel)) return false;
  return true;
}

/**
 * Resolve a markdown image src against the open file's directory.
 * Returns absolute path if allowed, else null (leave src unchanged / drop).
 * @param {string} markdownFilePath
 * @param {string} src
 */
function resolveRelativeImagePath(markdownFilePath, src) {
  if (typeof src !== 'string' || !src.trim()) return null;
  const raw = src.trim();
  if (/^(https?:|data:|blob:|mailto:|file:)/i.test(raw)) return null;
  if (raw.startsWith('//')) return null;

  // Windows absolute path with drive letter — reject (not relative to note)
  if (/^[a-zA-Z]:[\\/]/.test(raw)) return null;
  // POSIX absolute
  if (raw.startsWith('/')) return null;

  const baseDir = path.dirname(path.resolve(markdownFilePath));
  // strip query/hash if any
  const clean = raw.split(/[?#]/)[0];
  let decoded = clean;
  try {
    decoded = decodeURIComponent(clean);
  } catch {
    decoded = clean;
  }

  const resolved = path.resolve(baseDir, decoded);
  if (!isPathInside(baseDir, resolved)) return null;

  const ext = path.extname(resolved).toLowerCase();
  if (!IMAGE_EXTS.has(ext)) return null;

  return resolved;
}

/**
 * @param {string} filePath
 * @returns {string | null} data URL or null
 */
function fileToDataUrl(filePath) {
  try {
    const st = fs.statSync(filePath);
    if (!st.isFile() || st.size <= 0 || st.size > MAX_BYTES) return null;
    const buf = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mime =
      ext === '.svg'
        ? 'image/svg+xml'
        : ext === '.jpg' || ext === '.jpeg'
          ? 'image/jpeg'
          : ext === '.gif'
            ? 'image/gif'
            : ext === '.webp'
              ? 'image/webp'
              : ext === '.bmp'
                ? 'image/bmp'
                : ext === '.ico'
                  ? 'image/x-icon'
                  : ext === '.avif'
                    ? 'image/avif'
                    : 'image/png';
    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

/**
 * Rewrite <img src> relative paths to data URLs when under the markdown dir.
 * Uses a simple attribute rewrite (post-DOMPurify HTML string).
 * @param {string} html
 * @param {string} markdownFilePath
 * @param {{ window: object }} deps jsdom window for DOM parse
 */
function rewriteLocalImageSrcs(html, markdownFilePath, deps) {
  if (!html || !markdownFilePath || !deps || !deps.window) return html;
  const doc = deps.window.document;
  const container = doc.createElement('div');
  container.innerHTML = html;
  const imgs = container.querySelectorAll('img[src]');
  imgs.forEach((img) => {
    const src = img.getAttribute('src');
    const abs = resolveRelativeImagePath(markdownFilePath, src || '');
    if (!abs) return;
    const dataUrl = fileToDataUrl(abs);
    if (dataUrl) {
      img.setAttribute('src', dataUrl);
    } else {
      img.setAttribute('alt', (img.getAttribute('alt') || src || '') + ' (missing image)');
      img.removeAttribute('src');
    }
  });
  return container.innerHTML;
}

module.exports = {
  IMAGE_EXTS,
  MAX_BYTES,
  isPathInside,
  resolveRelativeImagePath,
  fileToDataUrl,
  rewriteLocalImageSrcs,
  pathToFileURL,
};
