const { app, BrowserWindow, dialog, ipcMain, Tray, Menu, nativeImage } = require('electron');
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
let tray = null;
let isQuitting = false;

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
    // Si la app se inició minimizada (por ejemplo, al inicio de Windows),
    // no mostrar la ventana automáticamente
    if (!app.getLoginItemSettings().wasOpenedAsHidden) {
      mainWindow.maximize();
      mainWindow.show();
    }
  });

  // Opcional: abre DevTools en desarrollo
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Manejar el evento de cerrar ventana
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      
      // Mostrar notificación solo la primera vez
      if (process.platform === 'win32' && tray) {
        tray.displayBalloon({
          iconType: 'info',
          title: 'Gestor de Archivos',
          content: 'La aplicación sigue ejecutándose en segundo plano. Haz clic en el icono de la bandeja para acceder.'
        });
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  // Crear el icono para la bandeja
  const iconPath = path.join(__dirname, 'renderer', 'assets', 'tray-icon.ico');
  
  // Verificar si existe el icono, si no, crear uno simple
  let trayIcon;
  if (fs.existsSync(iconPath)) {
    trayIcon = nativeImage.createFromPath(iconPath);
  } else {
    // Crear un icono simple si no existe el archivo
    trayIcon = nativeImage.createEmpty();
  }

  // Redimensionar el icono para la bandeja (16x16 o 32x32 píxeles)
  if (!trayIcon.isEmpty()) {
    trayIcon = trayIcon.resize({ width: 16, height: 16 });
  }

  tray = new Tray(trayIcon);

  // Menú contextual para la bandeja
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Mostrar Aplicación',
      click: () => {
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.show();
          mainWindow.focus();
        } else {
          createWindow();
        }
      }
    },
    {
      label: 'Ocultar Aplicación',
      click: () => {
        if (mainWindow) {
          mainWindow.hide();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Configuración de Inicio',
      submenu: [
        {
          label: 'Iniciar con Windows',
          type: 'checkbox',
          checked: app.getLoginItemSettings().openAtLogin,
          click: (menuItem) => {
            app.setLoginItemSettings({
              openAtLogin: menuItem.checked,
              openAsHidden: true, // Iniciar minimizado
              path: app.isPackaged ? undefined : process.execPath,
              args: app.isPackaged ? [] : ['--hidden']
            });
          }
        }
      ]
    },
    { type: 'separator' },
    {
      label: 'Verificar Actualizaciones',
      click: () => {
        autoUpdater.checkForUpdates().catch(err => {
          console.error('Error al verificar actualizaciones:', err);
        });
      }
    },
    { type: 'separator' },
    {
      label: 'Salir',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip('Gestor de Archivos');

  // Doble clic para mostrar/ocultar la ventana
  tray.on('double-click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
      }
    } else {
      createWindow();
    }
  });

  // Clic simple para mostrar la ventana (Windows)
  if (process.platform === 'win32') {
    tray.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
      } else {
        createWindow();
      }
    });
  }
}

function setupStartupSettings() {
  // Configurar inicio automático con Windows (opcional, también se puede hacer desde el menú)
  if (process.platform === 'win32') {
    const startWithWindows = app.getLoginItemSettings().openAtLogin;
    
    // Si es la primera vez que se ejecuta, preguntar si quiere iniciar con Windows
    if (!startWithWindows && !app.isPackaged) {
      // Solo en desarrollo, en producción esto se puede manejar desde el menú
      console.log('Para habilitar el inicio automático, usa el menú contextual del icono en la bandeja');
    }
  }
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

    // Notificar también en la bandeja
    if (tray) {
      tray.displayBalloon({
        iconType: 'info',
        title: 'Actualización Disponible',
        content: `Nueva versión ${info.version} disponible para descarga.`
      });
    }
  });

  // Evento: actualización descargada
  autoUpdater.on('update-downloaded', (info) => {
    console.log('✅ Actualización descargada:', info.version);

    // Notificar al renderer sobre la actualización descargada
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded', info);
    }

    // Notificar en la bandeja
    if (tray) {
      tray.displayBalloon({
        iconType: 'info',
        title: 'Actualización Lista',
        content: `Versión ${info.version} descargada. Se instalará al cerrar la aplicación.`
      });
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

  // Nuevos handlers para la bandeja
  ipcMain.handle('show-window', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  ipcMain.handle('hide-window', () => {
    if (mainWindow) {
      mainWindow.hide();
    }
  });

  ipcMain.handle('toggle-startup', (event, enable) => {
    app.setLoginItemSettings({
      openAtLogin: enable,
      openAsHidden: true,
      path: app.isPackaged ? undefined : process.execPath,
      args: app.isPackaged ? [] : ['--hidden']
    });
    return app.getLoginItemSettings().openAtLogin;
  });

  ipcMain.handle('get-startup-status', () => {
    return app.getLoginItemSettings().openAtLogin;
  });
}

// Prevenir múltiples instancias
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Si alguien intentó ejecutar una segunda instancia, enfocamos nuestra ventana
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    // Crear la bandeja del sistema primero
    createTray();

    // Configurar ajustes de inicio
    setupStartupSettings();

    // Crear la ventana principal
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
}

app.on('window-all-closed', (event) => {
  // En lugar de cerrar la app, mantenerla en la bandeja
  event.preventDefault();
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else if (mainWindow) {
    mainWindow.show();
  }
});