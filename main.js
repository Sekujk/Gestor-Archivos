const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
// Cargar variables de entorno desde .env
require('dotenv').config({
  path: app.isPackaged 
    ? path.join(process.resourcesPath, '.env')
    : path.join(__dirname, '.env')
});

// Verificar que las variables de entorno estén disponibles
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Variables de entorno para Supabase no encontradas');
  // En desarrollo, podemos terminar la aplicación
  if (!app.isPackaged) {
    process.exit(1);
  }
  // En producción, continuamos pero mostramos error
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false // Para mayor seguridad
    },
    autoHideMenuBar: true,
    frame: true,
    show: false // Inicialmente ocultamos la ventana hasta que esté lista
  });

  // Cargamos el archivo HTML
  mainWindow.loadFile('renderer/index.html');

  // Una vez que la ventana esté lista, la maximizamos y mostramos
  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  // Opcional: abre DevTools en desarrollo
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function setupAutoUpdater() {
  // Configuración de autoUpdater
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  // Evento: actualización disponible
  autoUpdater.on('update-available', (info) => {
    console.log('🟡 Actualización disponible:', info.version);

    // Notificar al renderer sobre la actualización disponible
    if (mainWindow) {
      mainWindow.webContents.send('update-available', info);
    }
  });

  // Evento: actualización descargada
  autoUpdater.on('update-downloaded', (info) => {
    console.log('✅ Actualización descargada:', info.version);

    // Notificar al renderer sobre la actualización descargada
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded', info);
    }
  });

  // Evento: error en actualización
  autoUpdater.on('error', (err) => {
    console.error('❌ Error en actualización:', err);
    if (mainWindow) {
      mainWindow.webContents.send('update-error', err.message);
    }
  });

  // Evento: progreso de descarga
  autoUpdater.on('download-progress', (progressObj) => {
    console.log(`🔄 Descarga: ${progressObj.percent.toFixed(2)}%`);
    if (mainWindow) {
      mainWindow.webContents.send('download-progress', progressObj);
    }
  });

  // Verificar actualizaciones periódicamente (cada 4 horas)
  setInterval(() => {
    autoUpdater.checkForUpdates().catch(err => {
      console.error('Error al verificar actualizaciones periódicas:', err);
    });
  }, 4 * 60 * 60 * 1000);
}

// IPC handlers para comunicación con el renderer
function setupIpcHandlers() {
  // Instalar actualización y reiniciar
  ipcMain.handle('install-update', () => {
    autoUpdater.quitAndInstall(false, true);
  });

  // Obtener credenciales de Supabase
  ipcMain.handle('get-supabase-credentials', () => {
    return {
      url: SUPABASE_URL,
      key: SUPABASE_KEY
    };
  });

  // Verificar actualizaciones manualmente
  ipcMain.handle('check-for-updates', async () => {
    try {
      return await autoUpdater.checkForUpdates();
    } catch (err) {
      console.error('Error al verificar actualizaciones:', err);
      return { error: err.message };
    }
  });

  // Obtener la versión actual de la aplicación
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  // Manejar operaciones de archivo
  ipcMain.handle('read-directory', async (event, dirPath) => {
    try {
      const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
      return files.map(file => ({
        name: file.name,
        isDirectory: file.isDirectory(),
        path: path.join(dirPath, file.name)
      }));
    } catch (err) {
      console.error('Error al leer directorio:', err);
      return { error: err.message };
    }
  });
}

app.whenReady().then(() => {
  // Primero crear la ventana para que la app sea utilizable de inmediato
  createWindow();

  // Configurar comunicación IPC
  setupIpcHandlers();

  // Después configurar y verificar actualizaciones
  setupAutoUpdater();

  // Verificar actualizaciones al iniciar
  autoUpdater.checkForUpdates().catch(err => {
    console.error('Error al verificar actualizaciones:', err);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});