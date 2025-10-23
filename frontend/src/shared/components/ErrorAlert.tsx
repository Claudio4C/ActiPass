import React from 'react'
import { AlertCircle, X, RefreshCw, Info } from 'lucide-react'
import { type AppMode } from '../../types'

interface ErrorAlertProps {
  message: string
  type?: 'error' | 'warning' | 'info'
  code?: string
  field?: string
  isRecoverable?: boolean
  onClose?: () => void
  onRetry?: () => void
  mode?: AppMode
  className?: string
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({
  message,
  type = 'error',
  code,
  field,
  isRecoverable = false,
  onClose,
  onRetry,
  mode = 'club',
  className = ''
}) => {
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="w-5 h-5" />
      case 'info':
        return <Info className="w-5 h-5" />
      default:
        return <AlertCircle className="w-5 h-5" />
    }
  }

  const getColors = () => {
    const baseColors = mode === 'club' 
      ? {
          error: 'bg-red-50 border-red-200 text-red-800',
          warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          info: 'bg-blue-50 border-blue-200 text-blue-800'
        }
      : {
          error: 'bg-red-50 border-red-200 text-red-800',
          warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          info: 'bg-purple-50 border-purple-200 text-purple-800'
        }

    return baseColors[type]
  }

  const getIconColors = () => {
    const baseColors = mode === 'club'
      ? {
          error: 'text-red-400',
          warning: 'text-yellow-400',
          info: 'text-blue-400'
        }
      : {
          error: 'text-red-400',
          warning: 'text-yellow-400',
          info: 'text-purple-400'
        }

    return baseColors[type]
  }

  return (
    <div className={`rounded-lg border p-4 ${getColors()} ${className}`}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${getIconColors()}`}>
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">
                {type === 'error' && 'Erreur'}
                {type === 'warning' && 'Attention'}
                {type === 'info' && 'Information'}
                {field && ` - ${field}`}
              </h3>
              <p className="mt-1 text-sm">
                {message}
              </p>
              {code && (
                <p className="mt-1 text-xs opacity-75">
                  Code: {code}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {isRecoverable && onRetry && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-white bg-opacity-50 hover:bg-opacity-75 transition-colors"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Réessayer
                </button>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  className="inline-flex items-center p-1 rounded-md hover:bg-white hover:bg-opacity-25 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ErrorAlert
