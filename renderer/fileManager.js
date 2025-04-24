// fileManager.js (corregido)
import { getSupabase } from '../supabase/client.js';
import { showToast, crearBoton, crearSelectContactos } from './uiHelpers.js';

export function initFileManager(user, modal, contactManager) {
  // Obtenemos el cliente de Supabase
  const supabase = getSupabase();
  
  async function subirArchivo() {
    try {
      const fileInput = document.getElementById('archivo');
      const file = fileInput.files[0];
      if (!file) return showToast('Selecciona un archivo.', 'error');

      // Mostrar un toast de carga
      showToast('Subiendo archivo...', 'info');

      // Ruta en el bucket de almacenamiento
      const filePath = `${user.id}/${file.name}`;
      
      // Verificar si ya existe un archivo con ese nombre
      const { data: existingFiles, error: checkError } = await supabase
        .from('files')
        .select('id')
        .eq('user_id', user.id)
        .eq('file_name', file.name);
        
      if (checkError) {
        console.error("Error al verificar si el archivo existe:", checkError);
        return showToast('Error al verificar archivo: ' + checkError.message, 'error');
      }
      
      if (existingFiles && existingFiles.length > 0) {
        if (!confirm('Ya existe un archivo con este nombre. ¿Deseas reemplazarlo?')) {
          return showToast('Operación cancelada.', 'info');
        }
      }
      
      // Opción de upsert si se desea reemplazar
      const upsertOption = existingFiles && existingFiles.length > 0;
      
      // Subir el archivo al bucket
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('archivos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: upsertOption
        });

      if (uploadError) {
        console.error("Error al subir archivo:", uploadError);
        return showToast('Error al subir: ' + uploadError.message, 'error');
      }

      // Si existe, eliminamos el registro anterior
      if (existingFiles && existingFiles.length > 0) {
        const { error: deleteError } = await supabase
          .from('files')
          .delete()
          .eq('user_id', user.id)
          .eq('file_name', file.name);
          
        if (deleteError) {
          console.error("Error al eliminar registro anterior:", deleteError);
          // Continuamos de todas formas
        }
      }

      // Registrar el archivo en la tabla files
      const { error: dbError } = await supabase.from('files').insert({
        user_id: user.id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type
      });

      if (dbError) {
        console.error("Error al registrar archivo en la base de datos:", dbError);
        // Intentar eliminar el archivo subido
        await supabase.storage.from('archivos').remove([filePath]);
        return showToast('Error al registrar archivo: ' + dbError.message, 'error');
      }

      showToast('Archivo subido exitosamente.', 'success');
      fileInput.value = ''; // Limpiar el input
      listarArchivos();
    } catch (err) {
      console.error("Error general en subirArchivo:", err);
      showToast('Error al subir archivo: ' + err.message, 'error');
    }
  }


  async function listarArchivos() {
    try {
      const filtro = document.getElementById('filtro-archivos').value.toLowerCase();
      
      // Obtener archivos de la tabla files
      const { data: files, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error al listar archivos:", error);
        return showToast('Error al listar archivos: ' + error.message, 'error');
      }

      const lista = document.getElementById('lista-archivos');
      lista.innerHTML = '';

      if (!files || files.length === 0) {
        lista.innerHTML = '<p>No tienes archivos subidos.</p>';
        return;
      }

      const contactos = await contactManager.obtenerContactosConfirmados();

      for (const file of files) {
        if (!file.file_name.toLowerCase().includes(filtro)) continue;

        const li = document.createElement('li');
        li.textContent = file.file_name;

        const verBtn = crearBoton('Ver', async () => {
          try {
            showToast('Cargando archivo...', 'info');
            // Para buckets privados, debemos usar createSignedUrl
            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
              .from('archivos')
              .createSignedUrl(file.file_path, 60); // URL válida por 60 segundos
            
            if (signedUrlError) throw signedUrlError;
            if (!signedUrlData?.signedUrl) throw new Error('No se pudo obtener URL firmada');
            
            // Mostrar en el modal
            const content = modal.getContentForModal(file.file_name, signedUrlData.signedUrl);
            modal.openModal(file.file_name, content);
          } catch (err) {
            console.error("Error al generar URL de visualización:", err);
            showToast('Error al visualizar: ' + err.message, 'error');
          }
        });

        const descargarBtn = crearBoton('Descargar', async () => {
          try {
            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
              .from('archivos')
              .createSignedUrl(file.file_path, 60);
            
            if (signedUrlError) throw signedUrlError;
            
            // Crear un enlace temporal y hacer clic en él para descargar
            const a = document.createElement('a');
            a.href = signedUrlData.signedUrl;
            a.download = file.file_name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          } catch (err) {
            showToast('Error al descargar: ' + err.message, 'error');
          }
        });

        const compartirBtn = crearBoton('Compartir', () => {
          // Verificar si ya hay un selector abierto
          const existingSelect = document.querySelector('.selector-contactos');
          if (existingSelect) {
            existingSelect.parentNode.removeChild(existingSelect);
            return;
          }
        
          if (contactos.length === 0) {
            showToast('No tienes contactos confirmados para compartir.', 'info');
            return;
          }
          
          const selector = crearSelectContactos(contactos, async (email) => {
            // Ahora pasamos directamente el email, no el objeto
            await compartirArchivo(file.id, email);
            
            // Eliminar el selector después de seleccionar
            const selector = document.querySelector('.selector-contactos');
            if (selector) {
              selector.parentNode.removeChild(selector);
            }
          });
          
          // Añadir al documento en lugar de al elemento li
          document.body.appendChild(selector);
          
          // Posicionar el selector cerca del botón
          const rect = compartirBtn.getBoundingClientRect();
          selector.style.position = 'absolute';
          selector.style.left = `${rect.left}px`;
          selector.style.top = `${rect.bottom + 5}px`;
        });
        const eliminarBtn = crearBoton('Eliminar', async () => {
          if (confirm(`¿Estás seguro de eliminar "${file.file_name}"?`)) {
            try {
              // Primero eliminamos las referencias en shared_files
              const { error: sharedError } = await supabase
                .from('shared_files')
                .delete()
                .eq('file_id', file.id);
              
              if (sharedError) {
                console.error("Error al eliminar referencias compartidas:", sharedError);
              }
              
              // Eliminamos el registro de la tabla files
              const { error: dbError } = await supabase
                .from('files')
                .delete()
                .eq('id', file.id);
                
              if (dbError) {
                console.error("Error al eliminar registro de archivo:", dbError);
                return showToast('Error al eliminar registro: ' + dbError.message, 'error');
              }
              
              // Ahora eliminamos el archivo del storage
              const { error: storageError } = await supabase.storage
                .from('archivos')
                .remove([file.file_path]);
                
              if (storageError) {
                console.error("Error al eliminar archivo del storage:", storageError);
                // No retornamos aquí para que se actualice la lista aunque no se pueda eliminar físicamente
              }
              
              showToast('Archivo eliminado.', 'success');
              listarArchivos();
            } catch (err) {
              console.error("Error en proceso de eliminación:", err);
              showToast('Error al eliminar: ' + err.message, 'error');
            }
          }
        });

        li.appendChild(verBtn);
        li.appendChild(descargarBtn);
        li.appendChild(compartirBtn);
        li.appendChild(eliminarBtn);
        lista.appendChild(li);
      }
    } catch (err) {
      console.error("Error general en listarArchivos:", err);
      showToast('Error al listar archivos: ' + err.message, 'error');
    }
  }

  async function compartirArchivo(fileId, email) {
    try {
      console.log("Compartiendo archivo ID:", fileId, "con email:", email);
      
      if (!email || typeof email !== 'string') {
        console.error("Email inválido:", email);
        return showToast('Email de contacto inválido', 'error');
      }
      
      // Usar la función RPC get_user_by_email para obtener el ID del usuario
      const { data: users, error: userError } = await supabase
        .rpc('get_user_by_email', { email_to_find: email.toLowerCase() });
  
      if (userError) {
        console.error("Error al buscar usuario:", userError);
        return showToast('Error al buscar usuario: ' + userError.message, 'error');
      }
      
      if (!users || users.length === 0) {
        return showToast('No existe ningún usuario con ese correo', 'warning');
      }
      
      const targetUser = users[0];
  
      // Verificar si ya está compartido
      const { data: existente, error: checkError } = await supabase
        .from('shared_files')
        .select('*')
        .eq('file_id', fileId)
        .eq('shared_with', targetUser.id);
  
      if (checkError) {
        console.error("Error al verificar si archivo ya compartido:", checkError);
        return showToast('Error al verificar archivos compartidos: ' + checkError.message, 'error');
      }
  
      if (existente && existente.length > 0) {
        return showToast('Este archivo ya está compartido con este usuario.', 'info');
      }
  
      // Insertar el registro usando los UUIDs
      const { error } = await supabase.from('shared_files').insert({
        file_id: fileId,
        shared_by: user.id,
        shared_with: targetUser.id,
        permissions: 'read'
      });
  
      if (error) {
        console.error("Error al compartir archivo:", error);
        return showToast('Error al compartir: ' + error.message, 'error');
      }
  
      showToast('Archivo compartido con éxito.', 'success');
    } catch (err) {
      console.error("Error general en compartirArchivo:", err);
      showToast('Error al compartir: ' + err.message, 'error');
    }
  }

  async function listarArchivosCompartidos() {
    try {
      const filtro = document.getElementById('filtro-compartidos').value.toLowerCase();
      const lista = document.getElementById('archivos-compartidos');
      lista.innerHTML = '';
      
      console.log("Iniciando listado de archivos compartidos");
      
      // SECCIÓN 1: Obtener archivos compartidos CONTIGO (recibidos)
      const { data: archivosRecibidos, error: errorRecibidos } = await supabase
        .from('shared_files')
        .select(`
          id,
          permissions,
          created_at,
          file_id,
          shared_by
        `)
        .eq('shared_with', user.id);
  
      if (errorRecibidos) {
        console.error("Error al listar archivos compartidos recibidos:", errorRecibidos);
        showToast('Error al obtener archivos recibidos: ' + errorRecibidos.message, 'error');
      }
      
      // Obtener información de archivos relacionados para archivos recibidos
      let archivosRecibidosCompletos = [];
      if (archivosRecibidos && archivosRecibidos.length > 0) {
        // Obtener detalles de los archivos en una sola consulta
        const fileIds = archivosRecibidos.map(sf => sf.file_id);
        const { data: filesData, error: filesError } = await supabase
          .from('files')
          .select('*')
          .in('id', fileIds);
          
        if (filesError) {
          console.error("Error al obtener detalles de archivos:", filesError);
        }
        
        // Obtener detalles de los usuarios que compartieron en una sola consulta
        const userIds = archivosRecibidos.map(sf => sf.shared_by);
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, email, nombre')
          .in('id', userIds);
          
        if (usersError) {
          console.error("Error al obtener detalles de usuarios:", usersError);
        }
        
        // Mapear los datos completos
        archivosRecibidosCompletos = archivosRecibidos.map(item => {
          const fileInfo = filesData ? filesData.find(f => f.id === item.file_id) : null;
          const userInfo = usersData ? usersData.find(u => u.id === item.shared_by) : null;
          
          return {
            ...item,
            files: fileInfo,
            shared_by_user: userInfo
          };
        });
      }
      
      // SECCIÓN 2: Obtener archivos que TÚ HAS COMPARTIDO con otros
      const { data: archivosCompartidos, error: errorCompartidos } = await supabase
        .from('shared_files')
        .select(`
          id,
          permissions,
          created_at,
          file_id,
          shared_with
        `)
        .eq('shared_by', user.id);
  
      if (errorCompartidos) {
        console.error("Error al listar archivos que has compartido:", errorCompartidos);
        showToast('Error al obtener archivos enviados: ' + errorCompartidos.message, 'error');
      }
      
      // Obtener información de archivos relacionados para archivos compartidos
      let archivosCompartidosCompletos = [];
      if (archivosCompartidos && archivosCompartidos.length > 0) {
        // Obtener detalles de los archivos en una sola consulta
        const fileIds = archivosCompartidos.map(sf => sf.file_id);
        const { data: filesData, error: filesError } = await supabase
          .from('files')
          .select('*')
          .in('id', fileIds);
          
        if (filesError) {
          console.error("Error al obtener detalles de archivos:", filesError);
        }
        
        // Obtener detalles de los usuarios con quienes se compartió en una sola consulta
        const userIds = archivosCompartidos.map(sf => sf.shared_with);
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, email, nombre')
          .in('id', userIds);
          
        if (usersError) {
          console.error("Error al obtener detalles de usuarios:", usersError);
        }
        
        // Mapear los datos completos
        archivosCompartidosCompletos = archivosCompartidos.map(item => {
          const fileInfo = filesData ? filesData.find(f => f.id === item.file_id) : null;
          const userInfo = usersData ? usersData.find(u => u.id === item.shared_with) : null;
          
          return {
            ...item,
            files: fileInfo,
            shared_with_user: userInfo
          };
        });
      }
      
      // Debug para verificar los datos
      console.log("Archivos recibidos completos:", archivosRecibidosCompletos);
      console.log("Archivos compartidos completos:", archivosCompartidosCompletos);
      
      let archivosParaMostrar = false;
      
      // SECCIÓN 3: Mostrar archivos recibidos
      if (archivosRecibidosCompletos && archivosRecibidosCompletos.length > 0) {
        const seccionRecibidos = document.createElement('div');
        seccionRecibidos.innerHTML = '<h4>Archivos compartidos contigo:</h4>';
        lista.appendChild(seccionRecibidos);
        
        let hayArchivosRecibidosFiltrados = false;
        
        for (const item of archivosRecibidosCompletos) {
          // Verificar que el archivo y el remitente existen
          if (!item.files || !item.shared_by_user) {
            console.log("Archivo recibido incompleto después de mapeo:", item);
            continue;
          }
          
          const fileName = item.files.file_name;
          const filePath = item.files.file_path;
          const sharedByName = item.shared_by_user.nombre || item.shared_by_user.email;
          
          console.log("Procesando archivo recibido:", fileName, "de", sharedByName);
          
          // Aplicar filtro
          if (!fileName.toLowerCase().includes(filtro) && 
              !sharedByName.toLowerCase().includes(filtro)) continue;
          
          hayArchivosRecibidosFiltrados = true;
          archivosParaMostrar = true;
  
          // El resto de tu código para mostrar archivos recibidos...
          const li = document.createElement('li');
          li.textContent = `${fileName} (de ${sharedByName})`;
  
          // Botón Ver
          const verBtn = crearBoton('Ver', async () => {
            try {
              showToast('Cargando archivo...', 'info');
              const { data: signedUrlData, error: signedUrlError } = await supabase.storage
                .from('archivos')
                .createSignedUrl(filePath, 60);
              
              if (signedUrlError) throw signedUrlError;
              
              // Mostrar en el modal
              const content = modal.getContentForModal(fileName, signedUrlData.signedUrl);
              modal.openModal(fileName, content);
            } catch (err) {
              showToast('Error al visualizar: ' + err.message, 'error');
            }
          });
  
          // Botón Descargar
          const descargarBtn = crearBoton('Descargar', async () => {
            try {
              const { data: signedUrlData, error: signedUrlError } = await supabase.storage
                .from('archivos')
                .createSignedUrl(filePath, 60);
              
              if (signedUrlError) throw signedUrlError;
              
              // Crear un enlace temporal y hacer clic en él para descargar
              const a = document.createElement('a');
              a.href = signedUrlData.signedUrl;
              a.download = fileName;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            } catch (err) {
              showToast('Error al descargar: ' + err.message, 'error');
            }
          });
  
          // Botón Quitar
          const quitarBtn = crearBoton('Quitar', async () => {
            if (confirm('¿Estás seguro de quitar este archivo compartido de tu lista?')) {
              try {
                const { error } = await supabase
                  .from('shared_files')
                  .delete()
                  .eq('id', item.id);
                  
                if (error) {
                  console.error("Error al quitar archivo compartido:", error);
                  return showToast('Error al quitar: ' + error.message, 'error');
                }
                
                showToast('Archivo quitado de compartidos.', 'success');
                listarArchivosCompartidos();
              } catch (err) {
                console.error("Error al quitar archivo compartido:", err);
                showToast('Error al quitar: ' + err.message, 'error');
              }
            }
          });
  
          li.appendChild(verBtn);
          li.appendChild(descargarBtn);
          li.appendChild(quitarBtn);
          lista.appendChild(li);
        }
        
        if (!hayArchivosRecibidosFiltrados) {
          const noHayArchivos = document.createElement('p');
          noHayArchivos.textContent = filtro ? 'No hay archivos recibidos que coincidan con tu búsqueda.' : 'No tienes archivos compartidos contigo.';
          lista.appendChild(noHayArchivos);
        }
      } else {
        const noHayArchivos = document.createElement('p');
        noHayArchivos.textContent = 'No tienes archivos compartidos contigo.';
        lista.appendChild(noHayArchivos);
      }
      
      // SECCIÓN 4: Mostrar archivos que has compartido con otros
      // Reemplaza la sección original con código similar al anterior pero usando archivosCompartidosCompletos
      if (archivosCompartidosCompletos && archivosCompartidosCompletos.length > 0) {
        const seccionEnviados = document.createElement('div');
        seccionEnviados.innerHTML = '<h4>Archivos que has compartido:</h4>';
        lista.appendChild(seccionEnviados);
        
        let hayArchivosCompartidosFiltrados = false;
        
        for (const item of archivosCompartidosCompletos) {
          // Verificar que el archivo y el destinatario existen
          if (!item.files || !item.shared_with_user) {
            console.log("Archivo compartido incompleto después de mapeo:", item);
            continue;
          }
          
          const fileName = item.files.file_name;
          const filePath = item.files.file_path;
          const sharedWithName = item.shared_with_user.nombre || item.shared_with_user.email;
          
          console.log("Procesando archivo compartido:", fileName, "con", sharedWithName);
          
          // Aplicar filtro
          if (!fileName.toLowerCase().includes(filtro) && 
              !sharedWithName.toLowerCase().includes(filtro)) continue;
          
          hayArchivosCompartidosFiltrados = true;
          archivosParaMostrar = true;
  
          // El resto de tu código para mostrar archivos compartidos...
          const li = document.createElement('li');
          li.textContent = `${fileName} (compartido con ${sharedWithName})`;
  
          // Botón Ver
          const verBtn = crearBoton('Ver', async () => {
            try {
              showToast('Cargando archivo...', 'info');
              const { data: signedUrlData, error: signedUrlError } = await supabase.storage
                .from('archivos')
                .createSignedUrl(filePath, 60);
              
              if (signedUrlError) throw signedUrlError;
              
              // Mostrar en el modal
              const content = modal.getContentForModal(fileName, signedUrlData.signedUrl);
              modal.openModal(fileName, content);
            } catch (err) {
              showToast('Error al visualizar: ' + err.message, 'error');
            }
          });
  
          // Botón Cancelar compartir
          const cancelarBtn = crearBoton('Cancelar compartir', async () => {
            if (confirm(`¿Estás seguro de dejar de compartir "${fileName}" con ${sharedWithName}?`)) {
              try {
                const { error } = await supabase
                  .from('shared_files')
                  .delete()
                  .eq('id', item.id);
                  
                if (error) {
                  console.error("Error al cancelar compartir:", error);
                  return showToast('Error al cancelar: ' + error.message, 'error');
                }
                
                showToast('Se ha dejado de compartir el archivo.', 'success');
                listarArchivosCompartidos();
              } catch (err) {
                console.error("Error al cancelar compartir:", err);
                showToast('Error al cancelar: ' + err.message, 'error');
              }
            }
          });
  
          li.appendChild(verBtn);
          li.appendChild(cancelarBtn);
          lista.appendChild(li);
        }
        
        if (!hayArchivosCompartidosFiltrados) {
          const noHayArchivos = document.createElement('p');
          noHayArchivos.textContent = filtro ? 'No hay archivos compartidos que coincidan con tu búsqueda.' : 'No has compartido archivos con nadie.';
          lista.appendChild(noHayArchivos);
        }
      } else {
        const noHayArchivos = document.createElement('p');
        noHayArchivos.textContent = 'No has compartido archivos con nadie.';
        lista.appendChild(noHayArchivos);
      }
      
      // Si no hay archivos compartidos en ninguna dirección
      if (!archivosParaMostrar) {
        lista.innerHTML = '<p>No hay archivos compartidos para mostrar.</p>';
      }
    } catch (err) {
      console.error("Error general en listarArchivosCompartidos:", err);
      showToast('Error al listar archivos compartidos: ' + err.message, 'error');
    }
  }
  
  return {
    subirArchivo,
    listarArchivos,
    compartirArchivo,
    listarArchivosCompartidos
  };
}