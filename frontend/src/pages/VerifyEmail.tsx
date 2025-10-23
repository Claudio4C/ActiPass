import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { CheckCircle, Mail, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react'
import Button from '../shared/components/Button'
import { api } from '../lib/api'

interface VerifyEmailResponse {
    message: string
}

const VerifyEmail: React.FC = () => {
    const { userId, token } = useParams<{ userId: string; token: string }>()
    const navigate = useNavigate()
    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading')
    const [message, setMessage] = useState('')
    const [isResending, setIsResending] = useState(false)

    useEffect(() => {
        if (userId && token) {
            verifyEmail()
        } else {
            setStatus('error')
            setMessage('Lien de vérification invalide')
        }
    }, [userId, token])

    const verifyEmail = async () => {
        try {
            setStatus('loading')
            console.log('Verifying email with:', { userId, token })
            const response = await api.get<VerifyEmailResponse>(`/auth/verify-email/${userId}/${token}`)
            console.log('Verification response:', response)
            setStatus('success')
            setMessage(response.message)
        } catch (error: any) {
            console.error('Email verification failed:', error)
            console.error('Error details:', {
                message: error.message,
                statusCode: error.statusCode,
                response: error.response
            })

            if (error.statusCode === 400) {
                // Vérifier si c'est un lien déjà utilisé ou vraiment expiré
                if (error.message.includes('bien été vérifié') || error.message.includes('already verified')) {
                    setStatus('success')
                    setMessage('Votre email est déjà vérifié. Vous pouvez vous connecter.')
                } else {
                    setStatus('expired')
                    setMessage('Ce lien de vérification a expiré ou est invalide')
                }
            } else {
                setStatus('error')
                setMessage('Une erreur est survenue lors de la vérification')
            }
        }
    }

    const resendVerification = async () => {
        try {
            setIsResending(true)
            // Ici on devrait avoir l'email de l'utilisateur, mais pour simplifier on redirige vers la page de connexion
            navigate('/login?message=resend-verification')
        } catch (error) {
            console.error('Resend verification failed:', error)
        } finally {
            setIsResending(false)
        }
    }

    const getStatusIcon = () => {
        switch (status) {
            case 'success':
                return <CheckCircle className="w-16 h-16 text-green-500" />
            case 'error':
            case 'expired':
                return <AlertCircle className="w-16 h-16 text-red-500" />
            default:
                return <RefreshCw className="w-16 h-16 text-blue-500 animate-spin" />
        }
    }

    const getStatusColor = () => {
        switch (status) {
            case 'success':
                return 'text-green-600'
            case 'error':
            case 'expired':
                return 'text-red-600'
            default:
                return 'text-blue-600'
        }
    }

    const getStatusBgColor = () => {
        switch (status) {
            case 'success':
                return 'bg-green-50 border-green-200'
            case 'error':
            case 'expired':
                return 'bg-red-50 border-red-200'
            default:
                return 'bg-blue-50 border-blue-200'
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                            {getStatusIcon()}
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        {status === 'success' && 'Email vérifié !'}
                        {status === 'error' && 'Erreur de vérification'}
                        {status === 'expired' && 'Lien expiré'}
                        {status === 'loading' && 'Vérification en cours...'}
                    </h2>
                    <p className="text-gray-600">
                        {status === 'success' && 'Votre compte a été vérifié avec succès'}
                        {status === 'error' && 'Une erreur est survenue'}
                        {status === 'expired' && 'Ce lien de vérification a expiré'}
                        {status === 'loading' && 'Veuillez patienter...'}
                    </p>
                </div>

                {/* Status Card */}
                <div className={`rounded-2xl border-2 p-8 text-center ${getStatusBgColor()}`}>
                    <div className="mb-4">
                        {getStatusIcon()}
                    </div>
                    <h3 className={`text-lg font-semibold mb-2 ${getStatusColor()}`}>
                        {status === 'success' && 'Félicitations !'}
                        {status === 'error' && 'Erreur'}
                        {status === 'expired' && 'Lien expiré'}
                        {status === 'loading' && 'Vérification...'}
                    </h3>
                    <p className="text-gray-700 mb-6">
                        {message}
                    </p>

                    {/* Action Buttons */}
                    <div className="space-y-4">
                        {status === 'success' && (
                            <div className="space-y-3">
                                <Button
                                    onClick={() => navigate('/login')}
                                    variant="primary"
                                    size="lg"
                                    icon={ArrowRight}
                                    iconPosition="right"
                                    className="w-full"
                                >
                                    Se connecter maintenant
                                </Button>
                                <p className="text-sm text-gray-600">
                                    Vous pouvez maintenant accéder à votre compte
                                </p>
                            </div>
                        )}

                        {status === 'expired' && (
                            <div className="space-y-3">
                                <Button
                                    onClick={resendVerification}
                                    variant="primary"
                                    size="lg"
                                    icon={Mail}
                                    iconPosition="right"
                                    disabled={isResending}
                                    className="w-full"
                                >
                                    {isResending ? 'Envoi...' : 'Renvoyer l\'email de vérification'}
                                </Button>
                                <Button
                                    onClick={() => navigate('/login')}
                                    variant="secondary"
                                    size="lg"
                                    className="w-full"
                                >
                                    Retour à la connexion
                                </Button>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="space-y-3">
                                <Button
                                    onClick={() => navigate('/login')}
                                    variant="primary"
                                    size="lg"
                                    className="w-full"
                                >
                                    Retour à la connexion
                                </Button>
                                <Button
                                    onClick={() => navigate('/register')}
                                    variant="secondary"
                                    size="lg"
                                    className="w-full"
                                >
                                    Créer un nouveau compte
                                </Button>
                            </div>
                        )}

                        {status === 'loading' && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-center space-x-2 text-blue-600">
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    <span>Vérification en cours...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Help Section */}
                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        Besoin d'aide ?{' '}
                        <Link
                            to="/contact"
                            className="font-medium text-blue-600 hover:text-blue-500 hover:underline"
                        >
                            Contactez notre support
                        </Link>
                    </p>
                </div>

                {/* Features Preview */}
                {status === 'success' && (
                    <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                            🎉 Bienvenue sur Ikivio !
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-gray-700">Gestion des membres</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-gray-700">Planning & Réservations</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-gray-700">Communication</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-gray-700">Sécurité RGPD</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default VerifyEmail
