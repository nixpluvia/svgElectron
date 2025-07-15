const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectJson: () => ipcRenderer.invoke('select-json'),
  generateFont: (data) => ipcRenderer.send('generate-font', data),
  onGenerateFontDone: (callback) => ipcRenderer.on('generate-font-done', callback),
  loadMarkdown: (filePath) => ipcRenderer.invoke('load-md', filePath),
});
