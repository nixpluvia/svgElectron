const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const setupHandle = require('./api/setupHandle');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '/api/preload.js'),
      contextIsolation: true, // contextIsolation을 true로 설정하여 보안 강화
      nodeIntegration: false,  // preload만 사용 시 권장
    }
  });

  // index.html 로드
  win.loadFile('index.html');

  const menuTemplate = [
    {
      label: '옵션',
      submenu: [
        {
          label: '개발자 도구 토글',
          accelerator: 'F12',
          click: () => {
            win.webContents.toggleDevTools();
          },
        },
        { role: 'reload' },
        { role: 'forcereload' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  // 개발자 도구 자동 열기 (개발할 때 편리)
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();
  setupHandle();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});