'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mdViewer', {
  getInfo: () => ipcRenderer.invoke('app:getInfo'),
  openDialog: () => ipcRenderer.invoke('file:openDialog'),
  openPath: (filePath) => ipcRenderer.invoke('file:openPath', filePath),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  showItemInFolder: (filePath) => ipcRenderer.invoke('shell:showItemInFolder', filePath),
  onOpened: (handler) => {
    const listener = (_event, payload) => handler(payload);
    ipcRenderer.on('file:opened', listener);
    return () => ipcRenderer.removeListener('file:opened', listener);
  },
  onChanged: (handler) => {
    const listener = (_event, payload) => handler(payload);
    ipcRenderer.on('file:changed', listener);
    return () => ipcRenderer.removeListener('file:changed', listener);
  },
  onError: (handler) => {
    const listener = (_event, payload) => handler(payload);
    ipcRenderer.on('file:error', listener);
    return () => ipcRenderer.removeListener('file:error', listener);
  },
});
