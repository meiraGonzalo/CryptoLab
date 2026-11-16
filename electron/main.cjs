// Proceso principal de la versión de escritorio de CriptoLab.
// Abre una ventana con la compilación de Vite (carpeta dist/). La aplicación no
// necesita servidor: todo el cálculo ocurre en la ventana, igual que en el navegador.
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('node:path');

// Una sola instancia: si se abre de nuevo, se enfoca la ventana existente.
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#080d18', // mismo color de fondo que la app: evita un destello blanco al abrir
    title: 'CriptoLab',
    icon: path.join(__dirname, 'icon.png'),
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());

  // Los enlaces externos se abren en el navegador del sistema, no dentro de la app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) {
      event.preventDefault();
      if (/^https?:\/\//.test(url)) shell.openExternal(url);
    }
  });
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
