'use strict';

const api = window.mdViewer;

const els = {
  back: document.getElementById('btn-back'),
  open: document.getElementById('btn-open'),
  reveal: document.getElementById('btn-reveal'),
  editor: document.getElementById('btn-editor'),
  outlineBtn: document.getElementById('btn-outline'),
  findBtn: document.getElementById('btn-find'),
  theme: document.getElementById('btn-theme'),
  zoomOut: document.getElementById('btn-zoom-out'),
  zoomIn: document.getElementById('btn-zoom-in'),
  zoomLabel: document.getElementById('zoom-label'),
  label: document.getElementById('file-label'),
  empty: document.getElementById('empty'),
  recents: document.getElementById('recents'),
  content: document.getElementById('content'),
  drop: document.getElementById('drop-zone'),
  toast: document.getElementById('toast'),
  hljsDark: document.getElementById('hljs-dark'),
  hljsLight: document.getElementById('hljs-light'),
  findBar: document.getElementById('find-bar'),
  findInput: document.getElementById('find-input'),
  findCount: document.getElementById('find-count'),
  findPrev: document.getElementById('find-prev'),
  findNext: document.getElementById('find-next'),
  findClose: document.getElementById('find-close'),
  outline: document.getElementById('outline'),
  outlineNav: document.getElementById('outline-nav'),
};

/** @type {{ path: string, name: string } | null} */
let current = null;
let toastTimer = null;
let findTimer = null;
let outlineOpen = localStorage.getItem('md-viewer-outline') === '1';
/** @type {Array<{ id: string, level: number, text: string }>} */
let lastOutline = [];

function applyTheme(theme) {
  const mode = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', mode);
  localStorage.setItem('md-viewer-theme', mode);
  if (els.hljsDark && els.hljsLight) {
    els.hljsDark.disabled = mode !== 'dark';
    els.hljsLight.disabled = mode === 'dark';
  }
}

function initTheme() {
  const saved = localStorage.getItem('md-viewer-theme');
  if (saved === 'dark' || saved === 'light') {
    applyTheme(saved);
    return;
  }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(prefersDark ? 'dark' : 'light');
}

function showToast(message, isError) {
  els.toast.hidden = false;
  els.toast.textContent = message;
  els.toast.classList.toggle('error', Boolean(isError));
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    els.toast.hidden = true;
  }, 3200);
}

function updateZoomLabel(factor) {
  if (!els.zoomLabel) return;
  const pct = Math.round((factor || 1) * 100);
  els.zoomLabel.textContent = pct + '%';
}

function setBackEnabled(on) {
  if (els.back) els.back.disabled = !on;
}

