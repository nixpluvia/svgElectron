const { app, BrowserWindow, Menu, screen } = require('electron');
const path = require('path');
const setupHandle = require('./api/setupHandle');

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  const win = new BrowserWindow({
    width,
    height,
    webPreferences: {
      preload: path.join(__dirname, '/api/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    frame: true, // 창의 프레임(타이틀바 등) 표시
    fullscreen: false, // 풀스크린 모드 해제
  });
  win.setBounds({ x: 0, y: 0, width, height }); // 화면 전체 크기에 맞춤
  win.center(); // 화면 중앙에 위치

  // index.html 로드
  win.loadFile('./public/html/index.html');

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