import { BaseAuthForm } from './BaseAuthForm.js';
import { ValidationUtils } from '../utils/validation.js';
import { UIUtils } from '../utils/ui.js';

export class LoginForm extends BaseAuthForm {
  constructor(supabaseClient, showToast) {
    super('loginForm', supabaseClient, showToast);
    this.submitButton = document.getElementById('login');
    this._setupForgotPassword();
  }

  _validateForm(formData) {
    const { email, password } = formData;
    
    const emailValidation = ValidationUtils.validateEmail(email);
    if (!emailValidation.isValid) {
      return emailValidation;
    }

    const passwordValidation = ValidationUtils.validatePassword(password);
    if (!passwordValidation.isValid) {
      return passwordValidation;
    }

    return { isValid: true };
  }

  async _processForm(formData) {
    const { email, password } = formData;
    
    UIUtils.showButtonLoading(this.submitButton, 'Iniciando sesión...');
    
    try {
      const result = await this.authService.login(email, password);
      
      if (result.success) {
        this.showToast('Inicio de sesión exitoso. ¡Bienvenido/a!', 'success');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1000);
      } else {
        throw new Error(result.error);
      }
    } finally {
      UIUtils.hideButtonLoading(this.submitButton);
    }
  }

  _setupForgotPassword() {
    const forgotPasswordLink = document.getElementById('forgotPassword');
    if (forgotPasswordLink) {
      forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        this._showResetPasswordModal();
      });
    }
  }

  _showResetPasswordModal() {
    const modalContent = `
      <p>Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.</p>
      <form id="resetPasswordForm">
        <label for="resetEmail">Correo electrónico</label>
        <input type="email" id="resetEmail" name="resetEmail" placeholder="Tu correo electrónico" required>
        <button type="submit" id="resetSubmitBtn" class="btn btn-primary">Enviar instrucciones</button>
      </form>
      <div id="resetSuccessMessage" style="display: none;" class="success-message">
        <p>¡Enlace enviado! Revisa tu correo electrónico y sigue las instrucciones para restablecer tu contraseña.</p>
      </div>
    `;

    const modal = UIUtils.createModal('Recuperar contraseña', modalContent);
    UIUtils.setupModalEvents(modal);

    const resetForm = modal.querySelector('#resetPasswordForm');
    const resetSubmitBtn = modal.querySelector('#resetSubmitBtn');
    const successMessage = modal.querySelector('#resetSuccessMessage');

    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = modal.querySelector('#resetEmail').value.trim();
      const emailValidation = ValidationUtils.validateEmail(email);
      
      if (!emailValidation.isValid) {
        this.showToast(emailValidation.message, 'error');
        return;
      }

      UIUtils.showButtonLoading(resetSubmitBtn, 'Enviando...');

      try {
        const result = await this.authService.resetPassword(email);
        
        if (result.success) {
          resetForm.style.display = 'none';
          successMessage.style.display = 'block';
          setTimeout(() => UIUtils.closeModal(modal), 5000);
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        this.showToast(error.message, 'error');
      } finally {
        UIUtils.hideButtonLoading(resetSubmitBtn);
      }
    });
  }
}