'use strict';

const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
  Menu,
  nativeTheme,
} = require('electron');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { JSDOM } = require('jsdom');
const { spawn } = require('child_process');
const { extractOpenPathFromArgv, isMarkdownPath, resolveRelativeMarkdownHref } = require('./lib/paths');
const { createMarkdownRenderer } = require('./lib/markdown');
const { rewriteLocalImageSrcs } = require('./lib/media');
const { createPrefsStore } = require('./lib/prefs');
const { decorateHeadings } = require('./lib/outline');

/** @type {BrowserWindow | null} */
let mainWindow = null;
/** @type {import('fs').FSWatcher | null} */
let watcher = null;
/** @type {string | null} */
let currentFile = null;
/** @type {ReturnType<typeof createMarkdownRenderer> | null} */
let md = null;
/** @type {ReturnType<typeof createPrefsStore> | null} */
let prefs = null;
/** @type {string[]} */
let navStack = [];
/** @type {number} */
let navIndex = -1;

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    const file = extractOpenPathFromArgv(argv);
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    if (file) void openMarkdownFile(file);
  });
}

function getRenderer() {
  if (!md) {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    md = createMarkdownRenderer({ window: dom.window });
  }
  return md;
}

function stopWatch() {
  if (watcher) {
    try {
      watcher.close();
    } catch {
      /* ignore */
    }
    watcher = null;
  }
}

function startWatch(filePath) {
  stopWatch();
  try {
    let timer = null;
    watcher = fs.watch(filePath, { persistent: true }, () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (currentFile === filePath) void openMarkdownFile(filePath, { fromWatch: true });
      }, 120);
    });
  } catch {
    /* optional */
  }
}

/**
 * @param {string} filePath
 * @param {{ fromWatch?: boolean, fromHistory?: boolean }} [opts]
 */
async function openMarkdownFile(filePath, opts = {}) {
  const resolved = path.resolve(filePath);
  if (!isMarkdownPath(resolved)) {
    sendError(`Not a markdown file: ${path.basename(resolved)}`);
    return { ok: false, error: 'Not a markdown file' };
  }
  let source;
  try {
    source = fs.readFileSync(resolved, 'utf8');
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    sendError(`Could not read file: ${msg}`);
    return { ok: false, error: msg };
  }

  const { html: rawHtml, title } = getRenderer().render(source);
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  const htmlWithImages = rewriteLocalImageSrcs(rawHtml, resolved, { window: dom.window });
  const wrap = dom.window.document.createElement('div');
  wrap.innerHTML = htmlWithImages;
  const outline = decorateHeadings(wrap);
  const html = wrap.innerHTML;
  currentFile = resolved;
  startWatch(resolved);
  if (prefs) prefs.recordOpen(resolved);

  if (!opts.fromWatch && !opts.fromHistory) {
    const top = navIndex >= 0 ? navStack[navIndex] : null;
    if (top !== resolved) {
      navStack = navStack.slice(0, navIndex + 1);
      navStack.push(resolved);
      if (navStack.length > 40) {
        navStack = navStack.slice(-40);
      }
      navIndex = navStack.length - 1;
    }
  }

  rebuildMenu();
  sendNavState();

  const payload = {
    path: resolved,
    name: path.basename(resolved),
    html,
    title,
    outline,
    canGoBack: navIndex > 0,
  };

  if (mainWindow && !mainWindow.isDestroyed()) {
    if (opts.fromWatch) {
      mainWindow.webContents.send('md:changed', payload);
    } else {
      mainWindow.webContents.send('md:opened', payload);
    }
  }
  return { ok: true, ...payload };
}

function sendNavState() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('md:nav', { canGoBack: navIndex > 0 });
  }
}

async function navigateBack() {
  if (navIndex <= 0) return { ok: false, error: 'No history' };
  navIndex -= 1;
  const target = navStack[navIndex];
  return openMarkdownFile(target, { fromHistory: true });
}

/**
 * Open a relative markdown href from the current file.
 * @param {string} href
 */
async function openRelativeHref(href) {
  if (!currentFile) {
    return { ok: false, error: 'No file open' };
  }
  const resolved = resolveRelativeMarkdownHref(currentFile, href);
  if (!resolved) {
    return { ok: false, error: 'Not a relative markdown link' };
  }
  if (!fs.existsSync(resolved)) {
    sendError(`Missing: ${path.basename(resolved)}`);
    return { ok: false, error: 'File not found' };
  }
  return openMarkdownFile(resolved);
}

