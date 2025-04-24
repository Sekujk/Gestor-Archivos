// register.js - usando ESM
import { appManager, getSupabase } from '../supabase/client.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Primero asegurarse de que el cliente de Supabase esté inicializado
  try {
    await appManager.initialize();
  } catch (err) {
    console.error('Error al inicializar el cliente de Supabase:', err);
    showToast('Error al inicializar la aplicación. Por favor, intenta de nuevo.', 'error');
  }

  const registerForm = document.getElementById('registerForm');
  const registerButton = document.getElementById('register');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const nameInput = document.getElementById('name');

  // Verificar que los elementos existen antes de agregar los event listeners
  if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      await handleRegister();
    });
  } else {
    console.error('No se encontró el elemento con ID "registerForm"');
  }

  if (registerButton) {
    registerButton.addEventListener('click', async (event) => {
      event.preventDefault();
      await handleRegister();
    });
  } else {
    console.error('No se encontró el elemento con ID "register"');
  }

  async function handleRegister() {
    // Validar campos
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const name = nameInput.value.trim();

    if (!email || !password || !name) {
      return showToast('Por favor, completa todos los campos.', 'error');
    }

    // Mostrar loader
    registerButton.disabled = true;
    registerButton.innerHTML = '<span class="spinner-small"></span> Registrando...';

    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error('Cliente de Supabase no inicializado');
      
      // Crear el usuario en Supabase (autenticación)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name
          }
        }
      });

      if (error) throw error;

      // Mostrar mensaje de éxito
      showToast('Cuenta registrada exitosamente. Revisa tu email para verificar tu cuenta.', 'success');
      
      // Redireccionar a login después de un breve retraso
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    } catch (error) {
      showToast(`Error al registrar: ${error.message}`, 'error');
    } finally {
      // Restaurar botón
      registerButton.disabled = false;
      registerButton.textContent = 'Registrarse';
    }
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