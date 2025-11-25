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

// Cache simple pour réduire les requêtes répétées
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live en millisecondes
}

class ApiClient {
  private client: AxiosInstance
  private cache: Map<string, CacheEntry<unknown>> = new Map()
  private readonly DEFAULT_TTL = 30000 // 30 secondes par défaut

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

    // Nettoyer le cache toutes les minutes
    setInterval(() => this.cleanCache(), 60000)
  }

  private cleanCache() {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  private getCacheKey(url: string, params?: Record<string, unknown>): string {
    const paramsStr = params ? JSON.stringify(params) : ''
    return `${url}${paramsStr}`
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) {return null}

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  private setCache<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL,
    })
  }

  // Invalider le cache pour une URL spécifique
  invalidateCache(urlPattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(urlPattern)) {
        this.cache.delete(key)
      }
    }
  }

  private setupInterceptors() {
    // Intercepteur pour les requêtes
    // Les tokens sont stockés dans des cookies HttpOnly, donc pas besoin d'ajouter manuellement
    this.client.interceptors.request.use(
      (config) => {
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
      async (error: AxiosError<ApiErrorResponse>) => {
        // Gestion centralisée des erreurs avec types personnalisés
        if (error.response) {
          // Gestion des erreurs 401 (Unauthorized)
          if (error.response.status === 401) {
            // Nettoyer le localStorage
            localStorage.removeItem('user')

            // Vérifier la route actuelle pour rediriger vers la bonne page de login
            const currentPath = window.location.pathname
            let redirectPath = '/login'

            if (currentPath.startsWith('/superadmin')) {
              redirectPath = '/superadmin/login'
            } else if (currentPath.startsWith('/admin')) {
              redirectPath = '/admin/login'
            }

            // Rediriger vers la page de login appropriée
            // Utiliser window.location.href pour forcer un rechargement complet
            window.location.href = redirectPath
            // Ne pas lancer l'erreur pour éviter les logs inutiles
            return Promise.reject(new Error('Session expirée'))
          }

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
  async get<T = unknown>(url: string, params?: Record<string, unknown>, options?: { useCache?: boolean; cacheTTL?: number }): Promise<T> {
    const cacheKey = this.getCacheKey(url, params)

    // Vérifier le cache si activé (par défaut activé pour GET)
    if (options?.useCache !== false) {
      const cached = this.getFromCache<T>(cacheKey)
      if (cached !== null) {
        return cached
      }
    }

    const response = await this.client.get<T>(url, { params })
    const data = response.data

    // Mettre en cache si activé
    if (options?.useCache !== false) {
      this.setCache(cacheKey, data, options?.cacheTTL)
    }

    return data
  }

  async post<T = unknown>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.post<T>(url, data)
    // Invalider le cache pour les routes liées (si nécessaire)
    // Par exemple, si on crée un membre, invalider le cache des membres
    if (url.includes('/members') || url.includes('/organisations')) {
      this.invalidateCache(url.split('/').slice(0, -1).join('/'))
    }
    return response.data
  }

  async put<T = unknown>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.put<T>(url, data)
    // Invalider le cache pour les routes liées
    this.invalidateCache(url)
    return response.data
  }

  async delete<T = unknown>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url)
    // Invalider le cache pour les routes liées
    this.invalidateCache(url)
    return response.data
  }

  // Méthode pour obtenir l'instance axios (si besoin)
  getInstance(): AxiosInstance {
    return this.client
  }

  // Méthode publique pour invalider le cache (utile après des modifications)
  clearCache(urlPattern?: string): void {
    if (urlPattern) {
      this.invalidateCache(urlPattern)
    } else {
      this.cache.clear()
    }
  }
}

// Instance singleton
export const apiClient = new ApiClient()

// Alias pour faciliter l'import
export const api = apiClient

// Export des types
export type { ApiErrorResponse, ApiResponse }
