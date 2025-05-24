// toast.js - Implementación mejorada del componente Toast
export function createToast(message, type = 'info', duration = 3000) {
    // Eliminar cualquier toast existente
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    });
    
    // Crear el nuevo toast con icono según el tipo
    const toast = document.createElement('div');
    toast.classList.add('toast', `toast-${type}`);
    
    // Añadir icono según el tipo
    let icon = '';
    switch(type) {
      case 'success':
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
        break;
      case 'error':
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
        break;
      case 'warning':
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
        break;
      default:
        icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }
    
    // Crear estructura del toast con icono y botón de cerrar
    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-icon">${icon}</div>
        <div class="toast-message">${message}</div>
        <button class="toast-close">×</button>
      </div>
      <div class="toast-progress"></div>
    `;
    
    // Añadir a la página
    document.body.appendChild(toast);
    
    // Añadir evento para cerrar el toast
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    });
    
    // Animar entrada
    setTimeout(() => {
      toast.classList.add('show');
      
      // Iniciar la barra de progreso
      const progressBar = toast.querySelector('.toast-progress');
      progressBar.style.transition = `width ${duration}ms linear`;
      progressBar.style.width = '0%';
    }, 10);
    
    // Auto cerrar después del tiempo indicado
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
  
  // Exportar la función para uso global
  export default function initializeToast() {
    // Registrar la función en el objeto window para uso global
    window.showToast = createToast;
    
    // Añadir estilos si no existen
    if (!document.getElementById('toast-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.textContent = `
        .toast {
          position: fixed;
          top: 20px;
          right: 20px;
          max-width: 350px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          transform: translateY(-20px);
          opacity: 0;
          transition: all 0.3s ease;
          z-index: 9999;
        }
        
        .toast.show {
          transform: translateY(0);
          opacity: 1;
        }
        
        .toast-content {
          display: flex;
          align-items: center;
          padding: 12px 16px;
        }
        
        .toast-icon {
          margin-right: 12px;
          display: flex;
        }
        
        .toast-message {
          flex: 1;
          font-size: 14px;
        }
        
        .toast-close {
          background: transparent;
          border: none;
          color: #999;
          font-size: 18px;
          cursor: pointer;
          padding: 0;
          margin: 0;
          width: auto;
        }
        
        .toast-progress {
          height: 4px;
          width: 100%;
          background: rgba(0, 0, 0, 0.1);
        }
        
        .toast-success .toast-icon {
          color: #28a745;
        }
        
        .toast-error .toast-icon {
          color: #dc3545;
        }
        
        .toast-warning .toast-icon {
          color: #ffc107;
        }
        
        .toast-info .toast-icon {
          color: #17a2b8;
        }
        
        .toast-success .toast-progress {
          background: #28a745;
        }
        
        .toast-error .toast-progress {
          background: #dc3545;
        }
        
        .toast-warning .toast-progress {
          background: #ffc107;
        }
        
        .toast-info .toast-progress {
          background: #17a2b8;
        }
      `;
      document.head.appendChild(style);
    }
  }