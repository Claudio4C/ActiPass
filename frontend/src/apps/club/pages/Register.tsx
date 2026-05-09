import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, ArrowRight, ArrowLeft, Eye, EyeOff, CheckCircle, Phone } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import { useFormValidation } from '../../../hooks/useFormValidation'
import { registerSchema, type RegisterFormData } from '../../../shared/schemas/auth'

// ─── Profile types ────────────────────────────────────────────────────────────

const PROFILE_TYPES = [
  {
    id: 'parent',
    emoji: '👨‍👩‍👧‍👦',
    label: 'Parent de membre',
    description: 'Vous inscrivez vos enfants à des activités',
  },
  {
    id: 'member',
    emoji: '👤',
    label: 'Membre',
    description: 'Vous participez vous-même aux activités',
  },
  {
    id: 'manager',
    emoji: '🏆',
    label: 'Gérant de club',
    description: 'Vous gérez un club et ses adhérents',
  },
] as const

type ProfileType = (typeof PROFILE_TYPES)[number]['id']

// ─── Step indicator ───────────────────────────────────────────────────────────

const StepBar: React.FC<{ current: number; total: number }> = ({ current, total }) => (
  <div className="flex items-center gap-1.5">
    {Array.from({ length: total }, (_, i) => (
      <div
        key={i}
        className={`h-1.5 rounded-full transition-all duration-300 ${
          i < current ? 'bg-primary w-8' : i === current ? 'bg-primary w-5' : 'bg-border w-5'
        }`}
      />
    ))}
  </div>
)

// ─── Main ─────────────────────────────────────────────────────────────────────

