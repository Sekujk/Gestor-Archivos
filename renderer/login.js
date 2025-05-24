// login.js - usando ESM
import { appManager, getSupabase } from '../supabase/client.js';
import initializeToast, { createToast } from './toast.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Inicializar el sistema de toast
  initializeToast();
  
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
      // Mostrar modal de recuperación de contraseña
      showResetPasswordModal();
    });
  }

  async function handleLogin() {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      return showToast('Por favor, completa todos los campos.', 'error');
    }

    // Validar formato de email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return showToast('Por favor, introduce un email válido.', 'error');
    }

    // Mostrar loader
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="spinner-small"></span> Iniciando sesión...';

    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error('Cliente de Supabase no inicializado');
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        // Personalizar mensajes de error
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Credenciales inválidas. Verifica tu email y contraseña.');
        } else {
          throw error;
        }
      }
      
      showToast('Inicio de sesión exitoso. ¡Bienvenido/a!', 'success');
      
      // Redireccionar a dashboard
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      // Restaurar botón
      loginBtn.disabled = false;
      loginBtn.textContent = 'Iniciar sesión';
    }
  }

  // Función mejorada para mostrar el modal de recuperación de contraseña
  function showResetPasswordModal() {
    // Crear el modal principal
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    // Crear el contenido del modal
    modal.innerHTML = `
      <div class="modal-content">
        <button class="close" aria-label="Cerrar">&times;</button>
        <h2>Recuperar contraseña</h2>
        <p>Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.</p>
        <form id="resetPasswordForm">
          <label for="resetEmail">Correo electrónico</label>
          <input type="email" id="resetEmail" placeholder="Tu correo electrónico" required>
          <button type="submit" id="resetSubmitBtn" class="btn btn-primary">Enviar instrucciones</button>
        </form>
        <div id="resetSuccessMessage" style="display: none;" class="success-message">
          <p>¡Enlace enviado! Revisa tu correo electrónico y sigue las instrucciones para restablecer tu contraseña.</p>
        </div>
      </div>
    `;
    
    // Añadir el modal al body
    document.body.appendChild(modal);
    
    // Mostrar el modal con una pequeña demora para permitir la transición
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);
    
    // Obtener referencias a los elementos del modal
    const closeBtn = modal.querySelector('.close');
    const resetForm = modal.querySelector('#resetPasswordForm');
    const resetEmailInput = modal.querySelector('#resetEmail');
    const resetSubmitBtn = modal.querySelector('#resetSubmitBtn');
    const successMessage = modal.querySelector('#resetSuccessMessage');
    
    // Función para cerrar el modal
    const closeModal = () => {
      modal.classList.remove('show');
      setTimeout(() => {
        modal.remove();
      }, 300); // Esperar a que termine la transición
    };
    
    // Evento para cerrar el modal con el botón X
    closeBtn.addEventListener('click', closeModal);
    
    // Cerrar el modal si se hace clic fuera del contenido del modal (en el fondo oscuro)
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
    
    // Manejar el envío del formulario de recuperación
    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = resetEmailInput.value.trim();
      
      // Validar el email
      if (!email) {
        return showToast('Por favor, ingresa tu correo electrónico.', 'error');
      }
      
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        return showToast('Por favor, introduce un email válido.', 'error');
      }
      
      // Cambiar el estado del botón a cargando
      resetSubmitBtn.disabled = true;
      resetSubmitBtn.innerHTML = '<span class="spinner-small"></span> Enviando...';
      
      try {
        const supabase = getSupabase();
        if (!supabase) throw new Error('Cliente de Supabase no inicializado');
        
        // Usar el método de Supabase para enviar el correo de recuperación
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/reset-password.html'
        });
        
        if (error) throw error;
        
        // Mostrar mensaje de éxito
        resetForm.style.display = 'none';
        successMessage.style.display = 'block';
        
        // Cerrar automáticamente después de un tiempo
        setTimeout(() => {
          closeModal();
        }, 5000);
        
      } catch (error) {
        console.error('Error al solicitar restablecimiento:', error);
        
        // Personalizar mensaje de error
        let errorMessage = 'Error al enviar el enlace de recuperación.';
        
        if (error.message.includes('Email not found')) {
          errorMessage = 'No existe una cuenta con este correo electrónico.';
        }
        
        showToast(errorMessage, 'error');
        
        // Restaurar el botón
        resetSubmitBtn.disabled = false;
        resetSubmitBtn.textContent = 'Enviar instrucciones';
      }
    });
  }
});