function sendError(message) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('md:error', { message });
  }
}

async function openWithDialog() {
  if (!mainWindow) return { ok: false, error: 'No window' };
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Open Markdown',
    properties: ['openFile'],
    filters: [
      { name: 'Markdown', extensions: ['md', 'markdown', 'mdown', 'mkd', 'mkdn'] },
      { name: 'All files', extensions: ['*'] },
    ],
  });
  if (result.canceled || !result.filePaths[0]) {
    return { ok: false, canceled: true };
  }
  return openMarkdownFile(result.filePaths[0]);
}

/**
 * Open file in an external editor (VS Code if on PATH, else Notepad on Windows).
 * @param {string} filePath
 */
function openInExternalEditor(filePath) {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    return Promise.resolve({ ok: false, error: 'File not found' });
  }

  return new Promise((resolve) => {
    let settled = false;
    const done = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const tryCode = spawn('code', ['-g', resolved], {
      shell: true,
      windowsHide: true,
      detached: true,
      stdio: 'ignore',
    });
    tryCode.on('error', () => {
      tryNotepad();
    });
    tryCode.on('close', (code) => {
      if (code === 0 || code === null) {
        try {
          tryCode.unref();
        } catch {
          /* ignore */
        }
        done({ ok: true, editor: 'code' });
      } else {
        tryNotepad();
      }
    });

    function tryNotepad() {
      if (process.platform === 'win32') {
        try {
          const np = spawn('notepad.exe', [resolved], {
            detached: true,
            stdio: 'ignore',
            windowsHide: false,
          });
          np.on('error', (err) => {
            done({ ok: false, error: err.message });
          });
          np.unref();
          done({ ok: true, editor: 'notepad' });
        } catch (err) {
          done({ ok: false, error: err && err.message ? err.message : String(err) });
        }
      } else {
        shell
          .openPath(resolved)
          .then((errMsg) => {
            if (errMsg) done({ ok: false, error: errMsg });
            else done({ ok: true, editor: 'default' });
          })
          .catch((err) => done({ ok: false, error: String(err) }));
      }
    }
  });
}

function rebuildMenu() {
  const recents = prefs ? prefs.getRecents() : [];
  const recentSub =
    recents.length === 0
      ? [{ label: '(empty)', enabled: false }]
      : [
          ...recents.map((r) => ({
            label: r.name,
            toolTip: r.path,
            click: () => void openMarkdownFile(r.path),
          })),
          { type: 'separator' },
          {
            label: 'Clear recent',
            click: () => {
              if (prefs) prefs.clearRecents();
              rebuildMenu();
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('md:recents', prefs.getRecents());
              }
            },
          },
        ];

  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open…',
          accelerator: 'CmdOrCtrl+O',
          click: () => void openWithDialog(),
        },
        {
          label: 'Back',
          accelerator: 'Alt+Left',
          enabled: navIndex > 0,
          click: () => void navigateBack(),
        },
        {
          label: 'Open recent',
          submenu: recentSub,
        },
        {
          label: 'Reveal in Explorer',
          accelerator: 'CmdOrCtrl+Shift+R',
          enabled: Boolean(currentFile),
          click: () => {
            if (currentFile) shell.showItemInFolder(currentFile);
          },
        },
        {
          label: 'Open in editor',
          accelerator: 'CmdOrCtrl+E',
          enabled: Boolean(currentFile),
          click: async () => {
            if (!currentFile) return;
            const r = await openInExternalEditor(currentFile);
            if (!r.ok) sendError(r.error || 'Could not open editor');
          },
        },
        {
          label: 'Print…',
          accelerator: 'CmdOrCtrl+P',
          enabled: Boolean(currentFile),
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.print({});
            }
          },
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Find…',
          accelerator: 'CmdOrCtrl+F',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('md:find-open');
            }
          },
        },
        {
          label: 'Toggle outline',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('md:outline-toggle');
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Zoom in',
          accelerator: 'CmdOrCtrl+=',
          click: () => adjustZoom(0.1),
        },
        {
          label: 'Zoom out',
          accelerator: 'CmdOrCtrl+-',
          click: () => adjustZoom(-0.1),
        },
        {
          label: 'Reset zoom',
          accelerator: 'CmdOrCtrl+0',
          click: () => setZoom(1),
        },
        { type: 'separator' },
        { role: 'toggleDevTools' },
        { role: 'reload' },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function adjustZoom(delta) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const cur = mainWindow.webContents.getZoomFactor();
  setZoom(cur + delta);
}

