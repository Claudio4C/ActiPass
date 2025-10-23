import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, ArrowRight, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import Button from '../shared/components/Button'
import Input from '../shared/components/Input'
import { api } from '../lib/api'

interface ForgotPasswordResponse {
    message: string
}

const ForgotPassword: React.FC = () => {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email) {
            setError('Veuillez saisir votre adresse email')
            return
        }

        try {
            setIsLoading(true)
            setError('')

            const response = await api.post<ForgotPasswordResponse>('/auth/forgot-password', {
                email
            })

            setIsSuccess(true)
        } catch (error: any) {
            console.error('Forgot password failed:', error)
            setError('Une erreur est survenue. Veuillez réessayer.')
        } finally {
            setIsLoading(false)
        }
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    {/* Success Header */}
                    <div className="text-center">
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center">
                                <CheckCircle className="w-16 h-16 text-green-500" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            Email envoyé !
                        </h2>
                        <p className="text-gray-600">
                            Vérifiez votre boîte de réception
                        </p>
                    </div>

                    {/* Success Card */}
                    <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 text-center">
                        <h3 className="text-lg font-semibold text-green-800 mb-4">
                            Instructions envoyées
                        </h3>
                        <p className="text-green-700 mb-6">
                            Si un compte existe avec l'adresse <strong>{email}</strong>,
                            vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.
                        </p>

                        <div className="space-y-4">
                            <div className="bg-white rounded-lg p-4 border border-green-200">
                                <h4 className="font-semibold text-gray-900 mb-2">📧 Prochaines étapes :</h4>
                                <ul className="text-sm text-gray-700 space-y-1 text-left">
                                    <li>• Vérifiez votre boîte de réception</li>
                                    <li>• Consultez aussi vos spams</li>
                                    <li>• Cliquez sur le lien dans l'email</li>
                                    <li>• Créez un nouveau mot de passe</li>
                                </ul>
                            </div>

                            <div className="space-y-3">
                                <Button
                                    onClick={() => navigate('/login')}
                                    variant="primary"
                                    size="lg"
                                    icon={ArrowRight}
                                    iconPosition="right"
                                    className="w-full"
                                >
                                    Retour à la connexion
                                </Button>

                                <Button
                                    onClick={() => {
                                        setIsSuccess(false)
                                        setEmail('')
                                    }}
                                    variant="secondary"
                                    size="lg"
                                    className="w-full"
                                >
                                    Essayer avec un autre email
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Help Section */}
                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            Pas reçu l'email ?{' '}
                            <button
                                onClick={() => {
                                    setIsSuccess(false)
                                    setEmail('')
                                }}
                                className="font-medium text-blue-600 hover:text-blue-500 hover:underline"
                            >
                                Réessayer
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center">
                            <Mail className="w-16 h-16 text-blue-500" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        Mot de passe oublié ?
                    </h2>
                    <p className="text-gray-600">
                        Pas de souci, on va vous aider à le récupérer
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        {/* Email Input */}
                        <div>
                            <Input
                                label="Adresse email"
                                type="email"
                                name="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="votre@email.com"
                                icon={Mail}
                                required
                                className="w-full"
                            />
                            <p className="mt-2 text-sm text-gray-600">
                                Saisissez l'adresse email associée à votre compte
                            </p>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            icon={ArrowRight}
                            iconPosition="right"
                            disabled={isLoading || !email}
                            className="w-full"
                        >
                            {isLoading ? 'Envoi en cours...' : 'Envoyer les instructions'}
                        </Button>
                    </form>

                    {/* Back to Login */}
                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Retour à la connexion
                        </Link>
                    </div>
                </div>

                {/* Help Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                    <h3 className="font-semibold text-blue-900 mb-3">💡 Besoin d'aide ?</h3>
                    <div className="space-y-2 text-sm text-blue-800">
                        <p>• Vérifiez que l'email est correct</p>
                        <p>• Consultez votre dossier spam</p>
                        <p>• Le lien expire dans 24h</p>
                        <p>• Contactez le support si nécessaire</p>
                    </div>
                </div>

                {/* Security Note */}
                <div className="text-center">
                    <p className="text-xs text-gray-500">
                        🔒 Vos données sont protégées et ne seront jamais partagées
                    </p>
                </div>
            </div>
        </div>
    )
}

export default ForgotPassword