const Register: React.FC = () => {
  const { register, isLoading } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<0 | 1 | 2>(0)
  const [profileType, setProfileType] = useState<ProfileType | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')

  const { values: formData, setValue, validate, handleBlur, handleFocus, getFieldError, errors } =
    useFormValidation<RegisterFormData>({
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

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setValue(name as keyof RegisterFormData, type === 'checkbox' ? checked : value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) { return }
    try {
      await register(formData)
      setRegisteredEmail(formData.email)
      // Repart d'un état propre quel que soit l'historique du navigateur
      localStorage.removeItem('ikivio_welcome_seen')
      localStorage.removeItem('ikivio_visited_activity')
      localStorage.removeItem('ikivio_checklist_minimized')
      localStorage.removeItem('ikivio_onboarding_page_done')
      localStorage.removeItem('ikivio_last_user_id')
      localStorage.removeItem('ikivio_profile_mode')
      // Persist le type de profil pour l'onboarding post-connexion
      if (profileType) { localStorage.setItem('ikivio_onboarding_type', profileType) }
      setStep(2)
    } catch {
      // handled by AuthContext
    }
  }

  const inputCls =
    'w-full h-11 rounded-xl border border-border bg-muted px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors'

  // ── Step 2 — Success ──────────────────────────────────────────────────────
  if (step === 2) {
    const onboardingHint = {
      parent:  { emoji: '👨‍👩‍👧‍👦', label: 'Ajouter vos enfants', desc: 'Après connexion, rendez-vous dans "Ma famille" pour créer les profils de vos enfants et les inscrire dans leurs clubs.' },
      manager: { emoji: '🏆', label: 'Créer votre club', desc: 'Après connexion, vous pourrez créer votre organisation et inviter vos premiers membres.' },
      member:  { emoji: '👤', label: 'Rejoindre un club', desc: 'Après connexion, recherchez votre club et demandez votre adhésion.' },
    }[profileType ?? 'member']

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[hsl(160,84%,39%)]/10">
            <CheckCircle className="w-10 h-10 text-[hsl(160,84%,39%)]" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Inscription réussie !</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Email envoyé à <span className="font-semibold text-foreground">{registeredEmail}</span>
            </p>
          </div>

          {/* Étapes communes */}
          <div className="bg-card border border-border rounded-2xl p-5 text-left space-y-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Pour activer votre compte</p>
            {['Vérifiez votre boîte de réception (et vos spams)', 'Cliquez sur le lien de vérification', 'Connectez-vous'].map((s, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                {s}
              </div>
            ))}
          </div>

          {/* Hint contextuel selon le profil */}
          {onboardingHint && (
            <div className="bg-card border border-border rounded-2xl p-5 text-left space-y-2">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Ensuite, votre prochaine étape</p>
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0">{onboardingHint.emoji}</span>
                <div>
                  <p className="font-display font-bold text-foreground text-sm">{onboardingHint.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{onboardingHint.desc}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full h-11 bg-primary text-primary-foreground rounded-xl font-bold text-sm inline-flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/25"
            >
              Se connecter <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
            <Link to="/resend-verification" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">
              Renvoyer l'email de vérification
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">

        {/* Logo + step indicator */}
        <div className="flex flex-col items-center gap-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary shadow-lg shadow-primary/30">
            <span className="font-display font-bold text-xl text-primary-foreground">I</span>
          </div>
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
              Créer un compte
            </p>
            <StepBar current={step} total={2} />
          </div>
        </div>

        {/* ── Étape 0 — Choix du profil ───────────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold text-foreground">Vous êtes ?</h1>
              <p className="text-sm text-muted-foreground mt-1">Choisissez le profil qui vous correspond.</p>
            </div>

            <div className="space-y-3">
              {PROFILE_TYPES.map((pt) => (
                <button
                  key={pt.id}
                  onClick={() => setProfileType(pt.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.99] ${
                    profileType === pt.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                    profileType === pt.id ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    {pt.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-display font-bold text-sm ${profileType === pt.id ? 'text-primary' : 'text-foreground'}`}>
                      {pt.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{pt.description}</p>
                  </div>
                  {profileType === pt.id && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => { if (profileType) { setStep(1) } }}
              disabled={!profileType}
              className="w-full h-11 bg-primary text-primary-foreground rounded-xl font-bold text-sm inline-flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 shadow-lg shadow-primary/25"
            >
              Continuer <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            <p className="text-center text-sm text-muted-foreground">
              Déjà un compte ?{' '}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        )}

        {/* ── Étape 1 — Formulaire ────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep(0)}
                className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors shrink-0"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
              </button>
              <div>
                <h1 className="font-display text-xl font-bold text-foreground">Vos informations</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Profil : <span className="font-semibold text-foreground">
                    {PROFILE_TYPES.find((p) => p.id === profileType)?.label}
                  </span>
                </p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
              {errors.general && (
                <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
                  <p className="text-sm text-destructive">{errors.general}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Prénom + Nom */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block">
                      Prénom *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <input
                        type="text" name="firstname" value={formData.firstname}
                        onChange={handleInput} onFocus={() => handleFocus('firstname')} onBlur={() => handleBlur('firstname')}
                        placeholder="Prénom" autoComplete="given-name"
                        className={`${inputCls} pl-8`}
                      />
                    </div>
                    {getFieldError('firstname') && <p className="text-xs text-destructive">{getFieldError('firstname')}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block">
                      Nom *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <input
                        type="text" name="lastname" value={formData.lastname}
                        onChange={handleInput} onFocus={() => handleFocus('lastname')} onBlur={() => handleBlur('lastname')}
                        placeholder="Nom" autoComplete="family-name"
                        className={`${inputCls} pl-8`}
                      />
                    </div>
                    {getFieldError('lastname') && <p className="text-xs text-destructive">{getFieldError('lastname')}</p>}
                  </div>
                </div>

                {/* Username */}
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block">
                    Nom d'utilisateur *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">@</span>
                    <input
                      type="text" name="username" value={formData.username}
                      onChange={handleInput} onFocus={() => handleFocus('username')} onBlur={() => handleBlur('username')}
                      placeholder="monpseudo" autoComplete="username"
                      className={`${inputCls} pl-8`}
                    />
                  </div>
                  {getFieldError('username') && <p className="text-xs text-destructive">{getFieldError('username')}</p>}
                </div>

                {/* Genre */}
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block">
                    Genre
                  </label>
                  <div className="flex gap-2">
                    {[{ v: 'male', l: 'Homme' }, { v: 'female', l: 'Femme' }, { v: 'prefer_not_to_say', l: 'Non précisé' }].map(({ v, l }) => (
                      <button
                        key={v} type="button"
                        onClick={() => setValue('gender', v as RegisterFormData['gender'])}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-colors ${
                          formData.gender === v
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/40'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground shrink-0" />
                    <input
                      type="email" name="email" value={formData.email}
                      onChange={handleInput} onFocus={() => handleFocus('email')} onBlur={() => handleBlur('email')}
                      placeholder="votre@email.com" autoComplete="email"
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                  {getFieldError('email') && <p className="text-xs text-destructive">{getFieldError('email')}</p>}
                </div>

                {/* Téléphone */}
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block">
                    Téléphone <span className="text-muted-foreground normal-case font-normal">(optionnel)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground shrink-0" />
                    <input
                      type="tel" name="phone" value={formData.phone ?? ''}
                      onChange={handleInput} onFocus={() => handleFocus('phone')} onBlur={() => handleBlur('phone')}
                      placeholder="+33 6 12 34 56 78" autoComplete="tel"
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                </div>

                {/* Mots de passe */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block">
                      Mot de passe *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground shrink-0" />
                      <input
                        type={showPassword ? 'text' : 'password'} name="password" value={formData.password}
                        onChange={handleInput} onFocus={() => handleFocus('password')} onBlur={() => handleBlur('password')}
                        placeholder="••••••••" autoComplete="new-password"
                        className={`${inputCls} pl-9 pr-10`}
                      />
                      <button type="button" onClick={() => setShowPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="w-4 h-4 shrink-0" /> : <Eye className="w-4 h-4 shrink-0" />}
                      </button>
                    </div>
                    {getFieldError('password') && <p className="text-xs text-destructive">{getFieldError('password')}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block">
                      Confirmation *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground shrink-0" />
                      <input
                        type={showConfirm ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword}
                        onChange={handleInput} onFocus={() => handleFocus('confirmPassword')} onBlur={() => handleBlur('confirmPassword')}
                        placeholder="••••••••" autoComplete="new-password"
                        className={`${inputCls} pl-9 pr-10`}
                      />
                      <button type="button" onClick={() => setShowConfirm((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showConfirm ? <EyeOff className="w-4 h-4 shrink-0" /> : <Eye className="w-4 h-4 shrink-0" />}
                      </button>
                    </div>
                    {getFieldError('confirmPassword') && <p className="text-xs text-destructive">{getFieldError('confirmPassword')}</p>}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Min. 12 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial
                </p>

                {/* CGU */}
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox" name="acceptTerms" checked={formData.acceptTerms}
                    onChange={handleInput}
                    className="mt-0.5 w-4 h-4 rounded border-border accent-primary shrink-0"
                  />
                  <span className="text-sm text-muted-foreground leading-snug">
                    J'accepte les{' '}
                    <Link to="/terms" className="text-primary font-semibold hover:underline">conditions d'utilisation</Link>
                    {' '}et la{' '}
                    <Link to="/privacy" className="text-primary font-semibold hover:underline">politique de confidentialité</Link>
                  </span>
                </label>
                {errors.acceptTerms && <p className="text-xs text-destructive">{errors.acceptTerms}</p>}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-primary text-primary-foreground rounded-xl font-bold text-sm inline-flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-primary/25"
                >
                  {isLoading ? 'Création…' : <>Créer mon compte <ArrowRight className="w-4 h-4 shrink-0" /></>}
                </button>
              </form>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Déjà un compte ?{' '}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        )}

      </div>
    </div>
  )
}

export default Register
