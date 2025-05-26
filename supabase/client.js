
let supabase = null;

// Clase para gestionar el estado de la aplicación
class AppManager {
  constructor() {
    this.initialized = false;
    this.updateStatus = {
      available: false,
      downloaded: false,
      version: null,
      progress: 0
    };
    this.user = null;
  }

  // Inicializar la aplicación
  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Inicializar cliente de Supabase si aún no existe
      if (!supabase) {
        await this.initializeSupabaseClient();
      }
      
      // Verificar si hay una sesión activa
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error al obtener la sesión:', error.message);
        return false;
      }
      
      if (data.session) {
        this.user = data.session.user;
      }
      
      // Configurar gestión de actualizaciones si estamos en Electron
      if (window.electronAPI) {
        this.setupUpdateListeners();
      }
      
      this.initialized = true;
      return data.session !== null;
    } catch (err) {
      console.error('Error al inicializar la aplicación:', err);
      return false;
    }
  }
  
  // Inicializar cliente de Supabase de forma segura
  async initializeSupabaseClient() {
    try {
      // Comprobar si estamos en Electron con las APIs expuestas
      if (window.electronAPI) {
        // Obtener credenciales del proceso principal (variables de entorno)
        const credentials = await window.electronAPI.getSupabaseCredentials();
        const supabaseUrl = credentials.url;
        const supabaseKey = credentials.key;
        
        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Credenciales de Supabase no disponibles');
        }
        
        // Verificar si Supabase está disponible desde CDN
        if (typeof window.supabase !== 'undefined') {
          // Usar Supabase cargado desde CDN
          supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        } else {
          throw new Error('Biblioteca de Supabase no cargada. Asegúrate de incluir el script de Supabase desde CDN en tu HTML.');
        }
      } else {
        throw new Error('Esta aplicación requiere Electron para funcionar correctamente');
      }
      
      return supabase;
    } catch (err) {
      console.error('Error al inicializar cliente de Supabase:', err);
      throw err;
    }
  }
  
  // Configurar escuchadores para actualizaciones
  setupUpdateListeners() {
    if (!window.electronAPI) return;

    // Actualización disponible
    window.electronAPI.onUpdateAvailable((info) => {
      this.updateStatus.available = true;
      this.updateStatus.version = info.version;
      
      // Disparar evento para que los componentes de la UI se actualicen
      document.dispatchEvent(new CustomEvent('app:update-available', { 
        detail: info 
      }));
    });
    
    // Progreso de descarga
    window.electronAPI.onDownloadProgress((progressObj) => {
      this.updateStatus.progress = progressObj.percent;
      
      document.dispatchEvent(new CustomEvent('app:update-progress', { 
        detail: progressObj 
      }));
    });
    
    // Actualización descargada
    window.electronAPI.onUpdateDownloaded((info) => {
      this.updateStatus.downloaded = true;
      
      document.dispatchEvent(new CustomEvent('app:update-downloaded', { 
        detail: info 
      }));
    });
    
    // Error en actualización
    window.electronAPI.onUpdateError((message) => {
      document.dispatchEvent(new CustomEvent('app:update-error', { 
        detail: { message } 
      }));
    });
  }
  
  // Verificar actualizaciones manualmente
  async checkForUpdates() {
    if (!window.electronAPI) return null;
    
    try {
      const result = await window.electronAPI.checkForUpdates();
      return result;
    } catch (err) {
      console.error('Error al verificar actualizaciones:', err);
      return { error: err.message };
    }
  }
  
  // Instalar actualización disponible
  async installUpdate() {
    if (!window.electronAPI || !this.updateStatus.downloaded) return false;
    
    try {
      await window.electronAPI.installUpdate();
      return true;
    } catch (err) {
      console.error('Error al instalar la actualización:', err);
      return false;
    }
  }
  
  // Obtener la versión actual de la aplicación
  async getAppVersion() {
    if (!window.electronAPI) return 'N/A';
    
    try {
      return await window.electronAPI.getAppVersion();
    } catch (err) {
      console.error('Error al obtener la versión:', err);
      return 'N/A';
    }
  }
}

// Crear instancia única del gestor de la aplicación
const appManager = new AppManager();

// Exportaciones para uso en otros archivos
export { appManager };
export const getSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase no ha sido inicializado. Llama a appManager.initialize() primero.');
  }
  return supabase;
};
// Exportamos supabase directamente para mayor compatibilidad con tus archivos existentes
export { supabase };