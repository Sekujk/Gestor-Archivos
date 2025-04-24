// login.js - usando ESM
import { appManager, getSupabase } from '../supabase/client.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Primero asegurarse de que el cliente de Supabase esté inicializado
  try {
    await appManager.initialize();
  } catch (err) {
    console.error('Error al inicializar el cliente de Supabase:', err);
    showToast('Error al inicializar la aplicación. Por favor, intenta de nuevo.', 'error');
  }

  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('login');
  const forgotPasswordLink = document.getElementById('forgotPassword');

  // Verificar que los elementos existen antes de agregar los event listeners
  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      await handleLogin();
    });
  } else {
    console.error('No se encontró el elemento con ID "loginForm"');
  }

  if (loginBtn) {
    loginBtn.addEventListener('click', async (event) => {
      event.preventDefault();
      await handleLogin();
    });
  } else {
    console.error('No se encontró el elemento con ID "login"');
  }

  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (event) => {
      event.preventDefault();
      // Mostrar modal o redireccionar a la página de recuperación de contraseña
      showResetPasswordModal();
    });
  }

  async function handleLogin() {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      return showToast('Por favor, completa todos los campos.', 'error');
    }

    // Mostrar loader
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="spinner-small"></span> Iniciando sesión...';

    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error('Cliente de Supabase no inicializado');
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      showToast('Sesión iniciada correctamente', 'success');
      
      // Redireccionar a dashboard
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      // Restaurar botón
      loginBtn.disabled = false;
      loginBtn.textContent = 'Iniciar sesión';
    }
  }

  function showResetPasswordModal() {
    // Implementar lógica para mostrar modal de recuperación de contraseña
    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2>Recuperar contraseña</h2>
        <p>Ingresa tu correo electrónico para recibir instrucciones de recuperación.</p>
        <form id="resetPasswordForm">
          <input type="email" id="resetEmail" placeholder="Correo electrónico" required>
          <button type="submit">Enviar</button>
        </form>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Mostrar modal
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);
    
    // Cerrar modal
    const closeBtn = modal.querySelector('.close');
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('show');
      setTimeout(() => modal.remove(), 300);
    });
    
    // Manejar envío del formulario
    const resetForm = modal.querySelector('#resetPasswordForm');
    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const resetEmail = modal.querySelector('#resetEmail').value.trim();
      
      if (!resetEmail) {
        return showToast('Por favor, ingresa tu correo electrónico.', 'error');
      }
      
      try {
        const supabase = getSupabase();
        if (!supabase) throw new Error('Cliente de Supabase no inicializado');
        
        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);
        
        if (error) throw error;
        
        showToast('Se han enviado instrucciones a tu correo electrónico.', 'success');
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
      } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
      }
    });
  }

  // Función para mostrar toast
  function showToast(message, type = 'info') {
    if (window.showToast) {
      window.showToast(message, type);
    } else {
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
  }
});