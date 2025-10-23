import { useState, useCallback } from 'react'
import { ApiError, NetworkError, ValidationError, getErrorMessage, isRecoverableError } from '../lib/errors'

interface ErrorState {
  message: string
  type: 'error' | 'warning' | 'info'
  code?: string
  field?: string
  isRecoverable: boolean
}

export function useErrorHandler() {
  const [error, setError] = useState<ErrorState | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleError = useCallback((error: Error) => {
    console.error('Error handled:', error)

    const errorState: ErrorState = {
      message: getErrorMessage(error),
      type: 'error',
      isRecoverable: isRecoverableError(error),
    }

    if (error instanceof ApiError) {
      errorState.code = error.code
      errorState.type = error.statusCode >= 500 ? 'error' : 'warning'
    }

    if (error instanceof ValidationError) {
      errorState.field = error.field
      errorState.type = 'warning'
    }

    if (error instanceof NetworkError) {
      errorState.type = 'error'
    }

    setError(errorState)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const handleAsync = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options?: {
      onSuccess?: (data: T) => void
      onError?: (error: Error) => void
      showLoading?: boolean
    },
  ): Promise<T | null> => {
    const { onSuccess, onError, showLoading = true } = options || {}

    try {
      if (showLoading) {
        setIsLoading(true)
      }
      clearError()

      const result = await asyncFn()

      if (onSuccess) {
        onSuccess(result)
      }

      return result
    } catch (error) {
      const err = error as Error

      if (onError) {
        onError(err)
      } else {
        handleError(err)
      }

      return null
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }, [handleError, clearError])

  return {
    error,
    isLoading,
    handleError,
    clearError,
    handleAsync,
  }
}
