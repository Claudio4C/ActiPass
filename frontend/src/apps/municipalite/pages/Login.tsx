import React from 'react'
import { Link } from 'react-router-dom'
import { Mail, Lock, ArrowRight, Building2, Users, MessageSquare, BarChart3 } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import Button from '../../../shared/components/Button'
import Input from '../../../shared/components/Input'
import Checkbox from '../../../shared/components/Checkbox'
import { useFormValidation } from '../../../hooks/useFormValidation'
import { loginSchema, type LoginFormData } from '../../../shared/schemas/auth'

const Login: React.FC = () => {
  const { login, isLoading, error, clearError } = useAuth()

  const {
    values: formData,
    setValue,
    validate,
    handleBlur,
    handleFocus,
    getFieldError,
  } = useFormValidation<LoginFormData>({
    schema: loginSchema,
    initialValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setValue(name as keyof LoginFormData, type === 'checkbox' ? checked : value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {return}

    try {
      await login(formData.email, formData.password)
    } catch (error) {
      console.error('Login failed:', error)
      // TODO: Gérer l'erreur de connexion
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
      {/* Left Section - Marketing/Info */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden">
        {/* Background with gradient and pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAwMDAiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxLjUiLz48L2c+PC9nPjwvc3ZnPg==')]"></div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-20 right-20 w-32 h-32 bg-purple-200 bg-opacity-20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-24 h-24 bg-indigo-200 bg-opacity-20 rounded-full blur-2xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 w-full">
          <div className="max-w-lg mx-auto text-center">
            {/* Logo */}
            <div className="flex items-center justify-center mb-10">
              <div className="w-16 h-16 bg-purple-600 rounded-3xl flex items-center justify-center mr-4 shadow-xl">
                <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center">
                  <div className="w-4 h-4 bg-purple-600 rounded-full"></div>
                </div>
              </div>
              <span className="text-4xl font-bold text-gray-900">Actipass</span>
            </div>

            {/* Main heading */}
            <h1 className="text-5xl font-bold text-gray-900 mb-8 leading-tight">
              Votre municipalité, connectée
            </h1>

            {/* Description */}
            <p className="text-gray-800 mb-12 text-xl leading-relaxed font-medium max-w-2xl mx-auto">
              Coordonnez vos équipements, gérez les associations locales et optimisez vos services publics.
            </p>

            {/* Feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div key={index} className="group bg-white rounded-3xl p-6 border border-gray-200 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                        <Icon className="w-7 h-7 text-purple-600" />
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg mb-2">{feature.title}</h3>
                      <p className="text-gray-800 leading-relaxed font-medium text-sm">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Additional info */}
            <div className="mt-12 max-w-md mx-auto">
              <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-lg">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <h4 className="font-bold text-gray-900 text-lg">Accès sécurisé</h4>
                </div>
                <p className="text-gray-700 text-sm font-medium">
                  Espace réservé aux services municipaux
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="w-full lg:w-2/5 flex items-center justify-center px-4 sm:px-8 py-8 lg:py-12">
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
                    Espace Municipalité
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Accès sécurisé aux services municipaux
                  </p>
                </div>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Affichage des erreurs d'authentification */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-red-600 text-sm">{error}</p>
                    <button
                      type="button"
                      onClick={clearError}
                      className="text-red-400 hover:text-red-600 ml-2"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

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
                mode="municipalite"
              />

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
                mode="municipalite"
              />

              <div className="flex items-center justify-between">
                <Checkbox
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  label="Se souvenir de moi"
                  mode="municipalite"
                />
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-purple-600 hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>

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
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </form>

            {/* Register Link */}
            <div className="text-center mt-6 space-y-3">
              <p className="text-gray-600">
                Pas encore de compte ?{' '}
                <Link
                  to="/register"
                  className="font-medium text-purple-600 hover:underline"
                >
                  Créer un compte municipalité
                </Link>
              </p>

              {/* Additional Links */}
              <div className="space-y-2">
                <Link
                  to="/forgot-password"
                  className="block text-sm text-gray-500 hover:text-purple-600 hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
                <Link
                  to="/resend-verification"
                  className="block text-sm text-gray-500 hover:text-purple-600 hover:underline"
                >
                  Renvoyer l'email de vérification
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
