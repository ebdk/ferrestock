import { BrowserWindow, app } from 'electron';
import path from 'node:path';

function createWindow() {
  const ventanaPrincipal = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (process.env.NODE_ENV === 'development') {
    ventanaPrincipal.loadURL('http://localhost:5173');
    return;
  }

  ventanaPrincipal.loadFile(path.join(__dirname, '../../dist/renderer/index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
