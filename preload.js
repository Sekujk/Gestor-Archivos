const { contextBridge, ipcRenderer } = require('electron');

// Exposición segura de APIs al proceso de renderizado
contextBridge.exposeInMainWorld('electronAPI', {
  // API para actualizaciones
  onUpdateAvailable: (callback) => {
    const handler = (_, info) => callback(info);
    ipcRenderer.on('update-available', handler);
    // Función de limpieza para evitar memory leaks
    return () => ipcRenderer.removeListener('update-available', handler);
  },
  
  onUpdateDownloaded: (callback) => {
    const handler = (_, info) => callback(info);
    ipcRenderer.on('update-downloaded', handler);
    return () => ipcRenderer.removeListener('update-downloaded', handler);
  },
  
  onDownloadProgress: (callback) => {
    const handler = (_, progressObj) => callback(progressObj);
    ipcRenderer.on('download-progress', handler);
    return () => ipcRenderer.removeListener('download-progress', handler);
  },
  
  onUpdateError: (callback) => {
    const handler = (_, message) => callback(message);
    ipcRenderer.on('update-error', handler);
    return () => ipcRenderer.removeListener('update-error', handler);
  },
  
  // Acciones para actualizaciones
  installUpdate: () => ipcRenderer.invoke('install-update'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Operaciones de archivo
  readDirectory: (dirPath) => ipcRenderer.invoke('read-directory', dirPath),
  
  // Credenciales Supabase
  getSupabaseCredentials: () => ipcRenderer.invoke('get-supabase-credentials')
});