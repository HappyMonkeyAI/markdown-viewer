'use strict';

const {
  app,
  BrowserWindow,
  Menu,
  dialog,
  ipcMain,
  shell,
  nativeTheme,
} = require('electron');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { JSDOM } = require('jsdom');
const {
  extractOpenPathsFromArgv,
  normalizeOpenPath,
  isMarkdownPath,
} = require('./lib/paths');
const { createMarkdownRenderer } = require('./lib/markdown');

/** @type {BrowserWindow | null} */
let mainWindow = null;
/** @type {string | null} */
let currentFile = null;
/** @type {fs.FSWatcher | null} */
let watcher = null;
let watcherTimer = null;

const purifyDom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
const md = createMarkdownRenderer({ window: purifyDom.window });

app.setName('markdown-viewer');
app.setPath('userData', path.join(app.getPath('appData'), 'markdown-viewer'));

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    const paths = extractOpenPathsFromArgv(argv, {
      execPath: process.execPath,
      appPath: app.getAppPath(),
    });
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    if (paths[0]) openMarkdownFile(paths[0]);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 720,
    minWidth: 480,
    minHeight: 320,
    show: false,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1e1e1e' : '#fafafa',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const u = new URL(url);
      if (u.protocol === 'http:' || u.protocol === 'https:') {
        shell.openExternal(url);
      }
    } catch {
      /* ignore */
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const rendererDir = pathToFileURL(path.join(__dirname, 'renderer')).href;
    if (!url.startsWith(rendererDir)) {
      event.preventDefault();
      try {
        const u = new URL(url);
        if (u.protocol === 'http:' || u.protocol === 'https:') {
          shell.openExternal(url);
        }
      } catch {
        /* ignore */
      }
    }
  });

  mainWindow.on('closed', () => {
    stopWatch();
    mainWindow = null;
  });

  buildMenu();
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'Open…',
          accelerator: 'CmdOrCtrl+O',
          click: () => void promptOpen(),
        },
        {
          label: 'Reload file',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            if (currentFile) openMarkdownFile(currentFile);
          },
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'togglefullscreen' },
        { type: 'separator' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'resetZoom' },
        { type: 'separator' },
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
          click: () => mainWindow?.webContents.toggleDevTools(),
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Open sample markdown',
          click: () => {
            const sample = path.join(__dirname, 'fixtures', 'sample.md');
            if (fs.existsSync(sample)) openMarkdownFile(sample);
          },
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function promptOpen() {
  if (!mainWindow) return;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Open Markdown',
    properties: ['openFile'],
    filters: [
      { name: 'Markdown', extensions: ['md', 'markdown', 'mdown', 'mkd', 'mdx'] },
      { name: 'All files', extensions: ['*'] },
    ],
  });
  if (result.canceled || !result.filePaths[0]) return;
  openMarkdownFile(result.filePaths[0]);
}

/**
 * @param {string} filePath
 */
function openMarkdownFile(filePath) {
  const norm = normalizeOpenPath(filePath);
  if (!norm.ok) {
    sendToRenderer('file:error', { message: norm.error });
    return;
  }
  const resolved = norm.path;
  let raw;
  try {
    raw = fs.readFileSync(resolved, 'utf8');
  } catch (err) {
    sendToRenderer('file:error', {
      message: err && err.message ? err.message : 'Failed to read file',
      path: resolved,
    });
    return;
  }

  let rendered;
  try {
    rendered = md.render(raw);
  } catch (err) {
    sendToRenderer('file:error', {
      message: err && err.message ? err.message : 'Failed to render markdown',
      path: resolved,
    });
    return;
  }

  currentFile = resolved;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setTitle(`${path.basename(resolved)} — Markdown Viewer`);
  }

  const payload = {
    path: resolved,
    name: path.basename(resolved),
    html: rendered.html,
    title: rendered.title,
    mtimeMs: fs.statSync(resolved).mtimeMs,
  };
  sendToRenderer('file:opened', payload);
  watchFile(resolved);
}

function sendToRenderer(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

function stopWatch() {
  if (watcherTimer) {
    clearTimeout(watcherTimer);
    watcherTimer = null;
  }
  if (watcher) {
    try {
      watcher.close();
    } catch {
      /* ignore */
    }
    watcher = null;
  }
}

function watchFile(filePath) {
  stopWatch();
  try {
    watcher = fs.watch(filePath, { persistent: true }, (eventType) => {
      if (eventType !== 'change' && eventType !== 'rename') return;
      if (watcherTimer) clearTimeout(watcherTimer);
      watcherTimer = setTimeout(() => {
        if (currentFile !== filePath) return;
        try {
          if (!fs.existsSync(filePath)) return;
          const raw = fs.readFileSync(filePath, 'utf8');
          const rendered = md.render(raw);
          sendToRenderer('file:changed', {
            path: filePath,
            name: path.basename(filePath),
            html: rendered.html,
            title: rendered.title,
            mtimeMs: fs.statSync(filePath).mtimeMs,
          });
        } catch {
          /* ignore transient lock errors on Windows */
        }
      }, 400);
    });
  } catch {
    /* watching is best-effort */
  }
}

function initialPathFromArgv() {
  const paths = extractOpenPathsFromArgv(process.argv, {
    execPath: process.execPath,
    appPath: app.getAppPath(),
  });
  return paths[0] || null;
}

app.whenReady().then(() => {
  createWindow();

  ipcMain.handle('app:getInfo', () => ({
    name: app.getName(),
    version: app.getVersion(),
    platform: process.platform,
    dark: nativeTheme.shouldUseDarkColors,
  }));

  ipcMain.handle('file:openDialog', async () => {
    await promptOpen();
    return { ok: true };
  });

  ipcMain.handle('file:openPath', async (_evt, filePath) => {
    const norm = normalizeOpenPath(filePath);
    if (!norm.ok) return { ok: false, error: norm.error };
    if (!fs.existsSync(norm.path)) return { ok: false, error: 'File not found' };
    openMarkdownFile(norm.path);
    return { ok: true, path: norm.path };
  });

  ipcMain.handle('shell:openExternal', async (_evt, url) => {
    if (typeof url !== 'string') return { ok: false };
    try {
      const u = new URL(url);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        return { ok: false, error: 'Only http(s) allowed' };
      }
      await shell.openExternal(url);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : 'open failed' };
    }
  });

  ipcMain.handle('shell:showItemInFolder', async (_evt, filePath) => {
    if (typeof filePath !== 'string' || !fs.existsSync(filePath)) {
      return { ok: false };
    }
    shell.showItemInFolder(filePath);
    return { ok: true };
  });

  const initial = initialPathFromArgv();
  if (initial) {
    mainWindow?.webContents.once('did-finish-load', () => {
      openMarkdownFile(initial);
    });
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

module.exports = {
  extractOpenPathsFromArgv,
  normalizeOpenPath,
  isMarkdownPath,
};
