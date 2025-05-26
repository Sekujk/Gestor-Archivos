import { appManager, getSupabase } from '../supabase/client.js';
import initializeToast, { createToast } from './toast.js';
import { LoginForm } from './auth/components/LoginForm.js';

document.addEventListener('DOMContentLoaded', async () => {
  initializeToast();
  
  try {
    await appManager.initialize();
    const supabase = getSupabase();
    
    if (!supabase) {
      throw new Error('Cliente de Supabase no inicializado');
    }
    
    // Inicializar el formulario de login
    new LoginForm(supabase, createToast);
    
  } catch (err) {
    console.error('Error al inicializar:', err);
    createToast('Error al inicializar la aplicación. Por favor, intenta de nuevo.', 'error');
  }
});
