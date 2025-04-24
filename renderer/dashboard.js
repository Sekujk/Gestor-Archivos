// dashboard.js (corregido)
import { appManager, getSupabase } from '../supabase/client.js';
import { showToast } from './uiHelpers.js';
import { initModal } from './modalHandler.js';
import { initContactManager } from './contactManager.js';
import { initFileManager } from './fileManager.js';
import { initAuthManager } from './authManager.js';
import { initUpdateManager } from './updateManager.js';

document.addEventListener('DOMContentLoaded', async function() {
  try {
    // Inicializar aplicación primero
    const initialized = await appManager.initialize();
    if (!initialized) {
      console.error("No se pudo inicializar la aplicación");
      showToast('Error al inicializar la aplicación', 'error');
      return;
    }

    // Inicializar los gestores
    const authManager = initAuthManager();
    
    // Verificar si el usuario está autenticado
    const user = await authManager.verificarAutenticacion();
    if (!user) return;
    
    // Inicializar componentes de la UI
    const modal = initModal();
    const contactManager = initContactManager(user);
    const fileManager = initFileManager(user, modal, contactManager);
    
    // Inicializar el gestor de actualizaciones (en entorno Electron)
    const updateManager = initUpdateManager();
    
    // Mostrar información del perfil
    authManager.mostrarPerfil(user);
    
    // Configurar event listeners para las acciones del usuario
    document.getElementById('subir').addEventListener('click', fileManager.subirArchivo);
    document.getElementById('agregar-contacto').addEventListener('click', contactManager.agregarContacto);
    document.getElementById('filtro-archivos').addEventListener('input', fileManager.listarArchivos);
    document.getElementById('filtro-compartidos').addEventListener('input', fileManager.listarArchivosCompartidos);
    document.getElementById('logout').addEventListener('click', authManager.cerrarSesion);
    
    // Cargar datos iniciales
    fileManager.listarArchivos();
    contactManager.listarContactos();
    fileManager.listarArchivosCompartidos();
    
    // Verificar actualizaciones si estamos en Electron
    if (updateManager) {
      try {
        console.log('Verificando actualizaciones...');
        await updateManager.checkForUpdates();
      } catch (err) {
        console.error('Error al verificar actualizaciones iniciales:', err);
      }
    }
  } catch (err) {
    console.error("Error al inicializar la aplicación:", err);
    showToast('Error al inicializar la aplicación: ' + err.message, 'error');
  }
});