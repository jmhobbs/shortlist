const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  setShortlist: (cb) => ipcRenderer.on('set-shortlist', (_, items) => cb(items)),
  next: (cb) => ipcRenderer.on('next', cb),
  sync: (items) => ipcRenderer.send('sync', items),
  close: () => ipcRenderer.send('close'),
})
