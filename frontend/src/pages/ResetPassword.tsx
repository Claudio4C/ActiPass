import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { Lock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import Button from '../shared/components/Button'
import Input from '../shared/components/Input'
import { api } from '../lib/api'

interface ResetPasswordResponse {
    message: string
}

const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const token = searchParams.get('token')

    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    })
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!token) {
            navigate('/forgot-password')
        }
    }, [token, navigate])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const validateForm = () => {
        if (!formData.newPassword) {
            setError('Veuillez saisir un nouveau mot de passe')
            return false
        }

        // Validation RGPD stricte
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{12,}$/

        if (formData.newPassword.length < 12) {
            setError('Le mot de passe doit contenir au moins 12 caractères')
            return false
        }

        if (!passwordRegex.test(formData.newPassword)) {
            setError('Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial')
            return false
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas')
            return false
        }

        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) return

        try {
            setIsLoading(true)
            setError('')

            await api.post<ResetPasswordResponse>('/auth/reset-password', {
                token: token,
                newPassword: formData.newPassword,
                confirmPassword: formData.confirmPassword
            })

            setIsSuccess(true)
        } catch (error: any) {
            console.error('Reset password failed:', error)
            if (error.response?.status === 400) {
                setError('Ce lien de réinitialisation a expiré ou est invalide')
            } else {
                setError('Une erreur est survenue. Veuillez réessayer.')
            }
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
                            Mot de passe réinitialisé !
                        </h2>
                        <p className="text-gray-600">
                            Votre mot de passe a été mis à jour avec succès
                        </p>
                    </div>

                    {/* Success Card */}
                    <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 text-center">
                        <h3 className="text-lg font-semibold text-green-800 mb-4">
                            Réinitialisation réussie
                        </h3>
                        <p className="text-green-700 mb-6">
                            Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
                        </p>

                        <div className="space-y-4">
                            <div className="bg-white rounded-lg p-4 border border-green-200">
                                <h4 className="font-semibold text-gray-900 mb-2">✅ Sécurité renforcée :</h4>
                                <ul className="text-sm text-gray-700 space-y-1 text-left">
                                    <li>• Mot de passe mis à jour</li>
                                    <li>• Session sécurisée</li>
                                    <li>• Connexion recommandée</li>
                                </ul>
                            </div>

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
                        </div>
                    </div>

                    {/* Help Section */}
                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            Des questions ?{' '}
                            <Link
                                to="/contact"
                                className="font-medium text-blue-600 hover:text-blue-500 hover:underline"
                            >
                                Contactez notre support
                            </Link>
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
                            <Lock className="w-16 h-16 text-blue-500" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        Nouveau mot de passe
                    </h2>
                    <p className="text-gray-600">
                        Choisissez un mot de passe sécurisé
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

                        {/* New Password */}
                        <div>
                            <Input
                                label="Nouveau mot de passe"
                                type="password"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleInputChange}
                                placeholder="••••••••"
                                icon={Lock}
                                className="w-full"
                            />
                            <p className="mt-2 text-sm text-gray-600">
                                Minimum 12 caractères, majuscule, minuscule, chiffre, caractère spécial
                            </p>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <Input
                                label="Confirmer le mot de passe"
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                placeholder="••••••••"
                                icon={Lock}
                                className="w-full"
                            />
                        </div>

                        {/* Password Requirements */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-2 text-sm">Exigences de sécurité RGPD :</h4>
                            <ul className="text-xs text-gray-600 space-y-1">
                                <li className={`flex items-center ${formData.newPassword.length >= 12 ? 'text-green-600' : ''}`}>
                                    <span className="mr-2">{formData.newPassword.length >= 12 ? '✓' : '○'}</span>
                                    Au moins 12 caractères
                                </li>
                                <li className={`flex items-center ${/[A-Z]/.test(formData.newPassword) ? 'text-green-600' : ''}`}>
                                    <span className="mr-2">{/[A-Z]/.test(formData.newPassword) ? '✓' : '○'}</span>
                                    Une majuscule
                                </li>
                                <li className={`flex items-center ${/[a-z]/.test(formData.newPassword) ? 'text-green-600' : ''}`}>
                                    <span className="mr-2">{/[a-z]/.test(formData.newPassword) ? '✓' : '○'}</span>
                                    Une minuscule
                                </li>
                                <li className={`flex items-center ${/\d/.test(formData.newPassword) ? 'text-green-600' : ''}`}>
                                    <span className="mr-2">{/\d/.test(formData.newPassword) ? '✓' : '○'}</span>
                                    Un chiffre
                                </li>
                                <li className={`flex items-center ${/[^\da-zA-Z]/.test(formData.newPassword) ? 'text-green-600' : ''}`}>
                                    <span className="mr-2">{/[^\da-zA-Z]/.test(formData.newPassword) ? '✓' : '○'}</span>
                                    Un caractère spécial
                                </li>
                            </ul>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            icon={ArrowRight}
                            iconPosition="right"
                            disabled={isLoading || !formData.newPassword || !formData.confirmPassword}
                            className="w-full"
                        >
                            {isLoading ? 'Mise à jour...' : 'Réinitialiser le mot de passe'}
                        </Button>
                    </form>
                </div>

                {/* Security Note */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                    <h3 className="font-semibold text-blue-900 mb-3">🔒 Sécurité</h3>
                    <div className="space-y-2 text-sm text-blue-800">
                        <p>• Ce lien expire dans 24h</p>
                        <p>• Utilisez un mot de passe unique</p>
                        <p>• Ne partagez jamais vos identifiants</p>
                        <p>• Déconnectez-vous après utilisation</p>
                    </div>
                </div>

                {/* Help */}
                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        Problème ?{' '}
                        <Link
                            to="/contact"
                            className="font-medium text-blue-600 hover:text-blue-500 hover:underline"
                        >
                            Contactez le support
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default ResetPassword
