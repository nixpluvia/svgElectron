const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectJson: () => ipcRenderer.invoke('select-json'),
  selectSvg: () => ipcRenderer.invoke('select-svg'),
  generateFont: (data) => ipcRenderer.send('generate-font', data),
  generateVariable: (data) => ipcRenderer.send('generate-variable', data),
  onGenerateFontDone: (callback) => ipcRenderer.on('generate-font-done', callback),
  onGenerateVariableDone: (callback) => ipcRenderer.on('generate-variable-done', callback),
  loadMarkdown: (filePath) => ipcRenderer.invoke('load-md', filePath),
});
