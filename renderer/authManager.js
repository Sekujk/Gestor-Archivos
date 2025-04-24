// authManager.js (corregido)
import { getSupabase } from '../supabase/client.js';
import { showToast } from './uiHelpers.js';

export function initAuthManager() {
  // Obtenemos el cliente de Supabase
  const supabase = getSupabase();
  
  async function verificarAutenticacion() {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error al obtener usuario:", error);
        showToast('Error al verificar autenticación: ' + error.message, 'error');
        window.location.href = 'index.html';
        return null;
      }
      
      if (!data.user) {
        console.log("No hay sesión activa");
        window.location.href = 'index.html';
        return null;
      }
      
      return data.user;
    } catch (err) {
      console.error("Error general en verificarAutenticacion:", err);
      showToast('Error al verificar autenticación: ' + err.message, 'error');
      window.location.href = 'index.html';
      return null;
    }
  }

  async function mostrarPerfil(user) {
    try {
      // Obtener el nombre de usuario desde la tabla users
      const { data, error } = await supabase
        .from('users')
        .select('nombre')
        .eq('id', user.id)
        .single();
      
      if (!error && data) {
        document.getElementById('user-email').textContent = data.nombre || user.email;
      } else {
        document.getElementById('user-email').textContent = user.email;
        if (error) console.error("Error al obtener perfil:", error);
      }
    } catch (err) {
      console.error("Error general en mostrarPerfil:", err);
      document.getElementById('user-email').textContent = user.email;
    }
  }

  async function cerrarSesion() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error al cerrar sesión:", error);
        return showToast('Error al cerrar sesión: ' + error.message, 'error');
      }
      window.location.href = 'index.html';
    } catch (err) {
      console.error("Error general al cerrar sesión:", err);
      showToast('Error al cerrar sesión: ' + err.message, 'error');
    }
  }

  return {
    verificarAutenticacion,
    mostrarPerfil,
    cerrarSesion
  };
}