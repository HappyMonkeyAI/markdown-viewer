'use strict';

const fs = require('fs');
const path = require('path');

const MAX_RECENTS = 12;

/**
 * @param {string} userDataPath app.getPath('userData')
 */
function createPrefsStore(userDataPath) {
  const filePath = path.join(userDataPath, 'prefs.json');

  /** @type {{ recents: Array<{ path: string, name: string, openedAt: number }>, lastFile: string | null, zoomFactor: number }} */
  let cache = {
    recents: [],
    lastFile: null,
    zoomFactor: 1,
  };

  function load() {
    try {
      if (!fs.existsSync(filePath)) return;
      const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (!raw || typeof raw !== 'object') return;
      if (Array.isArray(raw.recents)) {
        cache.recents = raw.recents
          .filter((r) => r && typeof r.path === 'string')
          .map((r) => ({
            path: r.path,
            name: typeof r.name === 'string' ? r.name : path.basename(r.path),
            openedAt: typeof r.openedAt === 'number' ? r.openedAt : 0,
          }))
          .slice(0, MAX_RECENTS);
      }
      if (typeof raw.lastFile === 'string' || raw.lastFile === null) {
        cache.lastFile = raw.lastFile;
      }
      if (typeof raw.zoomFactor === 'number' && raw.zoomFactor > 0.25 && raw.zoomFactor < 5) {
        cache.zoomFactor = raw.zoomFactor;
      }
    } catch {
      /* keep defaults */
    }
  }

  function save() {
    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(cache, null, 2), 'utf8');
    } catch {
      /* ignore */
    }
  }

  load();

  return {
    getAll() {
      return {
        recents: cache.recents.slice(),
        lastFile: cache.lastFile,
        zoomFactor: cache.zoomFactor,
      };
    },
    getRecents() {
      return cache.recents.slice();
    },
    getLastFile() {
      return cache.lastFile;
    },
    getZoomFactor() {
      return cache.zoomFactor;
    },
    /**
     * @param {string} filePath
     */
    recordOpen(filePath) {
      if (typeof filePath !== 'string' || !filePath) return;
      const resolved = path.resolve(filePath);
      const name = path.basename(resolved);
      const openedAt = Date.now();
      cache.lastFile = resolved;
      cache.recents = [
        { path: resolved, name, openedAt },
        ...cache.recents.filter((r) => path.resolve(r.path) !== resolved),
      ].slice(0, MAX_RECENTS);
      save();
    },
    setZoomFactor(z) {
      if (typeof z !== 'number' || !(z > 0.25) || !(z < 5)) return;
      cache.zoomFactor = Math.round(z * 1000) / 1000;
      save();
    },
    clearRecents() {
      cache.recents = [];
      save();
    },
    /** @internal test helper */
    _filePath: filePath,
  };
}

module.exports = {
  createPrefsStore,
  MAX_RECENTS,
};
