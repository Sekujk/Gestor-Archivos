export class UIUtils {
  static showButtonLoading(button, loadingText = 'Cargando...') {
    button.disabled = true;
    button.setAttribute('data-original-text', button.textContent);
    button.innerHTML = `<span class="spinner-small"></span> ${loadingText}`;
  }

  static hideButtonLoading(button) {
    button.disabled = false;
    const originalText = button.getAttribute('data-original-text');
    button.textContent = originalText || 'Enviar';
    button.removeAttribute('data-original-text');
  }

  static createModal(title, content, className = '') {
    const modal = document.createElement('div');
    modal.className = `modal ${className}`;
    
    modal.innerHTML = `
      <div class="modal-content">
        <button class="close" aria-label="Cerrar">&times;</button>
        <h2>${title}</h2>
        ${content}
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Mostrar el modal con animación
    setTimeout(() => modal.classList.add('show'), 10);
    
    return modal;
  }

  static closeModal(modal) {
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 300);
  }

  static setupModalEvents(modal) {
    const closeBtn = modal.querySelector('.close');
    
    closeBtn.addEventListener('click', () => this.closeModal(modal));
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal(modal);
      }
    });
    
    return modal;
  }
}
