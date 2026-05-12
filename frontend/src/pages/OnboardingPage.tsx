import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, Plus, Check, Building2, Loader2, Clock,
} from 'lucide-react'
import { api } from '../lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

type OnboardingType = 'parent' | 'manager' | 'member' | null

const ORG_TYPES = [
  { value: 'sport',   label: 'Sport',   emoji: '⚽' },
  { value: 'culture', label: 'Culture', emoji: '🎭' },
  { value: 'loisir',  label: 'Loisir',  emoji: '🎨' },
  { value: 'social',  label: 'Social',  emoji: '🤝' },
  { value: 'other',   label: 'Autre',   emoji: '🏢' },
] as const

const BIRTH_YEARS = Array.from({ length: 20 }, (_, i) => String(2024 - i))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clearOnboarding() {
  localStorage.removeItem('ikivio_onboarding_type')
}

// ─── Slide animation wrapper ──────────────────────────────────────────────────

const AnimatedStep: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className={`transition-all duration-300 ease-out ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-5'}`}>
      {children}
    </div>
  )
}

// ─── Parent onboarding ────────────────────────────────────────────────────────

const FamilleOnboarding: React.FC = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState<'form' | 'more' | 'success'>('form')
  const [added, setAdded] = useState<string[]>([])
  const [firstname, setFirstname] = useState('')
  const [lastname, setLastname] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [animKey, setAnimKey] = useState(0)
  const [checking, setChecking] = useState(true)

  // Si des enfants existent déjà → pas besoin de refaire l'onboarding page
  useEffect(() => {
    api.get<{ id: string }[]>('/family/children', undefined, { useCache: false })
      .then((kids) => {
        if (kids.length > 0) {
          localStorage.setItem('ikivio_onboarding_page_done', '1')
          navigate('/home', { replace: true })
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false))
  }, [navigate])

  const markPageDone = () => localStorage.setItem('ikivio_onboarding_page_done', '1')

  const goTo = (s: 'form' | 'more' | 'success') => {
    if (s === 'success') { markPageDone() }
    setAnimKey((k) => k + 1)
    setStep(s)
  }

  if (checking) { return null }

  const canSubmit = firstname.trim().length >= 2 && lastname.trim().length >= 2 && birthYear !== ''

  const submitChild = async () => {
    if (!canSubmit || saving) { return }
    setSaving(true)
    setError(null)
    try {
      const fn = firstname.trim()
      const ln = lastname.trim()
      await api.post('/family/children', {
        firstname: fn,
        lastname: ln,
        birthdate: `${birthYear}-06-01`,
        gender: 'prefer_not_to_say',
      })
      setAdded((prev) => [...prev, fn])
      setFirstname('')
      setLastname('')
      setBirthYear('')
      goTo('more')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de créer le profil.')
    } finally {
      setSaving(false)
    }
  }

  const skip = () => { markPageDone(); navigate('/home', { replace: true }) }

  // ── Success ───────────────────────────────────────────────────────────────

  if (step === 'success') {
    return (
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[hsl(160,84%,39%)]/10 mx-auto">
          <Check className="w-10 h-10 text-[hsl(160,84%,39%)]" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            {added.length === 1 ? `${added[0]} est ajouté·e !` : `${added.join(', ')} sont ajoutés !`} 🎉
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Prochaine étape : inscrivez-{added.length === 1 ? 'le' : 'les'} dans un club près de chez vous.
          </p>
        </div>
        <button
          onClick={() => navigate('/clubs', { replace: true })}
          className="w-full h-11 bg-primary text-primary-foreground rounded-2xl font-bold text-sm inline-flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-transform shadow-lg shadow-primary/25"
        >
          <Building2 className="w-4 h-4 shrink-0" />
          Trouver un club à inscrire
        </button>
        <button
          onClick={() => navigate('/club/famille', { replace: true })}
          className="block w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Gérer ma famille →
        </button>
        <button
          onClick={() => navigate('/home', { replace: true })}
          className="block w-full text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          Passer pour l'instant
        </button>
      </div>
    )
  }

  // ── Form + More (animated) ────────────────────────────────────────────────

  return (
    <AnimatedStep key={animKey}>

      {step === 'form' && (
        <div className="space-y-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              {added.length === 0
                ? 'Quel est le prénom de votre premier enfant ?'
                : 'Et votre prochain enfant ?'}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              {added.length === 0
                ? 'Juste le prénom et l\'année de naissance — on fait simple.'
                : 'Même chose, ça prend 5 secondes.'}
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block mb-1.5">
                  Prénom *
                </label>
                <input
                  value={firstname}
                  onChange={(e) => setFirstname(e.target.value)}
                  placeholder="Léa"
                  autoFocus
                  className="w-full h-11 px-3 rounded-xl border border-border bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block mb-1.5">
                  Nom *
                </label>
                <input
                  value={lastname}
                  onChange={(e) => setLastname(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && canSubmit) { submitChild() } }}
                  placeholder="Martin"
                  className="w-full h-11 px-3 rounded-xl border border-border bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block mb-1.5">
                Année de naissance *
              </label>
              <select
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-border bg-muted text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">Choisir une année…</option>
                {BIRTH_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <button
            onClick={submitChild}
            disabled={saving || !canSubmit}
            className="w-full h-11 bg-primary text-primary-foreground rounded-2xl font-bold text-sm inline-flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-transform shadow-lg shadow-primary/25 disabled:opacity-50"
          >
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin shrink-0" /> Création…</>
              : <>Continuer <ArrowRight className="w-4 h-4 shrink-0" /></>}
          </button>

          <button onClick={skip} className="block w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center">
            Passer pour l'instant →
          </button>
        </div>
      )}

      {step === 'more' && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              Super, {added[added.length - 1]} est ajouté·e !
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Avez-vous d'autres enfants à inscrire ?
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {added.length < 4 && (
              <button
                onClick={() => goTo('form')}
                className="w-full h-12 rounded-2xl border-2 border-primary text-primary font-bold text-sm inline-flex items-center justify-center gap-2 hover:bg-primary/5 active:scale-95 transition-transform"
              >
                <Plus className="w-4 h-4 shrink-0" />
                Oui, en ajouter un
              </button>
            )}
            <button
              onClick={() => { goTo('success') }}
              className="w-full h-12 bg-primary text-primary-foreground rounded-2xl font-bold text-sm inline-flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-transform shadow-lg shadow-primary/25"
            >
              Non, c'est tout — Trouver un club
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>

          <button onClick={skip} className="block w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center">
            Passer pour l'instant →
          </button>
        </div>
      )}

    </AnimatedStep>
  )
}

