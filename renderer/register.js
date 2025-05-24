// register.js - usando ESM
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

    // Validar formato de email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return showToast('Por favor, introduce un email válido.', 'error');
    }

    // Validar contraseña (mínimo 6 caracteres)
    if (password.length < 6) {
      return showToast('La contraseña debe tener al menos 6 caracteres.', 'error');
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

      if (error) {
        // Personalizar mensajes de error comunes
        if (error.message.includes('already registered')) {
          throw new Error('Este correo electrónico ya está registrado. Por favor, inicia sesión.');
        } else {
          throw error;
        }
      }

      // Mostrar mensaje de éxito
      showToast('¡Registro exitoso! Revisa tu email para verificar tu cuenta.', 'success');
      
      // Redireccionar a login después de un breve retraso
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      // Restaurar botón
      registerButton.disabled = false;
      registerButton.textContent = 'Registrar cuenta';
    }
  }
});