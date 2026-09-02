'use strict';

/**
 * GitHub-ish slug for heading anchors.
 * @param {string} text
 * @param {Set<string>} [used]
 * @returns {string}
 */
function headingIdFromText(text, used) {
  const set = used || new Set();
  let base = String(text || '')
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (!base) base = 'section';
  let id = base;
  let n = 2;
  while (set.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  set.add(id);
  return id;
}

/**
 * Assign ids to h1–h3 in a DOM root; return outline entries.
 * @param {ParentNode} root
 * @returns {Array<{ id: string, level: number, text: string }>}
 */
function decorateHeadings(root) {
  if (!root || !root.querySelectorAll) return [];
  const used = new Set();
  const outline = [];
  root.querySelectorAll('h1, h2, h3').forEach((el) => {
    const text = (el.textContent || '').trim();
    if (!text) return;
    let id = el.getAttribute('id');
    if (!id) {
      id = headingIdFromText(text, used);
      el.setAttribute('id', id);
    } else {
      used.add(id);
    }
    const level = Number(el.tagName.charAt(1)) || 2;
    outline.push({ id, level, text: text.slice(0, 120) });
  });
  return outline;
}

module.exports = {
  headingIdFromText,
  decorateHeadings,
};
