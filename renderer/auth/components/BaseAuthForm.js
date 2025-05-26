import { AuthService } from '../services/authService.js';

export class BaseAuthForm {
  constructor(formId, supabaseClient, showToast) {
    this.formId = formId;
    this.form = document.getElementById(formId);
    this.showToast = showToast;
    this.authService = new AuthService(supabaseClient);
    this.isSubmitting = false;

    
    this._init();
  }

  _init() {
    if (!this.form) {
      console.error(`Form with ID "${this.formId}" not found`);
      return;
    }

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this._handleSubmit();
    });
  }

  async _handleSubmit() {
    if (this.isSubmitting) return;
    
    this.isSubmitting = true;
    
    try {
      const formData = this._getFormData();
      const validation = this._validateForm(formData);
      
      if (!validation.isValid) {
        this.showToast(validation.message, 'error');
        return;
      }

      await this._processForm(formData);
    } catch (error) {
      this.showToast(error.message, 'error');
    } finally {
      this.isSubmitting = false;
    }
  }

  _getFormData() {
    const formData = new FormData(this.form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
      data[key] = value.trim();
    }
    
    return data;
  }

  // Métodos que deben ser implementados por las clases hijas
  _validateForm(formData) {
    throw new Error('_validateForm must be implemented by child class');
  }

  async _processForm(formData) {
    throw new Error('_processForm must be implemented by child class');
  }
}