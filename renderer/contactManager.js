// contactManager.js (corregido)
import { getSupabase } from '../supabase/client.js';
import { showToast, crearBoton } from './uiHelpers.js';

export function initContactManager(user) {
  // Obtenemos el cliente de Supabase
  const supabase = getSupabase();
  
  // Función para crear confirmación personalizada
  function crearConfirmacionPersonalizada(mensaje, onConfirm) {
    // Crear el contenedor del modal
    const modalOverlay = document.createElement('div');
    modalOverlay.style.position = 'fixed';
    modalOverlay.style.top = '0';
    modalOverlay.style.left = '0';
    modalOverlay.style.width = '100%';
    modalOverlay.style.height = '100%';
    modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modalOverlay.style.display = 'flex';
    modalOverlay.style.justifyContent = 'center';
    modalOverlay.style.alignItems = 'center';
    modalOverlay.style.zIndex = '1000';
    
    // Crear el modal
    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = 'white';
    modalContent.style.padding = '20px';
    modalContent.style.borderRadius = '5px';
    modalContent.style.maxWidth = '400px';
    modalContent.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)';
    
    // Crear el mensaje
    const mensajeElement = document.createElement('p');
    mensajeElement.textContent = mensaje;
    
    // Crear los botones
    const botonesContainer = document.createElement('div');
    botonesContainer.style.display = 'flex';
    botonesContainer.style.justifyContent = 'flex-end';
    botonesContainer.style.marginTop = '20px';
    
    const botonCancelar = document.createElement('button');
    botonCancelar.textContent = 'Cancelar';
    botonCancelar.style.marginRight = '10px';
    botonCancelar.style.padding = '5px 10px';
    botonCancelar.style.cursor = 'pointer';
    
    const botonConfirmar = document.createElement('button');
    botonConfirmar.textContent = 'Confirmar';
    botonConfirmar.style.padding = '5px 10px';
    botonConfirmar.style.backgroundColor = '#007bff';
    botonConfirmar.style.color = 'white';
    botonConfirmar.style.border = 'none';
    botonConfirmar.style.borderRadius = '3px';
    botonConfirmar.style.cursor = 'pointer';
    
    // Añadir manejadores de eventos
    botonCancelar.addEventListener('click', () => {
      document.body.removeChild(modalOverlay);
    });
    
    botonConfirmar.addEventListener('click', () => {
      document.body.removeChild(modalOverlay);
      onConfirm();
    });
    
    // Ensamblar el modal
    botonesContainer.appendChild(botonCancelar);
    botonesContainer.appendChild(botonConfirmar);
    modalContent.appendChild(mensajeElement);
    modalContent.appendChild(botonesContainer);
    modalOverlay.appendChild(modalContent);
    
    // Añadir al DOM
    document.body.appendChild(modalOverlay);
  }
  
  async function agregarContacto() {
    try {
      const email = document.getElementById('nuevo-contacto').value.trim().toLowerCase();
      if (!email) return showToast('Ingresa un correo.', 'error');
      
      if (email === user.email.toLowerCase()) {
        return showToast('No puedes agregarte a ti mismo como contacto.', 'error');
      }

      // Verificar si el usuario existe usando la función RPC
      console.log("Buscando usuario con email:", email);
      const { data: targetUsers, error: userErr } = await supabase
        .rpc('get_user_by_email', { email_to_find: email });
      
      // Diagnostico de la respuesta de RPC
      console.log("Respuesta completa de RPC:", targetUsers);
      
      const targetUser = targetUsers && targetUsers.length > 0 ? targetUsers[0] : null;
      
      console.log("Resultado de búsqueda:", { data: targetUser, error: userErr });
      
      if (userErr) {
        console.error("Error completo al buscar usuario:", userErr);
        return showToast('Error al verificar usuario: ' + userErr.message, 'error');
      }
      
      if (!targetUser) {
        return showToast('No existe un usuario con ese correo.', 'error');
      }

      // Verificar si ya existe el contacto
      const { data: contactoExistente, error: checkError } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', user.id)
        .eq('contact_email', email);

      if (checkError) {
        console.error("Error al verificar contacto existente:", checkError);
        return showToast('Error al verificar contacto: ' + checkError.message, 'error');
      }

      if (contactoExistente && contactoExistente.length > 0) {
        return showToast('Este contacto ya está en tu lista.', 'info');
      }

      // Agregamos el contacto - Aseguramos que el email esté en minúsculas
      const { data: insertedContact, error } = await supabase.from('contacts').insert({
        user_id: user.id,
        contact_email: email
      }).select();

      if (error) {
        console.error("Error al agregar contacto:", error);
        return showToast('Error al agregar contacto: ' + error.message, 'error');
      }

      console.log("Contacto insertado correctamente:", insertedContact);
      showToast('Contacto agregado exitosamente. Esperando confirmación del usuario.', 'success');
      document.getElementById('nuevo-contacto').value = '';
      listarContactos();
    } catch (err) {
      console.error("Error general en agregarContacto:", err);
      showToast('Error al agregar contacto: ' + err.message, 'error');
    }
  }

  async function listarContactos() {
    try {
      console.log("Iniciando listarContactos para usuario:", user.email);
      const emailNormalizado = user.email.trim().toLowerCase();
      
      console.log("Usuario actual ID:", user.id);
      console.log("Email normalizado:", emailNormalizado);
      
      // PASO 1: Obtener mis contactos (los que yo he agregado)
      console.log("PASO 1: Obteniendo mis contactos...");
      const { data: misContactos, error: errorMisContactos } = await supabase
        .from('contacts')
        .select('id, contact_email, user_id')
        .eq('user_id', user.id);
      
      if (errorMisContactos) {
        console.error("Error al obtener mis contactos:", errorMisContactos);
        return showToast('Error al obtener contactos: ' + errorMisContactos.message, 'error');
      }
      
      console.log("Mis contactos (los que agregué):", misContactos);
      
      // PASO 2: Obtener contactos inversos (los que me agregaron a mí) usando la RPC
      console.log("PASO 2: Obteniendo contactos que me agregaron...");
      console.log("CONSULTA: Buscando contactos inversos con email:", emailNormalizado);
      
      // Usar la función RPC para obtener contactos inversos
      const { data: contactosInversos, error: errorContactosInversos } = await supabase
        .rpc('get_inverse_contacts', { email_param: emailNormalizado });
  
      if (errorContactosInversos) {
        console.error("Error al obtener contactos inversos:", errorContactosInversos);
        return showToast('Error al obtener contactos: ' + errorContactosInversos.message, 'error');
      }
      
      console.log("Respuesta completa de contactos inversos:", contactosInversos);
      console.log("Contactos inversos (los que me agregaron):", contactosInversos);
      
      // PASO 3: Obtener información de usuarios para los contactos inversos
      console.log("PASO 3: Obteniendo información de usuarios para contactos inversos...");
      
      let usuariosQueNosAgregaron = [];
      if (contactosInversos && contactosInversos.length > 0) {
        usuariosQueNosAgregaron = contactosInversos.map(contacto => ({
          id: contacto.user_id,
          email: contacto.user_email_display,
          nombre: contacto.user_nombre || contacto.user_email_display
        }));
        console.log("Información completa de usuarios que me agregaron:", usuariosQueNosAgregaron);
      }
      
      // PASO 4: Obtener información de usuarios para mis contactos
      console.log("PASO 4: Obteniendo información de usuarios para mis contactos...");
      
      let misContactosConInfo = [];
      if (misContactos && misContactos.length > 0) {
        const contactPromises = misContactos.map(async contacto => {
          console.log("Buscando información para contacto email:", contacto.contact_email);
          
          const { data, error } = await supabase
            .rpc('get_user_by_email', { email_to_find: contacto.contact_email });
            
          if (error) {
            console.error(`Error al obtener datos para contacto ${contacto.contact_email}:`, error);
            return {...contacto, users: null};
          }
          
          const userInfo = data && data.length > 0 ? data[0] : null;
          console.log(`Datos obtenidos para contacto ${contacto.contact_email}:`, userInfo);
          
          return {...contacto, users: userInfo};
        });
        
        misContactosConInfo = await Promise.all(contactPromises);
        console.log("Mis contactos con información de usuario:", misContactosConInfo);
      }
      
      // PASO 5: Construir listas para la UI
      console.log("PASO 5: Construyendo listas para la UI...");
      
      // Lista de IDs de usuarios que me agregaron
      const idsUsuariosQueNosAgregaron = usuariosQueNosAgregaron.map(u => u.id);
      console.log("IDs de usuarios que me agregaron:", idsUsuariosQueNosAgregaron);
      
      // Lista de emails de usuarios que me agregaron
      const emailsUsuariosQueNosAgregaron = usuariosQueNosAgregaron.map(u => u.email?.toLowerCase());
      console.log("Emails de usuarios que me agregaron:", emailsUsuariosQueNosAgregaron);
      
      // Lista de contactos confirmados (están en ambas listas)
      const contactosConfirmados = misContactosConInfo.filter(contacto => 
        emailsUsuariosQueNosAgregaron.includes(contacto.contact_email?.toLowerCase())
      );
      console.log("Contactos confirmados (recíprocos):", contactosConfirmados);
      
      // Lista de contactos pendientes (yo los agregué pero ellos no a mí)
      const contactosPendientes = misContactosConInfo.filter(contacto => 
        !emailsUsuariosQueNosAgregaron.includes(contacto.contact_email?.toLowerCase())
      );
      console.log("Contactos pendientes de confirmación:", contactosPendientes);
      
      // Lista de solicitudes pendientes (ellos me agregaron pero yo no a ellos)
      const solicitudesPendientes = [];
      for (const usuario of usuariosQueNosAgregaron) {
        const yaLoAgreguéComoContacto = misContactos.some(c => 
          c.contact_email.toLowerCase() === usuario.email.toLowerCase()
        );
        
        if (!yaLoAgreguéComoContacto) {
          solicitudesPendientes.push({
            id: null, // No necesitamos este ID para la UI
            users: usuario
          });
        }
      }
      console.log("Solicitudes pendientes recibidas:", solicitudesPendientes);
      
      // PASO 6: Actualizar la UI
      console.log("PASO 6: Actualizando la UI...");
      
      const lista = document.getElementById('lista-contactos');
      lista.innerHTML = '';
      
      if (contactosConfirmados.length === 0 && contactosPendientes.length === 0 && solicitudesPendientes.length === 0) {
        lista.innerHTML = '<p>No tienes contactos.</p>';
        return;
      }
      
      // Mostrar contactos confirmados
      if (contactosConfirmados.length > 0) {
        const seccionConfirmados = document.createElement('div');
        seccionConfirmados.innerHTML = '<h4>Contactos confirmados:</h4>';
        lista.appendChild(seccionConfirmados);
        
        for (const contacto of contactosConfirmados) {
          const li = document.createElement('li');
          const nombreMostrar = contacto.users?.nombre || contacto.contact_email;
          li.textContent = `${nombreMostrar} (${contacto.contact_email}) ✅`;
  
          const eliminarBtn = crearBoton('Eliminar', () => {
            crearConfirmacionPersonalizada('¿Estás seguro de eliminar este contacto? No podrás compartir archivos con él hasta volver a agregarlo.', async () => {
              try {
                const { error } = await supabase
                  .from('contacts')
                  .delete()
                  .eq('id', contacto.id);
                  
                if (error) {
                  console.error("Error al eliminar contacto:", error);
                  return showToast('Error al eliminar: ' + error.message, 'error');
                }
                
                showToast('Contacto eliminado.', 'success');
                listarContactos();
              } catch (err) {
                console.error("Error al eliminar contacto:", err);
                showToast('Error al eliminar: ' + err.message, 'error');
              }
            });
          });
          li.appendChild(eliminarBtn);
          lista.appendChild(li);
        }
      }
      
      // Mostrar contactos pendientes
      if (contactosPendientes.length > 0) {
        const seccionPendientes = document.createElement('div');
        seccionPendientes.innerHTML = '<h4>Contactos pendientes de confirmación:</h4>';
        lista.appendChild(seccionPendientes);
        
        for (const contacto of contactosPendientes) {
          const li = document.createElement('li');
          const nombreMostrar = contacto.users?.nombre || contacto.contact_email;
          li.textContent = `${nombreMostrar} (${contacto.contact_email}) ❌ Pendiente`;
  
          const eliminarBtn = crearBoton('Cancelar', () => {
            crearConfirmacionPersonalizada('¿Estás seguro de cancelar esta solicitud de contacto?', async () => {
              try {
                const { error } = await supabase
                  .from('contacts')
                  .delete()
                  .eq('id', contacto.id);
                  
                if (error) {
                  console.error("Error al eliminar contacto:", error);
                  return showToast('Error al eliminar: ' + error.message, 'error');
                }
                
                showToast('Solicitud cancelada.', 'success');
                listarContactos();
              } catch (err) {
                console.error("Error al eliminar contacto:", err);
                showToast('Error al eliminar: ' + err.message, 'error');
              }
            });
          });
          li.appendChild(eliminarBtn);
          lista.appendChild(li);
        }
      }
      
      // Mostrar solicitudes pendientes
      if (solicitudesPendientes.length > 0) {
        const seccionSolicitudes = document.createElement('div');
        seccionSolicitudes.innerHTML = '<h4>Solicitudes pendientes:</h4>';
        lista.appendChild(seccionSolicitudes);
        
        for (const solicitud of solicitudesPendientes) {
          if (!solicitud.users || !solicitud.users.email) continue;
          
          const contactUserEmail = solicitud.users.email;
          const li = document.createElement('li');
          const nombreMostrar = solicitud.users.nombre || contactUserEmail;
          li.textContent = `${nombreMostrar} (${contactUserEmail}) te agregó`;
          
          const botonesContainer = document.createElement('div');
          botonesContainer.style.display = 'inline-block';
          
          const aceptarBtn = crearBoton('Aceptar', async () => {
            try {
              const { error } = await supabase.from('contacts').insert({
                user_id: user.id,
                contact_email: contactUserEmail.toLowerCase()
              });
              
              if (error) {
                console.error("Error al aceptar contacto:", error);
                return showToast('Error al aceptar: ' + error.message, 'error');
              }
              
              showToast('Contacto aceptado. Ahora pueden compartir archivos mutuamente.', 'success');
              listarContactos();
            } catch (err) {
              console.error("Error al aceptar contacto:", err);
              showToast('Error al aceptar: ' + err.message, 'error');
            }
          });
          
          const rechazarBtn = crearBoton('Rechazar', () => {
            try {
              // No hacemos nada, simplemente no lo agregamos
              showToast('Solicitud ignorada.', 'info');
              // Escondemos este elemento de la lista visualmente
              li.style.display = 'none';
            } catch (err) {
              console.error("Error al rechazar contacto:", err);
              showToast('Error: ' + err.message, 'error');
            }
          });
          
          botonesContainer.appendChild(aceptarBtn);
          botonesContainer.appendChild(rechazarBtn);
          li.appendChild(botonesContainer);
          lista.appendChild(li);
        }
      }
    } catch (err) {
      console.error("Error general en listarContactos:", err);
      showToast('Error al listar contactos: ' + err.message, 'error');
    }
  }

  // Función mejorada que utiliza la RPC get_confirmed_contacts
  async function obtenerContactosConfirmados() {
    try {
      console.log("Obteniendo contactos confirmados utilizando RPC");
      
      const { data, error } = await supabase.rpc('get_confirmed_contacts', { 
        p_user_email: user.email.toLowerCase(),
        p_user_id: user.id 
      });
      
      if (error) {
        console.error("Error al obtener contactos confirmados:", error);
        showToast('Error al obtener contactos confirmados: ' + error.message, 'error');
        return [];
      }
      
      console.log("Contactos confirmados obtenidos por RPC:", data);
      return data || [];
    } catch (err) {
      console.error("Error general en obtenerContactosConfirmados:", err);
      showToast('Error al obtener contactos: ' + err.message, 'error');
      return [];
    }
  }

  // Función para obtener el ID de un usuario por su email
  async function obtenerIdUsuarioPorEmail(email) {
    try {
      console.log("Buscando ID de usuario para email:", email);
      const { data, error } = await supabase
        .rpc('get_user_by_email', { email_to_find: email.toLowerCase() });
        
      if (error) {
        console.error("Error al obtener ID de usuario:", error);
        throw error;
      }
      
      const userId = data && data.length > 0 ? data[0].id : null;
      console.log("ID de usuario encontrado:", userId);
      return userId;
    } catch (err) {
      console.error("Error al obtener ID de usuario:", err);
      return null;
    }
  }

  return {
    agregarContacto,
    listarContactos,
    obtenerContactosConfirmados,
    obtenerIdUsuarioPorEmail
  };
}