// ─── Manager onboarding ───────────────────────────────────────────────────────

const ClubOnboarding: React.FC = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', type: 'sport' as string, city: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = form.name.trim().length >= 2 && form.type

  const [created, setCreated] = useState<{ id: string; name: string } | null>(null)

  const submit = async () => {
    if (!canSubmit) { return }
    setSaving(true)
    setError(null)
    try {
      const res = await api.post<{ organisation: { id: string; name: string; status: string } }>('/organisations', {
        name: form.name.trim(),
        type: form.type,
        city: form.city.trim() || undefined,
        description: form.description.trim() || undefined,
      })
      clearOnboarding()
      setCreated({ id: res.organisation.id, name: res.organisation.name })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la création du club.')
    } finally {
      setSaving(false)
    }
  }

  // Succès — club créé en pending_validation
  if (created) {
    return (
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-500/10 mx-auto">
          <Clock className="w-10 h-10 text-amber-700" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Club créé ! 🎉</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            <span className="font-semibold text-foreground">{created.name}</span> a bien été créé.
            Un administrateur Ikivio validera votre club sous <strong>24-48h</strong>.
          </p>
        </div>
        <div className="bg-card border border-amber-500/20 rounded-2xl p-5 text-left space-y-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">En attendant la validation</p>
          {[
            'Vous pouvez accéder à votre espace admin',
            'Configurez votre profil de club',
            'Invitez vos premiers membres',
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
              {s}
            </div>
          ))}
        </div>
        <button
          onClick={() => navigate(`/dashboard/${created.id}/overview`, { replace: true })}
          className="w-full h-11 bg-primary text-primary-foreground rounded-xl font-bold text-sm inline-flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/25"
        >
          Accéder à mon espace admin <ArrowRight className="w-4 h-4 shrink-0" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Créez votre club</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Quelques informations suffisent pour démarrer — vous complèterez le profil ensuite.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
        {/* Nom */}
        <div>
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block mb-1.5">
            Nom du club / association *
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ex : Judo Club de Lyon"
            className="w-full h-11 px-3 rounded-xl border border-border bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Type */}
        <div>
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block mb-2">
            Type d'activité *
          </label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {ORG_TYPES.map(({ value, label, emoji }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: value }))}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all active:scale-[0.98] ${
                  form.type === value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <span className="text-xl">{emoji}</span>
                <span className={`text-[11px] font-bold ${form.type === value ? 'text-primary' : 'text-muted-foreground'}`}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Ville */}
        <div>
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block mb-1.5">
            Ville
          </label>
          <input
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            placeholder="Ex : Lyon"
            className="w-full h-11 px-3 rounded-xl border border-border bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block mb-1.5">
            Description <span className="normal-case font-normal text-muted-foreground">(optionnel)</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Quelques mots sur votre club…"
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />
        </div>
      </div>

      <button
        onClick={submit}
        disabled={saving || !canSubmit}
        className="w-full h-11 bg-primary text-primary-foreground rounded-xl font-bold text-sm inline-flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/25 disabled:opacity-50"
      >
        {saving ? <><Loader2 className="w-4 h-4 animate-spin shrink-0" /> Création en cours…</> : <><Building2 className="w-4 h-4 shrink-0" /> Créer mon club</>}
      </button>
      <p className="text-center text-xs text-muted-foreground">
        Vous pourrez modifier ces informations depuis votre espace admin.
      </p>
    </div>
  )
}

