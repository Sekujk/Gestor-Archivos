// modalHandler.js
export function initModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalClose = document.getElementById('modal-close');
    const modalFileName = document.getElementById('modal-file-name');
    const modalFileViewer = document.getElementById('modal-file-viewer');
    
    modalClose.addEventListener('click', () => {
      closeModal();
    });
    
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    });
  
    function openModal(fileName, content) {
      modalFileName.textContent = fileName;
      modalFileViewer.innerHTML = content;
      modalOverlay.classList.add('visible');
      document.body.style.overflow = 'hidden'; // Evitar scroll en el body
    }
  
    function closeModal() {
      modalOverlay.classList.remove('visible');
      document.body.style.overflow = '';
      // Limpiar contenido al cerrar
      setTimeout(() => {
        if (!modalOverlay.classList.contains('visible')) {
          modalFileViewer.innerHTML = '';
          modalFileName.textContent = '';
        }
      }, 300);
    }
  
    // Determinar el tipo de contenido para mostrar en el modal
    function getContentForModal(fileName, url) {
      const extension = fileName.split('.').pop().toLowerCase();
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'];
      const videoExtensions = ['mp4', 'webm', 'ogg'];
      const audioExtensions = ['mp3', 'wav', 'ogg'];
      const pdfExtension = 'pdf';
      
      if (imageExtensions.includes(extension)) {
        return `<img src="${url}" alt="${fileName}">`;
      } else if (videoExtensions.includes(extension)) {
        return `<video controls><source src="${url}" type="video/${extension}">Tu navegador no soporta videos.</video>`;
      } else if (audioExtensions.includes(extension)) {
        return `<audio controls><source src="${url}" type="audio/${extension}">Tu navegador no soporta audio.</audio>`;
      } else if (extension === pdfExtension) {
        return `<iframe src="${url}" width="100%" height="500px"></iframe>`;
      } else {
        // Para otros tipos de archivos, mostramos iframe genérico
        return `<iframe src="${url}" width="100%" height="500px"></iframe>`;
      }
    }
  
    return {
      openModal,
      closeModal,
      getContentForModal
    };
  }