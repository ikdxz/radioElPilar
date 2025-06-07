const { app, BrowserWindow, screen, Menu } = require('electron');
const AutoLaunch = require('electron-auto-launch');

let win;

function createWindow () {

    const { width, height } = screen.getPrimaryDisplay().workAreaSize;


  win = new BrowserWindow({
    width: width,
    height: height,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // 👇 Esto quita el menú (Archivo, Ver, etc.)
  Menu.setApplicationMenu(null);

  win.loadURL('http://192.168.0.20:8001/login.html');

  win.on('closed', () => {
    win = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  const autoLauncher = new AutoLaunch({
    name: 'Radio El Pilar Admin',
  });

  autoLauncher.isEnabled()
    .then((isEnabled) => {
      if (!isEnabled) autoLauncher.enable();
    })
    .catch(err => {
      console.error('Error al configurar auto-launch:', err);
    });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // En macOS las apps suelen quedarse abiertas hasta que se cierra explícitamente
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