// ─── Main OnboardingPage ──────────────────────────────────────────────────────

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate()

  // Lecture synchrone (useState initializer) — s'exécute une seule fois même en StrictMode.
  // Si on lisait dans useEffect, React le relancerait 2× en dev et supprimerait la clé
  // au premier passage, rendant le 2e passage aveugle → redirect systématique vers /home.
  const [type] = useState<OnboardingType>(() =>
    (localStorage.getItem('ikivio_onboarding_type') as OnboardingType) ?? null,
  )

  useEffect(() => {
    if (!type) {
      navigate('/home', { replace: true })
      return
    }
    // 'parent' et 'manager' → restent sur cette page
    // 'member' → jamais atteint (postLoginTarget() retourne /home pour les membres)
    // ikivio_onboarding_type reste intact — GettingStartedCard s'en sert comme source de vérité
  }, [type, navigate])

  // 'member' n'atteint jamais cette page (postLoginTarget → /home), mais TypeScript l'ignore
  if (!type || type === 'member') { return null }

  const headerConfig = {
    parent: { emoji: '👨‍👩‍👧‍👦', title: 'Bienvenue dans votre espace famille',  step: '2 / 2' },
    manager: { emoji: '🏆', title: 'Configurons votre espace club', step: '2 / 2' },
  }[type]

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-lg shadow-primary/30">
            <span className="font-display font-bold text-2xl text-primary-foreground">I</span>
          </div>
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="text-2xl">{headerConfig?.emoji}</span>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                Étape {headerConfig?.step}
              </span>
            </div>
            <h1 className="font-display text-xl font-bold text-foreground">{headerConfig?.title}</h1>
          </div>

          {/* Progress bar */}
          <div className="flex items-center justify-center gap-1.5">
            <div className="h-1.5 w-8 rounded-full bg-primary" />
            <div className="h-1.5 w-8 rounded-full bg-primary" />
          </div>
        </div>

        {/* Content */}
        {type === 'parent'  && <FamilleOnboarding />}
        {type === 'manager' && <ClubOnboarding />}

      </div>
    </div>
  )
}

export default OnboardingPage
