import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Phone, Users, ArrowRight, Calendar, MessageSquare, Shield, Zap, CheckCircle } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import Button from '../../../shared/components/Button'
import Input from '../../../shared/components/Input'
import Checkbox from '../../../shared/components/Checkbox'
import Select from '../../../shared/components/Select'
import { useFormValidation } from '../../../hooks/useFormValidation'
import { registerSchema, type RegisterFormData } from '../../../shared/schemas/auth'

const Register: React.FC = () => {
    const { register, isLoading } = useAuth()
    const navigate = useNavigate()
    const [isSuccess, setIsSuccess] = useState(false)

    const {
        values: formData,
        errors,
        setValue,
        validate,
        handleBlur,
        handleFocus,
        getFieldError,
    } = useFormValidation<RegisterFormData>({
        schema: registerSchema,
        initialValues: {
            firstname: '',
            lastname: '',
            email: '',
            password: '',
            confirmPassword: '',
            username: '',
            phone: undefined,
            mode: 'club',
            acceptTerms: false,
            gender: 'prefer_not_to_say',
            birthdate: '',
            address: '',
            city: '',
            country: 'France',
            postalCode: '',
            bio: '',
        },
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target
        setValue(name as keyof RegisterFormData, type === 'checkbox' ? checked : value)
    }

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target
        setValue(name as keyof RegisterFormData, value)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        console.log('Form submitted, validating...')

        if (!validate()) {
            console.log('Validation failed:', errors)
            return
        }

        console.log('Validation passed, submitting form:', formData)

        try {
            await register(formData)
            console.log('Registration successful')
            setIsSuccess(true)
        } catch (error) {
            console.error('Registration failed:', error)
            // L'erreur est déjà gérée par le contexte d'authentification
        }
    }

    const features = [
        {
            icon: Users,
            title: 'Gestion des membres',
            description: 'Inscriptions, cotisations, documents administratifs',
        },
        {
            icon: Calendar,
            title: 'Planning & Réservations',
            description: 'Créneaux, événements, gestion des disponibilités',
        },
        {
            icon: MessageSquare,
            title: 'Communication',
            description: 'Messagerie, notifications, newsletters',
        },
        {
            icon: Shield,
            title: 'Sécurité des données',
            description: 'Protection RGPD et sauvegarde automatique',
        },
    ]

    // Page de succès après inscription
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
                            Inscription réussie !
                        </h2>
                        <p className="text-gray-600">
                            Vérifiez votre email pour activer votre compte
                        </p>
                    </div>

                    {/* Success Card */}
                    <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 text-center">
                        <h3 className="text-lg font-semibold text-green-800 mb-4">
                            Email de vérification envoyé
                        </h3>
                        <p className="text-green-700 mb-6">
                            Nous avons envoyé un email de vérification à <strong>{formData.email}</strong>.
                            Cliquez sur le lien dans l'email pour activer votre compte.
                        </p>

                        <div className="space-y-4">
                            <div className="bg-white rounded-lg p-4 border border-green-200">
                                <h4 className="font-semibold text-gray-900 mb-2">📧 Prochaines étapes :</h4>
                                <ul className="text-sm text-gray-700 space-y-1 text-left">
                                    <li>• Vérifiez votre boîte de réception</li>
                                    <li>• Consultez aussi vos spams</li>
                                    <li>• Cliquez sur le lien de vérification</li>
                                    <li>• Connectez-vous à votre compte</li>
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
                                    Aller à la connexion
                                </Button>

                                <Button
                                    onClick={() => navigate('/resend-verification')}
                                    variant="secondary"
                                    size="lg"
                                    className="w-full"
                                >
                                    Renvoyer l'email
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Help Section */}
                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            Pas reçu l'email ?{' '}
                            <Link
                                to="/resend-verification"
                                className="font-medium text-blue-600 hover:text-blue-500 hover:underline"
                            >
                                Renvoyer l'email de vérification
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
            {/* Left Section - Registration Form */}
            <div className="w-full lg:w-3/5 flex items-center justify-center px-4 sm:px-8 py-8 lg:py-12">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="flex items-center justify-center mb-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mr-3">
                                    <Users className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        Créer un compte club
                                    </h2>
                                    <p className="text-gray-600 text-sm">
                                        Rejoignez la communauté des clubs et associations
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Registration Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {errors.general && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <p className="text-sm text-red-600">{errors.general}</p>
                                </div>
                            )}

                            {/* Name fields */}
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Prénom"
                                    type="text"
                                    name="firstname"
                                    value={formData.firstname}
                                    onChange={handleInputChange}
                                    onFocus={() => handleFocus('firstname')}
                                    onBlur={() => handleBlur('firstname')}
                                    placeholder="Prénom"
                                    icon={User}
                                    error={getFieldError('firstname')}
                                    mode="club"
                                />
                                <Input
                                    label="Nom"
                                    type="text"
                                    name="lastname"
                                    value={formData.lastname}
                                    onChange={handleInputChange}
                                    onFocus={() => handleFocus('lastname')}
                                    onBlur={() => handleBlur('lastname')}
                                    placeholder="Nom"
                                    icon={User}
                                    error={getFieldError('lastname')}
                                    mode="club"
                                />
                            </div>


                            {/* Username */}
                            <Input
                                label="Nom d'utilisateur"
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleInputChange}
                                onFocus={() => handleFocus('username')}
                                onBlur={() => handleBlur('username')}
                                placeholder="Ex: tennisclubparis"
                                icon={User}
                                error={getFieldError('username')}
                                mode="club"
                            />

                            {/* Gender */}
                            <Select
                                label="Genre"
                                name="gender"
                                value={formData.gender}
                                onChange={handleSelectChange}
                                onFocus={() => handleFocus('gender')}
                                onBlur={() => handleBlur('gender')}
                                placeholder="Sélectionnez votre genre"
                                error={getFieldError('gender')}
                                mode="club"
                                required
                                options={[
                                    { value: 'male', label: 'Homme' },
                                    { value: 'female', label: 'Femme' },
                                    { value: 'prefer_not_to_say', label: 'Préfère ne pas dire' }
                                ]}
                            />

                            {/* Email */}
                            <Input
                                label="Adresse email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                onFocus={() => handleFocus('email')}
                                onBlur={() => handleBlur('email')}
                                placeholder="votre@email.com"
                                icon={Mail}
                                error={getFieldError('email')}
                                mode="club"
                            />

                            {/* Phone */}
                            <Input
                                label="Téléphone"
                                type="tel"
                                name="phone"
                                value={formData.phone || ''}
                                onChange={handleInputChange}
                                onFocus={() => handleFocus('phone')}
                                onBlur={() => handleBlur('phone')}
                                placeholder="+33 6 12 34 56 78"
                                icon={Phone}
                                error={getFieldError('phone')}
                                mode="club"
                            />

                            {/* Password fields */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Input
                                        label="Mot de passe"
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        onFocus={() => handleFocus('password')}
                                        onBlur={() => handleBlur('password')}
                                        placeholder="••••••••"
                                        icon={Lock}
                                        error={getFieldError('password')}
                                        mode="club"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Min. 12 caractères, majuscule, minuscule, chiffre, caractère spécial
                                    </p>
                                </div>
                                <div>
                                    <Input
                                        label="Confirmer mot de passe"
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        onFocus={() => handleFocus('confirmPassword')}
                                        onBlur={() => handleBlur('confirmPassword')}
                                        placeholder="••••••••"
                                        icon={Lock}
                                        error={getFieldError('confirmPassword')}
                                        mode="club"
                                    />
                                </div>
                            </div>

                            {/* Terms and conditions */}
                            <Checkbox
                                name="acceptTerms"
                                checked={formData.acceptTerms}
                                onChange={handleInputChange}
                                label={
                                    <span>
                                        J'accepte les{' '}
                                        <Link
                                            to="/terms"
                                            className="underline hover:no-underline text-blue-600"
                                        >
                                            conditions d'utilisation
                                        </Link>{' '}
                                        et la{' '}
                                        <Link
                                            to="/privacy"
                                            className="underline hover:no-underline text-blue-600"
                                        >
                                            politique de confidentialité
                                        </Link>
                                    </span>
                                }
                                error={errors.acceptTerms}
                                mode="club"
                            />

                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                mode="club"
                                icon={ArrowRight}
                                iconPosition="right"
                                disabled={isLoading}
                                className="w-full"
                            >
                                {isLoading ? 'Création...' : 'Créer mon compte club'}
                            </Button>
                        </form>

                        {/* Login Link */}
                        <div className="text-center mt-6">
                            <p className="text-gray-600">
                                Déjà un compte ?{' '}
                                <Link
                                    to="/login"
                                    className="font-medium text-blue-600 hover:underline"
                                >
                                    Se connecter
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Section - Modern Features */}
            <div className="hidden lg:flex lg:w-2/5 relative overflow-hidden">
                {/* Background with gradient and pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
                    {/* Animated background pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxLjUiLz48L2c+PC9nPjwvc3ZnPg==')]"></div>
                    </div>

                    {/* Floating geometric shapes */}
                    <div className="absolute top-20 left-16 w-20 h-20 bg-white bg-opacity-10 rounded-full blur-xl animate-pulse"></div>
                    <div className="absolute bottom-32 right-20 w-16 h-16 bg-white bg-opacity-15 rounded-full blur-lg animate-pulse delay-1000"></div>
                    <div className="absolute top-1/3 right-12 w-12 h-12 bg-white bg-opacity-5 rounded-full blur-md animate-pulse delay-500"></div>
                    <div className="absolute bottom-20 left-20 w-8 h-8 bg-white bg-opacity-20 rounded-full blur-sm animate-pulse delay-700"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center px-8 xl:px-12 w-full">
                    <div className="max-w-sm">
                        {/* Header with icon */}
                        <div className="mb-8">
                            <div className="flex items-center mb-6">
                                <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mr-4 shadow-2xl">
                                    <Users className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-1">
                                        Clubs & Associations
                                    </h2>
                                    <p className="text-white text-sm font-medium">
                                        Gérez vos membres et activités
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Features in a modern grid */}
                        <div className="grid grid-cols-1 gap-4 mb-8">
                            {features.map((feature, index) => {
                                const Icon = feature.icon
                                return (
                                    <div key={index} className="group bg-white rounded-2xl p-5 border border-gray-200 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                                        <div className="flex items-start space-x-4">
                                            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                <Icon className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-gray-800 transition-colors">
                                                    {feature.title}
                                                </h3>
                                                <p className="text-gray-800 text-sm leading-relaxed font-bold">
                                                    {feature.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Modern CTA Card */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-2xl">
                            <div className="flex items-center mb-4">
                                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                                    <Zap className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-xl">
                                        Essai gratuit
                                    </h3>
                                    <p className="text-gray-800 text-sm font-bold">
                                        30 jours complets
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center text-sm text-gray-900 font-bold">
                                    <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                                    Aucune carte bancaire requise
                                </div>
                                <div className="flex items-center text-sm text-gray-900 font-bold">
                                    <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                                    Accès à toutes les fonctionnalités
                                </div>
                                <div className="flex items-center text-sm text-gray-900 font-bold">
                                    <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                                    Support technique inclus
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Register
