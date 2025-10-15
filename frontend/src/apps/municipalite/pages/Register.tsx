import React from 'react'
import { Link } from 'react-router-dom'
import { Mail, Lock, User, Phone, Building2, Users, ArrowRight, MessageSquare, BarChart3, Settings } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import Button from '../../../shared/components/Button'
import Input from '../../../shared/components/Input'
import Checkbox from '../../../shared/components/Checkbox'
import { useFormValidation } from '../../../hooks/useFormValidation'
import { registerSchema, type RegisterFormData } from '../../../shared/schemas/auth'

const Register: React.FC = () => {
    const { register, isLoading } = useAuth()

    const {
        values: formData,
        errors,
        isValid,
        setValue,
        validate,
        handleBlur,
        handleFocus,
        getFieldError,
        reset,
    } = useFormValidation<RegisterFormData>({
        schema: registerSchema,
        initialValues: {
            firstname: '',
            lastname: '',
            email: '',
            password: '',
            confirmPassword: '',
            username: '',
            organizationName: '',
            phone: undefined,
            mode: 'municipalite',
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validate()) { return }

        try {
            await register(formData)
        } catch (error) {
            console.error('Registration failed:', error)
            // TODO: Gérer l'erreur d'inscription
        }
    }

    const features = [
        {
            icon: Building2,
            title: 'Gestion des équipements',
            description: 'Coordination des espaces et installations municipales',
        },
        {
            icon: Users,
            title: 'Gestion des utilisateurs',
            description: 'Accès et permissions pour les associations locales',
        },
        {
            icon: MessageSquare,
            title: 'Communication',
            description: 'Messagerie, notifications, rapports détaillés',
        },
        {
            icon: BarChart3,
            title: 'Tableaux de bord',
            description: 'Statistiques et analyses en temps réel',
        },
    ]

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
            {/* Left Section - Registration Form */}
            <div className="w-full lg:w-3/5 flex items-center justify-center px-4 sm:px-8 py-8 lg:py-12">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="flex items-center justify-center mb-4">
                                <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center mr-3">
                                    <Building2 className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        Créer un compte municipalité
                                    </h2>
                                    <p className="text-gray-600 text-sm">
                                        Accès sécurisé aux services municipaux
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
                                    onBlur={() => handleBlur('firstname')}
                                    placeholder="Prénom"
                                    icon={User}
                                    error={getFieldError('firstname')}
                                    mode="municipalite"
                                />
                                <Input
                                    label="Nom"
                                    type="text"
                                    name="lastname"
                                    value={formData.lastname}
                                    onChange={handleInputChange}
                                    onBlur={() => handleBlur('lastname')}
                                    placeholder="Nom"
                                    icon={User}
                                    error={getFieldError('lastname')}
                                    mode="municipalite"
                                />
                            </div>

                            {/* Organization name */}
                            <Input
                                label="Nom de la municipalité"
                                type="text"
                                name="organizationName"
                                value={formData.organizationName}
                                onChange={handleInputChange}
                                onBlur={() => handleBlur('organizationName')}
                                placeholder="Ex: Mairie de Paris"
                                icon={Building2}
                                error={getFieldError('organizationName')}
                                mode="municipalite"
                            />

                            {/* Email */}
                            <Input
                                label="Adresse email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                onBlur={() => handleBlur('email')}
                                placeholder="votre@email.com"
                                icon={Mail}
                                error={getFieldError('email')}
                                mode="municipalite"
                            />

                            {/* Phone */}
                            <Input
                                label="Téléphone"
                                type="tel"
                                name="phone"
                                value={formData.phone || ''}
                                onChange={handleInputChange}
                                onBlur={() => handleBlur('phone')}
                                placeholder="+33 6 12 34 56 78"
                                icon={Phone}
                                error={getFieldError('phone')}
                                mode="municipalite"
                            />

                            {/* Password fields */}
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Mot de passe"
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    onBlur={() => handleBlur('password')}
                                    placeholder="••••••••"
                                    icon={Lock}
                                    error={getFieldError('password')}
                                    mode="municipalite"
                                />
                                <Input
                                    label="Confirmer mot de passe"
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    onBlur={() => handleBlur('confirmPassword')}
                                    placeholder="••••••••"
                                    icon={Lock}
                                    error={getFieldError('confirmPassword')}
                                    mode="municipalite"
                                />
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
                                            className="underline hover:no-underline text-purple-600"
                                        >
                                            conditions d'utilisation
                                        </Link>{' '}
                                        et la{' '}
                                        <Link
                                            to="/privacy"
                                            className="underline hover:no-underline text-purple-600"
                                        >
                                            politique de confidentialité
                                        </Link>
                                    </span>
                                }
                                error={errors.acceptTerms}
                                mode="municipalite"
                            />

                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                mode="municipalite"
                                icon={ArrowRight}
                                iconPosition="right"
                                disabled={isLoading}
                                className="w-full"
                            >
                                {isLoading ? 'Création...' : 'Créer mon compte municipalité'}
                            </Button>
                        </form>

                        {/* Login Link */}
                        <div className="text-center mt-6">
                            <p className="text-gray-600">
                                Déjà un compte ?{' '}
                                <Link
                                    to="/login"
                                    className="font-medium text-purple-600 hover:underline"
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
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800">
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
                                <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mr-4 shadow-2xl">
                                    <Building2 className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-1">
                                        Municipalités
                                    </h2>
                                    <p className="text-white text-sm font-medium">
                                        Coordonnez vos équipements
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
                                            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
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
                                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                                    <Settings className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-xl">
                                        Accès sécurisé
                                    </h3>
                                    <p className="text-gray-800 text-sm font-bold">
                                        Espace réservé aux services
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center text-sm text-gray-900 font-bold">
                                    <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                                    Authentification sécurisée
                                </div>
                                <div className="flex items-center text-sm text-gray-900 font-bold">
                                    <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                                    Données protégées RGPD
                                </div>
                                <div className="flex items-center text-sm text-gray-900 font-bold">
                                    <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                                    Support technique dédié
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
