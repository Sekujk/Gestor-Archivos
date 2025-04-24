import { appManager, getSupabase } from '../supabase/client.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // IMPORTANTE: Inicializar la aplicación antes de usar getSupabase
    const initialized = await appManager.initialize();
    if (!initialized) {
      console.error("No se pudo inicializar la aplicación");
      alert('Error al inicializar la aplicación');
      window.location.href = 'login.html';
      return;
    }

    // Obtener la instancia de Supabase después de inicializar
    const supabase = getSupabase();
    if (!supabase) {
      console.error("No se pudo obtener el cliente de Supabase");
      alert('Error de conexión. Vuelve a iniciar sesión.');
      window.location.href = 'login.html';
      return;
    }

    const form = document.getElementById('perfil-form');
    const nombreInput = document.getElementById('nombre');
    const backButton = document.getElementById('back-to-dashboard');

    // Verificar sesión activa
    const { data, error: userError } = await supabase.auth.getUser();
    
    if (userError || !data || !data.user) {
      console.error("Error al obtener usuario:", userError);
      alert('No has iniciado sesión o tu sesión ha expirado');
      window.location.href = 'login.html';
      return;
    }

    console.log("Usuario autenticado correctamente:", data.user.email);
    const user = data.user;
    
    // Cargar datos actuales del usuario
    if (user.user_metadata && user.user_metadata.full_name) {
      nombreInput.value = user.user_metadata.full_name;
    } else {
      // Intentar obtener de la tabla users
      const { data: userData, error: profileError } = await supabase
        .from('users')
        .select('nombre')
        .eq('id', user.id)
        .single();
      
      if (!profileError && userData) {
        nombreInput.value = userData.nombre || '';
      }
    }

    // Manejo de la acción del formulario
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newName = nombreInput.value.trim();

      if (!newName) {
        alert('El nombre no puede estar vacío.');
        return;
      }

      try {
        // 1. Actualizar el nombre en auth.users (user_metadata)
        const { error: authError } = await supabase.auth.updateUser({
          data: { full_name: newName }
        });

        if (authError) {
          alert('Error al actualizar el perfil en auth.');
          console.error(authError);
          return;
        }

        // 2. Verificar si existe en la tabla users
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single();
        
        // 3. Actualizar o insertar en la tabla users
        let dbOperation;
        if (checkError || !existingUser) {
          // No existe, crear
          dbOperation = supabase
            .from('users')
            .insert({ id: user.id, nombre: newName, email: user.email });
        } else {
          // Existe, actualizar
          dbOperation = supabase
            .from('users')
            .update({ nombre: newName })
            .eq('id', user.id);
        }
        
        const { error: userTableError } = await dbOperation;

        if (userTableError) {
          alert('Error al actualizar el nombre en la tabla users.');
          console.error(userTableError);
          return;
        }

        alert('Perfil actualizado correctamente');
      } catch (error) {
        console.error("Error al actualizar perfil:", error);
        alert('Ocurrió un error al guardar los cambios');
      }
    });

    backButton.addEventListener('click', () => {
      window.location.href = 'dashboard.html';
    });
  } catch (error) {
    console.error("Error general:", error);
    alert('Ocurrió un error inesperado');
    window.location.href = 'login.html';
  }
});