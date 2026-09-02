'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mdViewer', {
  openDialog: () => ipcRenderer.invoke('md:open-dialog'),
  openPath: (filePath) => ipcRenderer.invoke('md:open-path', filePath),
  openRelative: (href) => ipcRenderer.invoke('md:open-relative', href),
  navigateBack: () => ipcRenderer.invoke('md:navigate-back'),
  showItemInFolder: (filePath) => ipcRenderer.invoke('md:show-item', filePath),
  openExternal: (url) => ipcRenderer.invoke('md:open-external', url),
  getRecents: () => ipcRenderer.invoke('md:get-recents'),
  openInEditor: (filePath) => ipcRenderer.invoke('md:open-in-editor', filePath),
  setZoom: (factor) => ipcRenderer.invoke('md:set-zoom', factor),
  getZoom: () => ipcRenderer.invoke('md:get-zoom'),
  onOpened: (cb) => {
    const listener = (_event, payload) => cb(payload);
    ipcRenderer.on('md:opened', listener);
    return () => ipcRenderer.removeListener('md:opened', listener);
  },
  onChanged: (cb) => {
    const listener = (_event, payload) => cb(payload);
    ipcRenderer.on('md:changed', listener);
    return () => ipcRenderer.removeListener('md:changed', listener);
  },
  onError: (cb) => {
    const listener = (_event, payload) => cb(payload);
    ipcRenderer.on('md:error', listener);
    return () => ipcRenderer.removeListener('md:error', listener);
  },
  onRecents: (cb) => {
    const listener = (_event, payload) => cb(payload);
    ipcRenderer.on('md:recents', listener);
    return () => ipcRenderer.removeListener('md:recents', listener);
  },
  onNav: (cb) => {
    const listener = (_event, payload) => cb(payload);
    ipcRenderer.on('md:nav', listener);
    return () => ipcRenderer.removeListener('md:nav', listener);
  },
});
