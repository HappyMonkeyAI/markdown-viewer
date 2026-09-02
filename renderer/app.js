'use strict';

const api = window.mdViewer;

const els = {
  open: document.getElementById('btn-open'),
  reveal: document.getElementById('btn-reveal'),
  editor: document.getElementById('btn-editor'),
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
};

/** @type {{ path: string, name: string } | null} */
let current = null;
let toastTimer = null;

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

/**
 * @param {{ path: string, name: string, html: string, title: string }} payload
 */
function showFile(payload) {
  current = { path: payload.path, name: payload.name };
  els.label.textContent = payload.name;
  els.label.title = payload.path;
  els.reveal.disabled = false;
  if (els.editor) els.editor.disabled = false;
  els.empty.hidden = true;
  els.content.hidden = false;
  els.content.innerHTML = payload.html || '';
  document.title = (payload.title || payload.name) + ' — Markdown Viewer';

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
      /* in-page */
    } else {
      a.addEventListener('click', function (ev) {
        ev.preventDefault();
        showToast('Local relative links are not opened yet', false);
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
  els.empty.hidden = false;
  els.content.hidden = true;
  els.content.innerHTML = '';
  document.title = 'Markdown Viewer';
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

initTheme();
showEmpty();
api.getZoom().then(updateZoomLabel);

window.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    els.toast.hidden = true;
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