function renderOutline(list) {
  lastOutline = Array.isArray(list) ? list : [];
  if (!els.outlineNav) return;
  els.outlineNav.innerHTML = '';
  if (!lastOutline.length) {
    const p = document.createElement('p');
    p.className = 'muted';
    p.style.padding = '0 8px';
    p.style.fontSize = '12px';
    p.textContent = 'No headings';
    els.outlineNav.appendChild(p);
    return;
  }
  lastOutline.forEach(function (item) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'outline-item l' + item.level;
    btn.textContent = item.text;
    btn.title = item.text;
    btn.addEventListener('click', function () {
      const target = document.getElementById(item.id);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    els.outlineNav.appendChild(btn);
  });
}

function setOutlineVisible(on) {
  outlineOpen = Boolean(on);
  localStorage.setItem('md-viewer-outline', outlineOpen ? '1' : '0');
  if (els.outline) {
    els.outline.hidden = !outlineOpen || !current;
  }
}

function openFindBar() {
  if (!els.findBar) return;
  els.findBar.hidden = false;
  if (els.findInput) {
    els.findInput.focus();
    els.findInput.select();
  }
}

function closeFindBar() {
  if (!els.findBar) return;
  els.findBar.hidden = true;
  if (els.findCount) els.findCount.textContent = '';
  api.stopFind('clearSelection');
}

function runFind(opts) {
  const q = els.findInput ? els.findInput.value : '';
  if (!q) {
    api.stopFind('clearSelection');
    if (els.findCount) els.findCount.textContent = '';
    return;
  }
  api.findInPage(q, opts || { forward: true, findNext: false });
}

/**
 * @param {{ path: string, name: string, html: string, title: string, canGoBack?: boolean, outline?: Array }} payload
 */
function showFile(payload) {
  current = { path: payload.path, name: payload.name };
  els.label.textContent = payload.name;
  els.label.title = payload.path;
  els.reveal.disabled = false;
  if (els.editor) els.editor.disabled = false;
  if (els.outlineBtn) els.outlineBtn.disabled = false;
  setBackEnabled(Boolean(payload.canGoBack));
  els.empty.hidden = true;
  els.content.hidden = false;
  els.content.innerHTML = payload.html || '';
  document.title = (payload.title || payload.name) + ' — Markdown Viewer';

  renderOutline(payload.outline || []);
  setOutlineVisible(outlineOpen);

  els.content.querySelectorAll('a[href]').forEach(function (a) {
    const href = a.getAttribute('href') || '';
    if (/^https?:\/\//i.test(href)) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
      a.addEventListener('click', function (ev) {
        ev.preventDefault();
        api.openExternal(href);
      });
    } else if (href.startsWith('#')) {
      a.addEventListener('click', function (ev) {
        const id = href.slice(1);
        const target = id && document.getElementById(id);
        if (target) {
          ev.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    } else {
      a.addEventListener('click', function (ev) {
        ev.preventDefault();
        api.openRelative(href).then(function (result) {
          if (!result || !result.ok) {
            showToast((result && result.error) || 'Could not open link', true);
          }
        });
      });
    }
  });
}

/**
 * @param {Array<{ path: string, name: string }>|undefined} list
 */
function renderRecents(list) {
  if (!els.recents) return;
  els.recents.innerHTML = '';
  if (!list || !list.length) {
    els.recents.hidden = true;
    return;
  }
  els.recents.hidden = false;
  const heading = document.createElement('p');
  heading.className = 'muted recents-heading';
  heading.textContent = 'Recent';
  els.recents.appendChild(heading);
  const ul = document.createElement('ul');
  ul.className = 'recents-list';
  list.slice(0, 8).forEach(function (item) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'recent-item';
    btn.textContent = item.name;
    btn.title = item.path;
    btn.addEventListener('click', function () {
      api.openPath(item.path).then(function (result) {
        if (!result || !result.ok) {
          showToast((result && result.error) || 'Failed to open file', true);
        }
      });
    });
    li.appendChild(btn);
    ul.appendChild(li);
  });
  els.recents.appendChild(ul);
}

function showEmpty(recentsList) {
  current = null;
  els.label.textContent = 'No file open';
  els.label.title = '';
  els.reveal.disabled = true;
  if (els.editor) els.editor.disabled = true;
  if (els.outlineBtn) els.outlineBtn.disabled = true;
  setBackEnabled(false);
  setOutlineVisible(false);
  if (els.outline) els.outline.hidden = true;
  els.empty.hidden = false;
  els.content.hidden = true;
  els.content.innerHTML = '';
  document.title = 'Markdown Viewer';
  closeFindBar();
  if (recentsList) renderRecents(recentsList);
  else {
    api.getRecents().then(function (list) {
      renderRecents(list);
    });
  }
}

els.open.addEventListener('click', function () {
  api.openDialog();
});

if (els.back) {
  els.back.addEventListener('click', function () {
    api.navigateBack().then(function (result) {
      if (!result || !result.ok) {
        showToast((result && result.error) || 'No history', false);
      }
    });
  });
}

els.reveal.addEventListener('click', function () {
  if (current && current.path) api.showItemInFolder(current.path);
});

if (els.editor) {
  els.editor.addEventListener('click', function () {
    if (!current || !current.path) return;
    api.openInEditor(current.path).then(function (result) {
      if (!result || !result.ok) {
        showToast((result && result.error) || 'Could not open editor', true);
      }
    });
  });
}

if (els.outlineBtn) {
  els.outlineBtn.addEventListener('click', function () {
    if (!current) return;
    setOutlineVisible(!outlineOpen);
  });
}

if (els.findBtn) {
  els.findBtn.addEventListener('click', function () {
    openFindBar();
  });
}

if (els.findInput) {
  els.findInput.addEventListener('input', function () {
    if (findTimer) clearTimeout(findTimer);
    findTimer = setTimeout(function () {
      runFind({ forward: true, findNext: false });
    }, 120);
  });
  els.findInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      runFind({ forward: !e.shiftKey, findNext: true });
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      closeFindBar();
    }
  });
}

