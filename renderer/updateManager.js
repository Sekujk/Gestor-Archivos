// updateManager.js - Gestiona las actualizaciones de la aplicación
import { appManager } from '../supabase/client.js';
import { showToast } from './uiHelpers.js';

export function initUpdateManager() {
  // Verificar si estamos en un entorno Electron
  const isElectron = window.electronAPI !== undefined;
  
  if (!isElectron) {
    console.log('No estamos en Electron, las actualizaciones no están disponibles');
    return null;
  }

  // Crear el panel de actualizaciones en el DOM
  createUpdateUI();
  
  // Referencias a elementos del DOM
  const elements = {
    container: document.getElementById('update-container'),
    message: document.getElementById('update-message'),
    progressContainer: document.getElementById('update-progress-container'),
    progressFill: document.getElementById('update-progress-fill'),
    progressText: document.getElementById('update-progress-text'),
    downloadBtn: document.getElementById('download-update'),
    installBtn: document.getElementById('install-update'),
    laterBtn: document.getElementById('later-update'),
    closeBtn: document.getElementById('close-update-panel'),
    checkBtn: document.getElementById('check-updates-btn')
  };

  // Mostrar versión actual de la aplicación
  displayAppVersion();
  
  // Configurar listeners de eventos de actualización
  document.addEventListener('app:update-available', (event) => {
    const { version } = event.detail;
    elements.container.classList.remove('hidden');
    elements.message.textContent = `Nueva versión ${version} disponible`;
    showToast(`Nueva versión ${version} disponible`, 'info');
  });
  
  document.addEventListener('app:update-progress', (event) => {
    const { percent } = event.detail;
    elements.progressContainer.classList.remove('hidden');
    elements.progressFill.style.width = `${percent.toFixed(1)}%`;
    elements.progressText.textContent = `${percent.toFixed(1)}%`;
  });
  
  document.addEventListener('app:update-downloaded', () => {
    elements.message.textContent = 'Actualización lista para instalar';
    elements.downloadBtn.classList.add('hidden');
    elements.installBtn.classList.remove('hidden');
    showToast('Actualización lista para instalar', 'success');
  });
  
  document.addEventListener('app:update-error', (event) => {
    const { message } = event.detail;
    console.error('Error en actualización:', message);
    showToast(`Error en la actualización: ${message}`, 'error');
  });
  
  // Configurar event listeners para los botones
  if (elements.checkBtn) {
    elements.checkBtn.addEventListener('click', async () => {
      try {
        showToast('Verificando actualizaciones...', 'info');
        const result = await appManager.checkForUpdates();
        if (result && !result.error && !appManager.updateStatus.available) {
          showToast('No hay actualizaciones disponibles', 'info');
        }
      } catch (err) {
        showToast(`Error al verificar: ${err.message}`, 'error');
      }
    });
  }
  
  if (elements.downloadBtn) {
    elements.downloadBtn.addEventListener('click', () => {
      elements.message.textContent = 'Descargando actualización...';
      elements.downloadBtn.disabled = true;
      // La descarga ya es automática con la configuración actual
    });
  }
  
  if (elements.installBtn) {
    elements.installBtn.addEventListener('click', async () => {
      try {
        await appManager.installUpdate();
      } catch (err) {
        showToast(`Error al instalar: ${err.message}`, 'error');
      }
    });
  }
  
  if (elements.laterBtn) {
    elements.laterBtn.addEventListener('click', () => {
      elements.container.classList.add('hidden');
    });
  }
  
  if (elements.closeBtn) {
    elements.closeBtn.addEventListener('click', () => {
      elements.container.classList.add('hidden');
    });
  }
  
  // Mostrar la versión actual de la aplicación
  async function displayAppVersion() {
    try {
      const version = await appManager.getAppVersion();
      const versionElement = document.getElementById('app-version');
      if (versionElement) {
        versionElement.textContent = `v${version}`;
      }
    } catch (err) {
      console.error('Error al obtener la versión:', err);
    }
  }
  
  // Crear UI para actualizaciones
  function createUpdateUI() {
    // Crear elemento para la versión en el header
    const header = document.querySelector('header');
    if (header) {
      const versionSpan = document.createElement('span');
      versionSpan.id = 'app-version';
      versionSpan.className = 'app-version';
      versionSpan.textContent = 'v?.?.?';
      header.appendChild(versionSpan);
    }
    
    // Crear botón de verificación de actualizaciones en la navegación
    const nav = document.querySelector('nav');
    if (nav) {
      const checkUpdatesBtn = document.createElement('button');
      checkUpdatesBtn.id = 'check-updates-btn';
      checkUpdatesBtn.className = 'check-updates-btn';
      checkUpdatesBtn.innerHTML = '<span class="update-icon">↻</span> Verificar actualizaciones';
      nav.appendChild(checkUpdatesBtn);
    }
    
    // Crear panel de actualizaciones
    const updatePanel = document.createElement('div');
    updatePanel.id = 'update-container';
    updatePanel.className = 'update-panel hidden';
    
    updatePanel.innerHTML = `
      <div class="update-header">
        <h3>Actualización disponible</h3>
        <button id="close-update-panel">×</button>
      </div>
      <div class="update-content">
        <p id="update-message">Se ha encontrado una nueva versión.</p>
        <div id="update-progress-container" class="hidden">
          <div id="update-progress-bar">
            <div id="update-progress-fill"></div>
          </div>
          <span id="update-progress-text">0%</span>
        </div>
        <div class="update-actions">
          <button id="download-update" class="btn primary">Descargar</button>
          <button id="install-update" class="btn success hidden">Instalar y reiniciar</button>
          <button id="later-update" class="btn secondary">Más tarde</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(updatePanel);
    
    // Añadir estilos necesarios
    addUpdateStyles();
  }
  
  // Añadir estilos para la UI de actualizaciones
  function addUpdateStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .app-version {
        font-size: 12px;
        opacity: 0.7;
        margin-left: 8px;
        display: inline-block;
      }
      
      .check-updates-btn {
        background: none;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 6px 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        margin-right: 10px;
      }
      
      .check-updates-btn:hover {
        background: #f5f5f5;
      }
      
      .update-icon {
        display: inline-block;
        margin-right: 5px;
      }
      
      .update-panel {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 320px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        overflow: hidden;
      }
      
      .update-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: #f4f4f4;
        border-bottom: 1px solid #e0e0e0;
      }
      
      .update-content {
        padding: 16px;
      }
      
      .update-actions {
        display: flex;
        gap: 8px;
        margin-top: 16px;
      }
      
      #update-progress-container {
        margin: 12px 0;
      }
      
      #update-progress-bar {
        height: 8px;
        background: #e0e0e0;
        border-radius: 4px;
        overflow: hidden;
      }
      
      #update-progress-fill {
        height: 100%;
        background: #4CAF50;
        width: 0%;
        transition: width 0.3s;
      }
      
      .hidden {
        display: none;
      }
      
      .btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      
      .primary {
        background: #2196F3;
        color: white;
      }
      
      .success {
        background: #4CAF50;
        color: white;
      }
      
      .secondary {
        background: #e0e0e0;
        color: #333;
      }
    `;
    
    document.head.appendChild(styleElement);
  }
  
  return {
    checkForUpdates: async () => {
      return await appManager.checkForUpdates();
    },
    getAppVersion: async () => {
      return await appManager.getAppVersion();
    }
  };
}