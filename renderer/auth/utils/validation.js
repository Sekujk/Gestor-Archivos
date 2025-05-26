export class ValidationUtils {
  static validateEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !email.trim()) {
      return { isValid: false, message: 'El email es requerido.' };
    }
    if (!emailPattern.test(email)) {
      return { isValid: false, message: 'Por favor, introduce un email válido.' };
    }
    return { isValid: true };
  }

  static validatePassword(password, minLength = 6) {
    if (!password || !password.trim()) {
      return { isValid: false, message: 'La contraseña es requerida.' };
    }
    if (password.length < minLength) {
      return { isValid: false, message: `La contraseña debe tener al menos ${minLength} caracteres.` };
    }
    return { isValid: true };
  }

  static validateName(name) {
    if (!name || !name.trim()) {
      return { isValid: false, message: 'El nombre es requerido.' };
    }
    if (name.trim().length < 2) {
      return { isValid: false, message: 'El nombre debe tener al menos 2 caracteres.' };
    }
    return { isValid: true };
  }
}