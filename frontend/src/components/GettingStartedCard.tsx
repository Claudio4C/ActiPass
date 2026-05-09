import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Circle, ChevronRight, Minus, Sparkles } from 'lucide-react'
import { api } from '../lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Step {
  id: string
  label: string
  description: string
  done: boolean
  cta: string
  href: string
}

// ─── Canvas-confetti (CDN) ───────────────────────────────────────────────────

type ConfettiFn = (opts?: Record<string, unknown>) => void

const loadConfetti = (): Promise<ConfettiFn> =>
  new Promise((resolve) => {
    if ((window as unknown as { confetti?: ConfettiFn }).confetti) {
      resolve((window as unknown as { confetti: ConfettiFn }).confetti)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js'
    script.onload = () =>
      resolve((window as unknown as { confetti: ConfettiFn }).confetti)
    document.head.appendChild(script)
  })

// ─── Shared: progress bar + step row ─────────────────────────────────────────

const ProgressBar: React.FC<{ pct: number; green?: boolean }> = ({ pct, green }) => (
  <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
    <div
      className={`h-1.5 rounded-full transition-all duration-700 ${green ? 'bg-[hsl(160,84%,39%)]' : 'bg-primary'}`}
      style={{ width: `${pct}%` }}
    />
  </div>
)

// ═══════════════════════════════════════════════════════════════════════════════
// VARIANT MEMBRE — 3 étapes
// ═══════════════════════════════════════════════════════════════════════════════

const MemberChecklistCard: React.FC = () => {
  const navigate = useNavigate()
  const [hasMembership, setHasMembership] = useState(false)
  const [hasVisitedActivity] = useState(
    () => localStorage.getItem('ikivio_visited_activity') === '1',
  )
  const [loading, setLoading] = useState(true)
  const [minimized, setMinimized] = useState(
    () => localStorage.getItem('ikivio_checklist_minimized') === '1',
  )
  const [hidden, setHidden] = useState(false)
  const celebrationFired = useRef(false)

  // Vérifier si le membre a rejoint au moins un club
  useEffect(() => {
    api.get<{ organisation: { id: string } }[]>('/organisations/my', {}, { useCache: false })
      .then((data) => setHasMembership(Array.isArray(data) && data.length > 0))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Confetti quand les 3 étapes sont cochées
  useEffect(() => {
    if (loading || celebrationFired.current) { return }
    if (!hasMembership || !hasVisitedActivity) { return }
    celebrationFired.current = true
    loadConfetti().then((confetti) => {
      const fire = (opts: Record<string, unknown>) =>
        confetti({ colors: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'], ...opts })
      fire({ particleCount: 60, spread: 60, origin: { y: 0.65 } })
      setTimeout(() => fire({ particleCount: 40, spread: 90, origin: { y: 0.4 } }), 350)
      setTimeout(() => {
        localStorage.setItem('ikivio_welcome_seen', 'done')
        localStorage.removeItem('ikivio_onboarding_type')
        localStorage.removeItem('ikivio_visited_activity')
        setHidden(true)
      }, 3000)
    })
  }, [hasMembership, hasVisitedActivity, loading])

  if (hidden) { return null }

  const steps = [
    { id: 'account',  label: 'Créer votre compte',       done: true,                 cta: '',               href: '' },
    { id: 'join',     label: 'Rejoindre un club',         done: hasMembership,        cta: 'Découvrir les clubs', href: '/clubs' },
    { id: 'activity', label: 'Découvrir mon espace membre', done: hasVisitedActivity, cta: 'Mon activité →', href: '/club' },
  ]

  const completedCount = steps.filter((s) => s.done).length
  const totalCount = steps.length
  const pct = Math.round((completedCount / totalCount) * 100)
  const activeIndex = steps.findIndex((s) => !s.done)
  const allDone = completedCount === totalCount

  // ── Minimized ─────────────────────────────────────────────────────────────

  if (minimized) {
    return (
      <button
        onClick={() => { setMinimized(false); localStorage.removeItem('ikivio_checklist_minimized') }}
        className="w-full bg-card border border-border rounded-2xl px-4 py-3 space-y-2 hover:border-primary/40 transition-colors active:scale-[0.99] text-left"
      >
        <div className="flex items-center justify-between">
          <p className="font-display text-sm font-bold text-foreground">Bienvenue sur Ikivio · {completedCount}/{totalCount}</p>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </div>
        <ProgressBar pct={pct} />
      </button>
    )
  }

  // ── Full card ─────────────────────────────────────────────────────────────

  return (
    <div className={`bg-card border border-border rounded-2xl overflow-hidden transition-all ${allDone ? 'border-[hsl(160,84%,39%)]/40' : ''}`}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">
              {allDone ? '✓ Complété !' : 'Bienvenue'}
            </p>
            <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              {allDone ? 'Vous êtes prêt·e 🎉' : 'Bienvenue sur Ikivio'}
            </h2>
            {!allDone && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Trouvez votre premier club et c'est parti.
              </p>
            )}
          </div>
          {!allDone && (
            <button
              onClick={() => { setMinimized(true); localStorage.setItem('ikivio_checklist_minimized', '1') }}
              className="w-7 h-7 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors active:scale-95 shrink-0"
              title="Réduire"
            >
              <Minus className="w-3.5 h-3.5 shrink-0" />
            </button>
          )}
        </div>
        <ProgressBar pct={pct} green={allDone} />
      </div>

      {/* Steps */}
      <div className="divide-y divide-border">
        {steps.map((step, index) => {
          const isActive = !loading && index === activeIndex
          return (
            <div
              key={step.id}
              className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${isActive ? 'bg-primary/5' : ''}`}
            >
              <div className="shrink-0">
                {step.done
                  ? <CheckCircle className="w-5 h-5 text-[hsl(160,84%,39%)]" />
                  : isActive
                  ? <ChevronRight className="w-5 h-5 text-primary" />
                  : <Circle className="w-5 h-5 text-border" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold leading-tight ${
                  step.done ? 'line-through text-muted-foreground'
                    : isActive ? 'text-primary'
                    : 'text-muted-foreground'
                }`}>
                  {step.label}
                </p>
              </div>
              {isActive && step.cta && (
                <button
                  onClick={() => navigate(step.href)}
                  className="shrink-0 inline-flex items-center px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-full hover:opacity-90 active:scale-95 transition-all shadow-sm shadow-primary/20 whitespace-nowrap"
                >
                  {step.cta}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer — toujours masquable pour les membres */}
      {!allDone && (
        <div className="px-5 py-3 border-t border-border">
          <button
            onClick={() => { setMinimized(true); localStorage.setItem('ikivio_checklist_minimized', '1') }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Masquer pour l'instant
          </button>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// VARIANT PARENT/FAMILLE — 5 étapes
// ═══════════════════════════════════════════════════════════════════════════════

const INITIAL_STEPS: Step[] = [
  { id: 'account',        label: 'Créer votre compte',      description: 'Vous êtes connecté — c\'est fait !',                                    done: true,  cta: '',                href: '' },
  { id: 'children',       label: 'Ajouter vos enfants',     description: 'Créez les profils de vos enfants pour gérer leurs activités.',           done: false, cta: 'Ajouter →',       href: '/club/famille' },
  { id: 'membership',     label: 'Inscrire dans un club',   description: 'Inscrivez un enfant dans une association près de chez vous.',            done: false, cta: 'Trouver un club →', href: '/clubs' },
  { id: 'health',         label: 'Compléter la fiche santé', description: 'Renseignez allergies, groupe sanguin et contact d\'urgence.',           done: false, cta: 'Renseigner →',     href: '/club/famille' },
  { id: 'authorizations', label: 'Signer les autorisations', description: 'Droit à l\'image, autorisation de sortie, décharge médicale.',         done: false, cta: 'Signer →',         href: '/club/famille' },
]

const ParentChecklistCard: React.FC = () => {
  const navigate = useNavigate()
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS)
  const [loading, setLoading] = useState(true)
  const [minimized, setMinimized] = useState(
    () => localStorage.getItem('ikivio_checklist_minimized') === '1',
  )
  const [celebrated, setCelebrated] = useState(false)
  const [hidden, setHidden] = useState(false)
  const firstChildIdRef = useRef<string | null>(null)
  const celebrationFired = useRef(false)

  const fetchState = useCallback(async () => {
    try {
      const children = await api.get<{
        id: string
        memberships: { id: string; organisation: { id: string } }[]
      }[]>('/family/children', undefined, { useCache: false }).catch(() => [])

      const hasChildren = children.length > 0
      firstChildIdRef.current = children[0]?.id ?? null

      const hasMembership =
        hasChildren && children.some((c) => c.memberships && c.memberships.length > 0)

      let hasHealth = false
      let hasAuthorization = false

      if (hasChildren) {
        const results = await Promise.all(
          children.map(async (child) => {
            const [health, auths] = await Promise.all([
              api.get<{
                blood_type: string | null; allergies: string[]; no_known_allergies?: boolean;
                treatments: string[]; no_known_treatments?: boolean;
                medical_notes: string | null; emergency_contact_name: string | null;
              }>(`/family/children/${child.id}/health`, undefined, { useCache: false }).catch(() => null),
              api.get<{ is_signed: boolean }[]>(
                `/family/children/${child.id}/authorizations`, undefined, { useCache: false },
              ).catch(() => []),
            ])
            return { health, auths }
          }),
        )

        hasHealth = results.some(({ health }) =>
          health && (
            health.blood_type || health.allergies?.length > 0 || health.no_known_allergies ||
            health.treatments?.length > 0 || health.no_known_treatments ||
            health.medical_notes || health.emergency_contact_name
          ),
        )
        hasAuthorization = results.some(({ auths }) => auths.some((a) => a.is_signed))
      }

      setSteps((prev) =>
        prev.map((s) => {
          switch (s.id) {
            case 'account':        return { ...s, done: true }
            case 'children':       return { ...s, done: hasChildren }
            case 'membership':     return { ...s, done: hasMembership }
            case 'health':         return { ...s, done: hasHealth }
            case 'authorizations': return { ...s, done: hasAuthorization }
            default:               return s
          }
        }),
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchState() }, [fetchState])

  useEffect(() => {
    if (loading || celebrationFired.current) { return }
    if (!steps.every((s) => s.done)) { return }
    celebrationFired.current = true
    setCelebrated(true)
    loadConfetti().then((confetti) => {
      const fire = (opts: Record<string, unknown>) =>
        confetti({ colors: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'], ...opts })
      fire({ particleCount: 80, spread: 60, origin: { y: 0.65 } })
      setTimeout(() => fire({ particleCount: 50, spread: 100, origin: { y: 0.4 } }), 350)
      setTimeout(() => fire({ particleCount: 30, spread: 80, origin: { x: 0.2, y: 0.5 } }), 600)
      setTimeout(() => fire({ particleCount: 30, spread: 80, origin: { x: 0.8, y: 0.5 } }), 750)
      setTimeout(() => {
        localStorage.setItem('ikivio_welcome_seen', 'done')
        localStorage.removeItem('ikivio_onboarding_type')
        setHidden(true)
      }, 3000)
    })
  }, [steps, loading])

  const handleCta = (step: Step) => {
    let href = step.href
    if ((step.id === 'health' || step.id === 'authorizations') && firstChildIdRef.current) {
      href = `/club/famille/${firstChildIdRef.current}`
    }
    navigate(href)
  }

  if (hidden) { return null }

  const completedCount = steps.filter((s) => s.done).length
  const totalCount = steps.length
  const pct = Math.round((completedCount / totalCount) * 100)
  const activeIndex = steps.findIndex((s) => !s.done)

  // Minimized
  if (minimized) {
    return (
      <button
        onClick={() => { setMinimized(false); localStorage.removeItem('ikivio_checklist_minimized') }}
        className="w-full bg-card border border-border rounded-2xl px-4 py-3 space-y-2 hover:border-primary/40 transition-colors active:scale-[0.99] text-left"
      >
        <div className="flex items-center justify-between">
          <p className="font-display text-sm font-bold text-foreground">
            Premiers pas · {completedCount}/{totalCount}
          </p>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </div>
        <ProgressBar pct={pct} />
      </button>
    )
  }

  return (
    <div className={`bg-card border border-border rounded-2xl overflow-hidden transition-all ${celebrated ? 'border-[hsl(160,84%,39%)]/40' : ''}`}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">
              {celebrated ? '✓ Complété !' : 'Guide de démarrage'}
            </p>
            <h2 className="font-display text-base font-bold text-foreground">
              {celebrated ? 'Vous êtes prêt·e 🎉' : `Premiers pas · ${completedCount}/${totalCount}`}
            </h2>
          </div>
          {!celebrated && (
            <button
              onClick={() => { setMinimized(true); localStorage.setItem('ikivio_checklist_minimized', '1') }}
              className="w-7 h-7 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors active:scale-95 shrink-0"
              title="Réduire"
            >
              <Minus className="w-3.5 h-3.5 shrink-0" />
            </button>
          )}
        </div>
        <ProgressBar pct={pct} green={celebrated} />
      </div>

      {/* Steps */}
      <div className="divide-y divide-border">
        {steps.map((step, index) => {
          const isActive = !loading && index === activeIndex
          return (
            <div
              key={step.id}
              className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${isActive ? 'bg-primary/5' : ''}`}
            >
              <div className="shrink-0">
                {step.done
                  ? <CheckCircle className="w-5 h-5 text-[hsl(160,84%,39%)]" />
                  : isActive
                  ? <ChevronRight className="w-5 h-5 text-primary" />
                  : <Circle className="w-5 h-5 text-border" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold leading-tight ${
                  step.done ? 'line-through text-muted-foreground'
                    : isActive ? 'text-primary'
                    : 'text-muted-foreground'
                }`}>
                  {step.label}
                </p>
                {isActive && (
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {step.description}
                  </p>
                )}
              </div>
              {isActive && step.cta && (
                <button
                  onClick={() => handleCta(step)}
                  className="shrink-0 inline-flex items-center px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-full hover:opacity-90 active:scale-95 transition-all shadow-sm shadow-primary/20 whitespace-nowrap"
                >
                  {step.cta}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      {!celebrated && (
        <div className="px-5 py-3 border-t border-border">
          <button
            onClick={() => { setMinimized(true); localStorage.setItem('ikivio_checklist_minimized', '1') }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Masquer pour l'instant
          </button>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Export — ikivio_onboarding_type = source de vérité du variant
//          ikivio_welcome_seen = 'done' uniquement, signifie terminé
// ═══════════════════════════════════════════════════════════════════════════════

const GettingStartedCard: React.FC = () => {
  if (localStorage.getItem('ikivio_welcome_seen') === 'done') { return null }
  const type = localStorage.getItem('ikivio_onboarding_type')
  if (type === 'parent')  { return <ParentChecklistCard /> }
  if (type === 'member')  { return <MemberChecklistCard /> }
  return null // manager (checklist dans /dashboard) ou ancien compte sans type
}

export default GettingStartedCard
