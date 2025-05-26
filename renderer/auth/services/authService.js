export class AuthService {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  async login(email, password) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        throw this._handleAuthError(error);
      }
      
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async register(email, password, fullName) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) {
        throw this._handleAuthError(error);
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async resetPassword(email) {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password.html'
      });

      if (error) {
        throw this._handleAuthError(error);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  _handleAuthError(error) {
    const errorMessages = {
      'Invalid login credentials': 'Credenciales inválidas. Verifica tu email y contraseña.',
      'already registered': 'Este correo electrónico ya está registrado. Por favor, inicia sesión.',
      'Email not found': 'No existe una cuenta con este correo electrónico.',
    };

    for (const [key, message] of Object.entries(errorMessages)) {
      if (error.message.includes(key)) {
        return new Error(message);
      }
    }

    return error;
  }
}