function setZoom(factor) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const z = Math.min(3, Math.max(0.5, factor));
  mainWindow.webContents.setZoomFactor(z);
  if (prefs) prefs.setZoomFactor(z);
}

function wireFindHandlers(win) {
  win.webContents.on('found-in-page', (_event, result) => {
    if (!win.isDestroyed()) {
      win.webContents.send('md:found-in-page', {
        activeMatchOrdinal: result.activeMatchOrdinal,
        matches: result.matches,
        finalUpdate: result.finalUpdate,
      });
    }
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 960,
    height: 720,
    minWidth: 480,
    minHeight: 360,
    show: false,
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  win.once('ready-to-show', () => {
    win.show();
    if (prefs) {
      const z = prefs.getZoomFactor();
      if (z && z !== 1) win.webContents.setZoomFactor(z);
    }
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow = win;
  wireFindHandlers(win);
  rebuildMenu();

  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null;
    stopWatch();
    currentFile = null;
    navStack = [];
    navIndex = -1;
  });
}

app.whenReady().then(async () => {
  prefs = createPrefsStore(app.getPath('userData'));

  ipcMain.handle('md:open-dialog', () => openWithDialog());
  ipcMain.handle('md:open-path', (_e, filePath) => {
    if (typeof filePath !== 'string') return { ok: false, error: 'Invalid path' };
    return openMarkdownFile(filePath);
  });
  ipcMain.handle('md:open-relative', (_e, href) => {
    if (typeof href !== 'string') return { ok: false, error: 'Invalid href' };
    return openRelativeHref(href);
  });
  ipcMain.handle('md:navigate-back', () => navigateBack());
  ipcMain.handle('md:show-item', (_e, filePath) => {
    if (typeof filePath === 'string' && filePath) shell.showItemInFolder(filePath);
  });
  ipcMain.handle('md:open-external', (_e, url) => {
    if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
      return shell.openExternal(url);
    }
    return Promise.resolve();
  });
  ipcMain.handle('md:get-recents', () => (prefs ? prefs.getRecents() : []));
  ipcMain.handle('md:open-in-editor', (_e, filePath) => {
    if (typeof filePath !== 'string' || !filePath) {
      return { ok: false, error: 'No file' };
    }
    return openInExternalEditor(filePath);
  });
  ipcMain.handle('md:set-zoom', (_e, factor) => {
    if (typeof factor === 'number') setZoom(factor);
    return prefs ? prefs.getZoomFactor() : 1;
  });
  ipcMain.handle('md:get-zoom', () =>
    mainWindow && !mainWindow.isDestroyed()
      ? mainWindow.webContents.getZoomFactor()
      : prefs
        ? prefs.getZoomFactor()
        : 1
  );
  ipcMain.handle('md:find-in-page', (_e, text, opts) => {
    if (!mainWindow || mainWindow.isDestroyed()) return -1;
    const q = typeof text === 'string' ? text : '';
    if (!q) {
      mainWindow.webContents.stopFindInPage('clearSelection');
      return -1;
    }
    const forward = !opts || opts.forward !== false;
    const findNext = Boolean(opts && opts.findNext);
    return mainWindow.webContents.findInPage(q, {
      forward,
      findNext,
      matchCase: Boolean(opts && opts.matchCase),
    });
  });
  ipcMain.handle('md:stop-find', (_e, action) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const a = action === 'keepSelection' ? 'keepSelection' : 'clearSelection';
    mainWindow.webContents.stopFindInPage(a);
  });

  createWindow();

  const fromArgv = extractOpenPathFromArgv(process.argv);
  if (fromArgv) {
    await openMarkdownFile(fromArgv);
  } else if (prefs && prefs.getLastFile()) {
    const last = prefs.getLastFile();
    if (last && fs.existsSync(last) && isMarkdownPath(last)) {
      await openMarkdownFile(last);
    } else if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.once('did-finish-load', () => {
        mainWindow.webContents.send('md:recents', prefs.getRecents());
      });
    }
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  stopWatch();
  if (process.platform !== 'darwin') app.quit();
});

// Silence unused import if tree-shaken differently
void pathToFileURL;
void nativeTheme;
