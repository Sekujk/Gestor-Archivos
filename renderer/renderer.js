// Importar dependencias
import { appManager, getSupabase } from '../supabase/client.js';

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Mostrar indicador de carga
    document.body.innerHTML = `
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Inicializando aplicación...</p>
      </div>
    `;
    
    // Inicializar el gestor de la aplicación
    const hasSession = await appManager.initialize();
    
    // Redirigir según el estado de la sesión
    if (hasSession) {
      window.location.href = 'dashboard.html';
    } else {
      window.location.href = 'login.html';
    }
  } catch (err) {
    console.error('Error al inicializar la aplicación:', err);
    // Mostrar un mensaje de error
    document.body.innerHTML = `
      <div class="error-container">
        <h2>Error de inicialización</h2>
        <p>No se pudo inicializar la aplicación: ${err.message}</p>
        <button onclick="window.location.reload()">Reintentar</button>
      </div>
    `;
  }
});

// Definir funciones para gestionar la autenticación
async function loginWithEmail(email, password) {
  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Cliente de Supabase no inicializado');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    if (data.session) {
      window.location.href = 'dashboard.html';
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error al iniciar sesión:', err);
    throw err;
  }
}

async function registerWithEmail(email, password, fullName) {
  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Cliente de Supabase no inicializado');
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });
    
    if (error) throw error;
    
    if (data.user) {
      // Mostrar mensaje de verificación si es necesario
      return { success: true, user: data.user };
    }
    return { success: false };
  } catch (err) {
    console.error('Error al registrar usuario:', err);
    throw err;
  }
}

async function logout() {
  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Cliente de Supabase no inicializado');
    
    const { error } = await supabase.auth.signOut();
    
    if (error) throw error;
    
    window.location.href = 'login.html';
    return true;
  } catch (err) {
    console.error('Error al cerrar sesión:', err);
    throw err;
  }
}

// Funciones para gestionar actualizaciones de la aplicación desde la UI
function setupUpdateListeners(updateUIElements) {
  if (!updateUIElements) return;
  
  // Registrar escuchadores de eventos de actualización
  document.addEventListener('app:update-available', (event) => {
    const { version } = event.detail;
    if (updateUIElements.container) updateUIElements.container.classList.remove('hidden');
    if (updateUIElements.message) updateUIElements.message.textContent = `Nueva versión ${version} disponible`;
    if (updateUIElements.downloadBtn) updateUIElements.downloadBtn.classList.remove('hidden');
  });
  
  document.addEventListener('app:update-progress', (event) => {
    const { percent } = event.detail;
    if (updateUIElements.progressContainer) updateUIElements.progressContainer.classList.remove('hidden');
    if (updateUIElements.progressFill) updateUIElements.progressFill.style.width = `${percent.toFixed(1)}%`;
    if (updateUIElements.progressText) updateUIElements.progressText.textContent = `${percent.toFixed(1)}%`;
  });
  
  document.addEventListener('app:update-downloaded', () => {
    if (updateUIElements.message) updateUIElements.message.textContent = 'Actualización lista para instalar';
    if (updateUIElements.downloadBtn) updateUIElements.downloadBtn.classList.add('hidden');
    if (updateUIElements.installBtn) updateUIElements.installBtn.classList.remove('hidden');
  });
  
  document.addEventListener('app:update-error', (event) => {
    const { message } = event.detail;
    console.error('Error en actualización:', message);
    if (updateUIElements.message) updateUIElements.message.textContent = `Error: ${message}`;
  });
  
  // Configurar botones de actualización si existen
  if (updateUIElements.checkBtn) {
    updateUIElements.checkBtn.addEventListener('click', async () => {
      try {
        await appManager.checkForUpdates();
      } catch (err) {
        console.error('Error al verificar actualizaciones:', err);
      }
    });
  }
  
  if (updateUIElements.installBtn) {
    updateUIElements.installBtn.addEventListener('click', async () => {
      try {
        await appManager.installUpdate();
      } catch (err) {
        console.error('Error al instalar actualización:', err);
      }
    });
  }
  
  if (updateUIElements.laterBtn) {
    updateUIElements.laterBtn.addEventListener('click', () => {
      if (updateUIElements.container) updateUIElements.container.classList.add('hidden');
    });
  }
  
  if (updateUIElements.closeBtn) {
    updateUIElements.closeBtn.addEventListener('click', () => {
      if (updateUIElements.container) updateUIElements.container.classList.add('hidden');
    });
  }
}

// Función para mostrar toast
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.classList.add('toast', `toast-${type}`);
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Animar entrada
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Eliminar después de 3 segundos
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Exponer funciones útiles globalmente
window.showToast = showToast;
window.loginWithEmail = loginWithEmail;
window.registerWithEmail = registerWithEmail;
window.logout = logout;
window.setupUpdateListeners = setupUpdateListeners;