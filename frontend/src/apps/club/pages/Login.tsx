import React from 'react'
import { Link } from 'react-router-dom'
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import { useFormValidation } from '../../../hooks/useFormValidation'
import { loginSchema, type LoginFormData } from '../../../shared/schemas/auth'

const Login: React.FC = () => {
  const { login, isLoading, error, clearError } = useAuth()
  const [showPassword, setShowPassword] = React.useState(false)

  const { values: formData, setValue, validate, handleBlur, handleFocus, getFieldError } =
    useFormValidation<LoginFormData>({
      schema: loginSchema,
      initialValues: { email: '', password: '', rememberMe: false },
    })

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setValue(name as keyof LoginFormData, type === 'checkbox' ? checked : value)
    if (error) { clearError() }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) { return }
    try {
      await login(formData.email, formData.password)
      // Le router (App.tsx) gère le redirect vers /onboarding ou /home
    } catch {
      // handled by AuthContext
    }
  }

  const inputCls =
    'w-full h-11 rounded-xl border border-border bg-muted px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors'

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">

        {/* Logo + titre */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary shadow-lg shadow-primary/30">
            <span className="font-display font-bold text-2xl text-primary-foreground">A</span>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Bon retour !</h1>
            <p className="text-sm text-muted-foreground mt-1">Connectez-vous à votre espace Ikivio</p>
          </div>
        </div>

        {/* Card formulaire */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-5">

          {/* Erreur globale */}
          {error && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
              <p className="text-sm text-destructive">{error}</p>
              <button onClick={clearError} className="text-destructive/60 hover:text-destructive text-lg leading-none shrink-0">×</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInput}
                  onFocus={() => handleFocus('email')}
                  onBlur={() => handleBlur('email')}
                  placeholder="votre@email.com"
                  autoComplete="email"
                  className={`${inputCls} pl-9`}
                />
              </div>
              {getFieldError('email') && (
                <p className="text-xs text-destructive">{getFieldError('email')}</p>
              )}
            </div>

            {/* Mot de passe */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block">
                  Mot de passe
                </label>
                <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
                  Oublié ?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInput}
                  onFocus={() => handleFocus('password')}
                  onBlur={() => handleBlur('password')}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`${inputCls} pl-9 pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4 shrink-0" />
                    : <Eye className="w-4 h-4 shrink-0" />}
                </button>
              </div>
              {getFieldError('password') && (
                <p className="text-xs text-destructive">{getFieldError('password')}</p>
              )}
            </div>

            {/* Se souvenir */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleInput}
                className="w-4 h-4 rounded border-border accent-primary"
              />
              <span className="text-sm text-muted-foreground">Se souvenir de moi</span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-primary text-primary-foreground rounded-xl font-bold text-sm inline-flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-primary/25 mt-2"
            >
              {isLoading ? 'Connexion…' : <>Se connecter <ArrowRight className="w-4 h-4 shrink-0" /></>}
            </button>
          </form>
        </div>

        {/* Liens annexes */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Pas encore de compte ?{' '}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Créer un compte
            </Link>
          </p>
          <Link to="/resend-verification" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">
            Renvoyer l'email de vérification
          </Link>
        </div>

      </div>
    </div>
  )
}

export default Login
