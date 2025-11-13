import { apiClient } from '../lib/api'

// Types pour l'authentification
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  confirmPassword: string
  firstname: string
  lastname: string
  username: string
  gender: 'male' | 'female' | 'prefer_not_to_say'
  phone?: string
  birthdate?: string
  address?: string
  city?: string
  country?: string
  postalCode?: string
  bio?: string
}

export interface User {
  id: string
  email: string
  firstname: string
  lastname: string
  username: string
  gender: 'male' | 'female' | 'prefer_not_to_say'
  phone?: string
  birthdate?: string
  address?: string
  city?: string
  country?: string
  postalCode?: string
  avatar?: string
  bio?: string
  isEmailVerified: boolean
  is_super_admin?: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface RegisterResponse {
  message: string
  user: User
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
}

class AuthService {
  private readonly basePath = '/auth'

  /**
   * Connexion utilisateur
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(`${this.basePath}/login`, credentials)
      return response
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  /**
   * Inscription utilisateur
   */
  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await apiClient.post<RegisterResponse>(`${this.basePath}/register`, userData)
      return response
    } catch (error) {
      console.error('Register error:', error)
      throw error
    }
  }

  /**
   * Déconnexion utilisateur
   */
  async logout(): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>(`${this.basePath}/logout`)
      return response
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  /**
   * Rafraîchir le token d'accès
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      const response = await apiClient.post<RefreshTokenResponse>(`${this.basePath}/refresh`, {
        refreshToken,
      })
      return response
    } catch (error) {
      console.error('Refresh token error:', error)
      throw error
    }
  }

  /**
   * Obtenir le profil utilisateur actuel
   */
  async getCurrentUser(): Promise<{ user: User }> {
    try {
      const response = await apiClient.get<{ user: User }>(`${this.basePath}/me`)
      return response
    } catch (error) {
      console.error('Get current user error:', error)
      throw error
    }
  }

  /**
   * Mot de passe oublié
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>(`${this.basePath}/forgot-password`, {
        email,
      })
      return response
    } catch (error) {
      console.error('Forgot password error:', error)
      throw error
    }
  }

  /**
   * Réinitialiser le mot de passe
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>(`${this.basePath}/reset-password`, {
        token,
        newPassword,
      })
      return response
    } catch (error) {
      console.error('Reset password error:', error)
      throw error
    }
  }

  /**
   * Vérifier l'email
   */
  async verifyEmail(userId: string, token: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.get<{ message: string }>(`${this.basePath}/verify-email/${userId}/${token}`)
      return response
    } catch (error) {
      console.error('Verify email error:', error)
      throw error
    }
  }

  /**
   * Renvoyer l'email de vérification
   */
  async resendVerification(email: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>(`${this.basePath}/resend-verification?email=${email}`)
      return response
    } catch (error) {
      console.error('Resend verification error:', error)
      throw error
    }
  }
}

// Export de l'instance singleton
export const authService = new AuthService()