if (els.findNext) {
  els.findNext.addEventListener('click', function () {
    runFind({ forward: true, findNext: true });
  });
}
if (els.findPrev) {
  els.findPrev.addEventListener('click', function () {
    runFind({ forward: false, findNext: true });
  });
}
if (els.findClose) {
  els.findClose.addEventListener('click', function () {
    closeFindBar();
  });
}

els.theme.addEventListener('click', function () {
  const now = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(now);
});

function bumpZoom(delta) {
  api.getZoom().then(function (z) {
    const next = Math.min(3, Math.max(0.5, (z || 1) + delta));
    api.setZoom(next).then(function (applied) {
      updateZoomLabel(applied || next);
    });
  });
}

if (els.zoomIn) els.zoomIn.addEventListener('click', function () { bumpZoom(0.1); });
if (els.zoomOut) els.zoomOut.addEventListener('click', function () { bumpZoom(-0.1); });

['dragenter', 'dragover'].forEach(function (evt) {
  els.drop.addEventListener(evt, function (e) {
    e.preventDefault();
    e.stopPropagation();
    els.drop.classList.add('dragover');
  });
});

['dragleave', 'drop'].forEach(function (evt) {
  els.drop.addEventListener(evt, function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (evt === 'dragleave') els.drop.classList.remove('dragover');
  });
});

els.drop.addEventListener('drop', function (e) {
  els.drop.classList.remove('dragover');
  const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (!file) return;
  const filePath = file.path;
  if (!filePath) {
    showToast('Could not read dropped path', true);
    return;
  }
  api.openPath(filePath).then(function (result) {
    if (!result || !result.ok) {
      showToast((result && result.error) || 'Failed to open file', true);
    }
  });
});

api.onOpened(function (payload) {
  showFile(payload);
});

api.onChanged(function (payload) {
  if (current && payload.path === current.path) {
    showFile(payload);
    showToast('Reloaded from disk');
  }
});

api.onError(function (payload) {
  showToast((payload && payload.message) || 'Error', true);
});

api.onRecents(function (list) {
  if (!current) renderRecents(list);
});

api.onNav(function (payload) {
  setBackEnabled(Boolean(payload && payload.canGoBack));
});

api.onFindOpen(function () {
  openFindBar();
});

api.onOutlineToggle(function () {
  if (!current) return;
  setOutlineVisible(!outlineOpen);
});

api.onFoundInPage(function (result) {
  if (!els.findCount || !result) return;
  if (result.finalUpdate) {
    if (!result.matches) els.findCount.textContent = '0';
    else els.findCount.textContent = result.activeMatchOrdinal + '/' + result.matches;
  }
});

initTheme();
showEmpty();
api.getZoom().then(updateZoomLabel);

window.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    if (els.findBar && !els.findBar.hidden) {
      closeFindBar();
      return;
    }
    els.toast.hidden = true;
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
    e.preventDefault();
    openFindBar();
  }
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'o') {
    e.preventDefault();
    if (current) setOutlineVisible(!outlineOpen);
  }
  if (e.altKey && e.key === 'ArrowLeft') {
    e.preventDefault();
    api.navigateBack();
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
    e.preventDefault();
    bumpZoom(0.1);
  }
  if ((e.ctrlKey || e.metaKey) && e.key === '-') {
    e.preventDefault();
    bumpZoom(-0.1);
  }
  if ((e.ctrlKey || e.metaKey) && e.key === '0') {
    e.preventDefault();
    api.setZoom(1).then(updateZoomLabel);
  }
});
