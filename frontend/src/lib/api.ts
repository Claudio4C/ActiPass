import axios, { type AxiosInstance, type AxiosResponse, type AxiosError } from 'axios'
import { createErrorFromResponse, createNetworkError, ApiError } from './errors'

// Configuration de base de l'API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

// Interface pour les réponses d'erreur du backend
interface ApiErrorResponse {
  message: string
  error?: string
  statusCode?: number
  code?: string
  details?: unknown
}

// Interface pour les réponses de succès
interface ApiResponse<T = unknown> {
  data: T
  message?: string
}

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      withCredentials: true, // Important pour les cookies HttpOnly
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Intercepteur pour les requêtes
    this.client.interceptors.request.use(
      (config) => {
        // Ajouter des headers si nécessaire
        return config
      },
      (error) => {
        return Promise.reject(error)
      },
    )

    // Intercepteur pour les réponses
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response
      },
      (error: AxiosError<ApiErrorResponse>) => {
        // Gestion centralisée des erreurs avec types personnalisés
        if (error.response) {
          // Erreur du serveur (4xx, 5xx)
          const apiError = createErrorFromResponse(
            error.response.status,
            error.response.data,
          )
          // console.error('API Error:', apiError.message, apiError)
          throw apiError
        } else if (error.request) {
          // Pas de réponse du serveur
          const networkError = createNetworkError(error)
          // console.error('Network Error:', networkError.message)
          throw networkError
        } else {
          // Autre erreur
          // console.error('Request Error:', error.message)
          throw new ApiError('Une erreur est survenue', 0, 'UNKNOWN_ERROR')
        }
      },
    )
  }

  // Méthodes HTTP
  async get<T = unknown>(url: string, params?: Record<string, unknown>): Promise<T> {
    const response = await this.client.get<T>(url, { params })
    return response.data
  }

  async post<T = unknown>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.post<T>(url, data)
    return response.data
  }

  async put<T = unknown>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.put<T>(url, data)
    return response.data
  }

  async delete<T = unknown>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url)
    return response.data
  }

  // Méthode pour obtenir l'instance axios (si besoin)
  getInstance(): AxiosInstance {
    return this.client
  }
}

// Instance singleton
export const apiClient = new ApiClient()

// Alias pour faciliter l'import
export const api = apiClient

// Export des types
export type { ApiErrorResponse, ApiResponse }
