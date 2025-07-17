const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectJson: () => ipcRenderer.invoke('select-json'),
  selectSvg: () => ipcRenderer.invoke('select-svg'),
  generateAll: (data) => ipcRenderer.send('generate-all', JSON.parse(JSON.stringify(data))),
  generateFont: (data) => ipcRenderer.send('generate-font', JSON.parse(JSON.stringify(data))),
  generateSprite: (data) => ipcRenderer.send('generate-sprite', JSON.parse(JSON.stringify(data))),
  generateVariable: (data) => ipcRenderer.send('generate-variable', JSON.parse(JSON.stringify(data))),
  onGenerateAllDone: (callback) => ipcRenderer.on('generate-all-done', callback),
  onGenerateFontDone: (callback) => ipcRenderer.on('generate-font-done', callback),
  onGenerateVariableDone: (callback) => ipcRenderer.on('generate-variable-done', callback),
  onGenerateSpriteDone: (callback) => ipcRenderer.on('generate-sprite-done', callback),
  loadMarkdown: (filePath) => ipcRenderer.invoke('load-md', filePath),
});
