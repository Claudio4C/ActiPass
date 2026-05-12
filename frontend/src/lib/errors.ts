// Types d'erreurs personnalisées
export class ApiError extends Error {
  public statusCode: number
  public code: string
  public details?: any

  constructor(message: string, statusCode: number, code?: string, details?: any) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code || 'UNKNOWN_ERROR'
    this.details = details
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Erreur de connexion') {
    super(message)
    this.name = 'NetworkError'
  }
}

export class ValidationError extends Error {
  public field?: string

  constructor(message: string, field?: string) {
    super(message)
    this.name = 'ValidationError'
    this.field = field
  }
}

// Codes d'erreur constants
export const ERROR_CODES = {
  // Erreurs d'authentification
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  // Erreurs de validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  WEAK_PASSWORD: 'WEAK_PASSWORD',

  // Erreurs réseau
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',

  // Erreurs serveur
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // Erreurs inconnues
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

// Messages d'erreur user-friendly
export const ERROR_MESSAGES = {
  [ERROR_CODES.UNAUTHORIZED]: 'Vous devez être connecté pour accéder à cette page',
  [ERROR_CODES.FORBIDDEN]: 'Vous n\'avez pas les permissions nécessaires',
  [ERROR_CODES.TOKEN_EXPIRED]: 'Votre session a expiré, veuillez vous reconnecter',
  [ERROR_CODES.INVALID_CREDENTIALS]: 'Email ou mot de passe incorrect',
  [ERROR_CODES.VALIDATION_ERROR]: 'Les données saisies ne sont pas valides',
  [ERROR_CODES.EMAIL_ALREADY_EXISTS]: 'Cette adresse email est déjà utilisée',
  [ERROR_CODES.WEAK_PASSWORD]: 'Le mot de passe ne respecte pas les critères de sécurité',
  [ERROR_CODES.NETWORK_ERROR]: 'Impossible de joindre le serveur',
  [ERROR_CODES.TIMEOUT]: 'La requête a pris trop de temps',
  [ERROR_CODES.INTERNAL_ERROR]: 'Une erreur interne s\'est produite',
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 'Le service est temporairement indisponible',
  [ERROR_CODES.UNKNOWN_ERROR]: 'Une erreur inattendue s\'est produite',
} as const

// Fonction pour créer une erreur à partir d'une réponse HTTP
export function createErrorFromResponse(statusCode: number, data: any): ApiError {
  const raw = data?.message ?? data?.error ?? ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR]
  const message = Array.isArray(raw) ? raw.join(' ') : String(raw)

  switch (statusCode) {
    case 400:
      return new ApiError(message, 400, 'BAD_REQUEST', data)
    case 401:
      return new ApiError(message, 401, ERROR_CODES.UNAUTHORIZED, data)
    case 403:
      return new ApiError(message, 403, ERROR_CODES.FORBIDDEN, data)
    case 404:
      return new ApiError('Ressource non trouvée', 404, 'NOT_FOUND', data)
    case 409:
      return new ApiError(message, 409, 'CONFLICT', data)
    case 422:
      return new ApiError(message, 422, ERROR_CODES.VALIDATION_ERROR, data)
    case 429:
      return new ApiError('Trop de tentatives, veuillez patienter', 429, 'RATE_LIMITED', data)
    case 500:
      return new ApiError(message, 500, ERROR_CODES.INTERNAL_ERROR, data)
    case 503:
      return new ApiError(message, 503, ERROR_CODES.SERVICE_UNAVAILABLE, data)
    default:
      return new ApiError(message, statusCode, ERROR_CODES.UNKNOWN_ERROR, data)
  }
}

// Fonction pour créer une erreur réseau
export function createNetworkError(error: any): NetworkError {
  if (error.code === 'ECONNABORTED') {
    return new NetworkError('La requête a pris trop de temps')
  }
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return new NetworkError('Impossible de joindre le serveur')
  }
  return new NetworkError('Erreur de connexion')
}

// Fonction pour obtenir un message d'erreur user-friendly
export function getErrorMessage(error: Error): string {
  if (error instanceof ApiError) {
    return (
      error.message ||
      ERROR_MESSAGES[error.code as keyof typeof ERROR_MESSAGES] ||
      ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR]
    )
  }
  if (error instanceof NetworkError) {
    return error.message
  }
  if (error instanceof ValidationError) {
    return error.message
  }
  return ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR]
}

// Fonction pour vérifier si une erreur est récupérable
export function isRecoverableError(error: Error): boolean {
  if (error instanceof ApiError) {
    return error.statusCode >= 500 || error.statusCode === 429
  }
  if (error instanceof NetworkError) {
    return true
  }
  return false
}
