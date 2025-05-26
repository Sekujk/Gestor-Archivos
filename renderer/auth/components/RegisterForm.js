import { BaseAuthForm } from './BaseAuthForm.js';
import { ValidationUtils } from '../utils/validation.js';
import { UIUtils } from '../utils/ui.js';

export class RegisterForm extends BaseAuthForm {
  constructor(supabaseClient, showToast) {
    super('registerForm', supabaseClient, showToast);
    this.submitButton = document.getElementById('register');
  }

  _validateForm(formData) {
    const { email, password, name } = formData;
    
    const nameValidation = ValidationUtils.validateName(name);
    if (!nameValidation.isValid) {
      return nameValidation;
    }

    const emailValidation = ValidationUtils.validateEmail(email);
    if (!emailValidation.isValid) {
      return emailValidation;
    }

    const passwordValidation = ValidationUtils.validatePassword(password, 6);
    if (!passwordValidation.isValid) {
      return passwordValidation;
    }

    return { isValid: true };
  }

  async _processForm(formData) {
    const { email, password, name } = formData;
    
    UIUtils.showButtonLoading(this.submitButton, 'Registrando...');
    
    try {
      const result = await this.authService.register(email, password, name);
      
      if (result.success) {
        this.showToast('¡Registro exitoso! Revisa tu email para verificar tu cuenta.', 'success');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);
      } else {
        throw new Error(result.error);
      }
    } finally {
      UIUtils.hideButtonLoading(this.submitButton);
    }
  }
}