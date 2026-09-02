'use strict';

const api = window.mdViewer;

const els = {
  open: document.getElementById('btn-open'),
  reveal: document.getElementById('btn-reveal'),
  theme: document.getElementById('btn-theme'),
  label: document.getElementById('file-label'),
  empty: document.getElementById('empty'),
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

/**
 * @param {{ path: string, name: string, html: string, title: string }} payload
 */
function showFile(payload) {
  current = { path: payload.path, name: payload.name };
  els.label.textContent = payload.name;
  els.label.title = payload.path;
  els.reveal.disabled = false;
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
        showToast('Local relative links are not opened in v0.1', false);
      });
    }
  });
}

function showEmpty() {
  current = null;
  els.label.textContent = 'No file open';
  els.label.title = '';
  els.reveal.disabled = true;
  els.empty.hidden = false;
  els.content.hidden = true;
  els.content.innerHTML = '';
  document.title = 'Markdown Viewer';
}

els.open.addEventListener('click', function () {
  api.openDialog();
});

els.reveal.addEventListener('click', function () {
  if (current && current.path) api.showItemInFolder(current.path);
});

els.theme.addEventListener('click', function () {
  const now = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(now);
});

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

initTheme();
showEmpty();

window.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    els.toast.hidden = true;
  }
});
