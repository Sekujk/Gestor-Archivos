
// uiHelpers.js
export function crearBoton(texto, handler) {
    const btn = document.createElement('button');
    btn.textContent = texto;
    btn.style.marginLeft = '10px';
    btn.addEventListener('click', handler);
    return btn;
  }
  
  export function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // Esperamos un momento para que se aplique la transición
    setTimeout(() => toast.classList.add('visible'), 10);
    
    // Eliminamos el toast después de un tiempo
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toastContainer.removeChild(toast), 300);
    }, 3000);
  }
  
  // Versión mejorada de crearSelectContactos
export function crearSelectContactos(contactos, onSelect) {
  // Crear un contenedor para el selector personalizado
  const selectorContainer = document.createElement('div');
  selectorContainer.className = 'selector-contactos';
  selectorContainer.style.position = 'absolute';
  selectorContainer.style.zIndex = '1000';
  selectorContainer.style.backgroundColor = 'white';
  selectorContainer.style.border = '1px solid #ccc';
  selectorContainer.style.borderRadius = '4px';
  selectorContainer.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  selectorContainer.style.padding = '10px';
  selectorContainer.style.maxHeight = '250px';
  selectorContainer.style.width = '250px';
  selectorContainer.style.overflowY = 'auto';
  
  // Agregar un título
  const titulo = document.createElement('h4');
  titulo.textContent = 'Seleccionar contacto';
  titulo.style.margin = '0 0 10px 0';
  selectorContainer.appendChild(titulo);
  
  // Agregar un campo de búsqueda
  const busqueda = document.createElement('input');
  busqueda.type = 'text';
  busqueda.placeholder = 'Buscar contacto...';
  busqueda.style.width = '100%';
  busqueda.style.padding = '5px';
  busqueda.style.marginBottom = '10px';
  busqueda.style.boxSizing = 'border-box';
  busqueda.style.border = '1px solid #ddd';
  busqueda.style.borderRadius = '3px';
  selectorContainer.appendChild(busqueda);
  
  // Crear lista de contactos
  const listaContactos = document.createElement('div');
  listaContactos.className = 'lista-contactos';
  
  // Función para renderizar los contactos
  const renderizarContactos = (filtro = '') => {
    listaContactos.innerHTML = '';
    
    const contactosFiltrados = contactos.filter(c => {
      const nombre = c.nombre || '';
      const email = c.email || '';
      const filtroLower = filtro.toLowerCase();
      return nombre.toLowerCase().includes(filtroLower) || email.toLowerCase().includes(filtroLower);
    });
    
    if (contactosFiltrados.length === 0) {
      const noEncontrado = document.createElement('p');
      noEncontrado.textContent = 'No se encontraron contactos';
      noEncontrado.style.textAlign = 'center';
      noEncontrado.style.color = '#666';
      listaContactos.appendChild(noEncontrado);
      return;
    }
    
    contactosFiltrados.forEach(contacto => {
      const itemContacto = document.createElement('div');
      itemContacto.className = 'contacto-item';
      itemContacto.style.padding = '8px';
      itemContacto.style.cursor = 'pointer';
      itemContacto.style.borderBottom = '1px solid #eee';
      itemContacto.style.transition = 'background-color 0.2s';
      
      const nombre = contacto.nombre || contacto.email;
      const email = contacto.email;
      
      itemContacto.innerHTML = `
        <div style="font-weight: bold;">${nombre}</div>
        <div style="color: #666; font-size: 0.9em;">${email}</div>
      `;
      
      itemContacto.addEventListener('mouseover', () => {
        itemContacto.style.backgroundColor = '#f0f0f0';
      });
      
      itemContacto.addEventListener('mouseout', () => {
        itemContacto.style.backgroundColor = 'transparent';
      });
      
      itemContacto.addEventListener('click', () => {
        onSelect(email);
      });
      
      listaContactos.appendChild(itemContacto);
    });
  };
  
  // Renderizar todos los contactos inicialmente
  renderizarContactos();
  
  // Escuchar cambios en el campo de búsqueda
  busqueda.addEventListener('input', (e) => {
    renderizarContactos(e.target.value);
  });
  
  // Agregar la lista al contenedor
  selectorContainer.appendChild(listaContactos);
  
  // Agregar botón de cancelar
  const cancelarBtn = document.createElement('button');
  cancelarBtn.textContent = 'Cancelar';
  cancelarBtn.style.marginTop = '10px';
  cancelarBtn.style.padding = '5px 10px';
  cancelarBtn.style.cursor = 'pointer';
  cancelarBtn.addEventListener('click', () => {
    if (selectorContainer.parentNode) {
      selectorContainer.parentNode.removeChild(selectorContainer);
    }
  });
  selectorContainer.appendChild(cancelarBtn);
  
  // Añadir evento para cerrar al hacer clic fuera
  setTimeout(() => {
    const clickFuera = (e) => {
      if (!selectorContainer.contains(e.target) && 
          document.body.contains(selectorContainer)) {
        document.body.removeChild(selectorContainer);
        document.removeEventListener('click', clickFuera);
      }
    };
    document.addEventListener('click', clickFuera);
  }, 100);
  
  return selectorContainer;
}