import React, { useEffect, useState } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { Plus, Users, Calendar, ChevronRight, Trash2, X, UserCheck, Building2, ArrowLeft, User, CheckCircle } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

// ─── Health score ─────────────────────────────────────────────────────────────

const calcHealthScore = (h: {
  blood_type: string | null; allergies: string[]; no_known_allergies?: boolean;
  treatments: string[]; no_known_treatments?: boolean;
  emergency_contact_name: string | null; emergency_contact_phone: string | null;
}) => [
  !!h.blood_type,
  h.allergies?.length > 0 || !!h.no_known_allergies,
  h.treatments?.length > 0 || !!h.no_known_treatments,
  !!h.emergency_contact_name,
  !!h.emergency_contact_phone,
].filter(Boolean).length

const HealthBadge: React.FC<{ score: number }> = ({ score }) => {
  if (score >= 5) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[hsl(160,84%,39%)]/15 text-[hsl(160,84%,39%)] shrink-0">
        <CheckCircle className="w-3 h-3 shrink-0" />
        Complet
      </span>
    )
  }
  if (score >= 3) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-700 shrink-0">
        En cours
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 shrink-0">
      À compléter
    </span>
  )
}

interface ChildMembership {
  id: string;
  organisation: { id: string; name: string; type: string };
  role: { name: string; type: string };
  status: string;
}

interface Child {
  id: string;
  firstname: string;
  lastname: string;
  birthdate: string | null;
  gender: string | null;
  phone: string | null;
  relationship: string;
  is_primary_contact: boolean;
  memberships: ChildMembership[];
}

const AVATAR_COLORS = [
  'hsl(217,91%,60%)', 'hsl(280,70%,60%)', 'hsl(25,95%,53%)',
  'hsl(160,84%,39%)', 'hsl(340,75%,55%)',
]

const getAge = (birthdate: string | null): string => {
  if (!birthdate) return '—'
  const years = Math.floor((Date.now() - new Date(birthdate).getTime()) / (1000 * 60 * 60 * 24 * 365))
  return `${years} ans`
}

const genderLabel = (g: string | null) =>
  g === 'male' ? 'Garçon' : g === 'female' ? 'Fille' : 'Non précisé'

const avatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]

const PROFILE_MODES = [
  { value: 'solo', label: 'Solo', description: 'Vous utilisez l\'app seul(e)' },
  { value: 'duo', label: 'Duo', description: 'Vous et un partenaire' },
  { value: 'famille', label: 'Famille', description: 'Avec vos enfants' },
]

const FamilyPage: React.FC = () => {
  const { user } = useAuth()
  const { orgId } = useParams<{ orgId?: string }>()
  const location = useLocation()
  const [children, setChildren] = useState<Child[]>([])
  const [healthScores, setHealthScores] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profileMode, setProfileMode] = useState<string>(() =>
    (user as any)?.profile_mode ?? localStorage.getItem('ikivio_profile_mode') ?? 'famille',
  )
  const [showModeModal, setShowModeModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editChild, setEditChild] = useState<Child | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [form, setForm] = useState({
    firstname: '', lastname: '', birthdate: '',
    gender: 'male' as 'male' | 'female' | 'prefer_not_to_say', phone: '',
  })

  const load = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)
      if (forceRefresh) { api.clearCache('/family/children') }
      const kids = await api.get<Child[]>('/family/children', undefined, { useCache: true, cacheTTL: 30000 })
      const childList = Array.isArray(kids) ? kids : []
      setChildren(childList)

      if (childList.length > 0) {
        const healths = await Promise.all(
          childList.map((child) =>
            api.get<{ blood_type: string | null; allergies: string[]; treatments: string[]; emergency_contact_name: string | null; emergency_contact_phone: string | null }>(
              `/family/children/${child.id}/health`, undefined, { useCache: true, cacheTTL: 60000 },
            ).catch(() => null),
          ),
        )
        const scores: Record<string, number> = {}
        childList.forEach((child, i) => {
          scores[child.id] = healths[i] ? calcHealthScore(healths[i]!) : 0
        })
        setHealthScores(scores)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur réseau'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditChild(null)
    setFormError(null)
    setForm({ firstname: '', lastname: '', birthdate: '', gender: 'male', phone: '' })
    setShowAddModal(true)
  }

  const openEdit = (child: Child) => {
    setEditChild(child)
    setFormError(null)
    setForm({
      firstname: child.firstname,
      lastname: child.lastname,
      birthdate: child.birthdate ? child.birthdate.slice(0, 10) : '',
      gender: (child.gender as 'male' | 'female' | 'prefer_not_to_say') || 'male',
      phone: child.phone || '',
    })
    setShowAddModal(true)
  }

  const submit = async () => {
    if (!form.firstname || !form.lastname) { setFormError('Prénom et nom requis.'); return }
    setSubmitting(true)
    setFormError(null)
    try {
      if (editChild) {
        await api.put(`/family/children/${editChild.id}`, form)
      } else {
        await api.post('/family/children', form)
      }
      setShowAddModal(false)
      await load(true)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  const remove = async (childId: string) => {
    try {
      await api.delete(`/family/children/${childId}`)
      setDeleteConfirm(null)
      await load(true)
    } catch {
      setError('Erreur lors de la suppression.')
    }
  }

  const currentModeLabel = PROFILE_MODES.find((m) => m.value === profileMode)?.label ?? 'Solo'

  return (
    <div className="space-y-6">
      {/* Breadcrumb navigation contextuelle */}
      <div className="flex items-center gap-2 flex-wrap">
        {orgId ? (
          <Link
            to={`/club/${orgId}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            Retour au club
          </Link>
        ) : (
          <Link
            to="/home"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            Accueil
          </Link>
        )}
        <span className="text-muted-foreground/40 text-sm">·</span>
        <span className="text-sm font-semibold text-foreground">Ma famille</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Ma famille</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {children.length} enfant{children.length !== 1 ? 's' : ''} enregistré{children.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/club/famille/planning"
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-border bg-card rounded-xl text-sm font-semibold text-foreground hover:border-primary/40 transition-colors active:scale-95"
          >
            <Calendar className="w-4 h-4 shrink-0 text-primary" />
            Planning
          </Link>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/25"
          >
            <Plus className="w-4 h-4 shrink-0" />
            Ajouter un enfant
          </button>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{error}</p>
          <button
            onClick={() => load(true)}
            className="shrink-0 text-xs font-bold text-destructive border border-destructive/40 rounded-xl px-3 py-1.5 hover:bg-destructive/10 active:scale-95 transition-all"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Mode d'utilisation */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Mode d'utilisation</p>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm font-semibold text-foreground">Mode {currentModeLabel}</span>
            </div>
          </div>
          <button
            onClick={() => setShowModeModal(true)}
            className="w-8 h-8 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
          >
            <ChevronRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </div>

      {/* Card "Moi" */}
      {user && (
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-3">Vous</p>
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
            <div
              className="shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center font-display font-bold text-lg text-white"
              style={{ backgroundColor: avatarColor((user as any).firstname || user.email) }}
            >
              {((user as any).firstname || user.email).charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-foreground">
                {(user as any).firstname} {(user as any).lastname}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
            </div>
            <span className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
              Parent
            </span>
          </div>
        </div>
      )}

      {/* Section enfants */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Enfants</p>
          {children.length > 0 && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
              {children.length}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : children.length === 0 ? (
          <div className="bg-card border border-border rounded-3xl p-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
              <Users className="w-7 h-7 text-primary shrink-0" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">Commençons par vos enfants</h2>
              <p className="text-sm text-muted-foreground mt-1">Ajoutez le profil de votre premier enfant pour commencer à gérer ses activités.</p>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-bold hover:opacity-90 active:scale-95 transition-transform shadow-lg shadow-primary/25"
            >
              <Plus className="w-4 h-4 shrink-0" />
              Ajouter mon premier enfant
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {children.map((child) => (
              <div
                key={child.id}
                className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-colors"
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center font-display font-bold text-base text-white"
                      style={{ backgroundColor: avatarColor(child.firstname) }}
                    >
                      {child.firstname.charAt(0)}{child.lastname.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-display font-bold text-foreground truncate">
                          {child.firstname} {child.lastname}
                        </p>
                        {healthScores[child.id] !== undefined && (
                          <HealthBadge score={healthScores[child.id]} />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {genderLabel(child.gender)} · {getAge(child.birthdate)}
                      </p>
                    </div>
                  </div>

                  {/* Clubs */}
                  <div className="mt-3">
                    {child.memberships.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {child.memberships.map((m) => (
                          <span
                            key={m.id}
                            className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                          >
                            <Building2 className="w-2.5 h-2.5 shrink-0" />
                            {m.organisation.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Non inscrit dans un club</span>
                    )}
                  </div>

                  {/* Actions */}
                  {deleteConfirm === child.id ? (
                    <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-destructive/5 border border-destructive/20">
                      <p className="flex-1 text-xs text-destructive font-medium">Supprimer ce profil ?</p>
                      <button onClick={() => remove(child.id)} className="text-xs font-bold text-destructive hover:underline">Oui</button>
                      <button onClick={() => setDeleteConfirm(null)} className="text-xs text-muted-foreground hover:underline">Annuler</button>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center gap-2">
                      <Link
                        to={`/club/famille/${child.id}`}
                        state={{ from: location.pathname }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90 active:scale-95 transition-all"
                      >
                        <UserCheck className="w-3.5 h-3.5 shrink-0" />
                        Voir le profil
                      </Link>
                      <button
                        onClick={() => openEdit(child)}
                        className="px-3 py-2 border border-border rounded-xl text-xs font-semibold text-foreground hover:bg-muted transition-colors active:scale-95"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(child.id)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 shrink-0" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal — Mode d'utilisation */}
      {showModeModal && (
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-foreground">Mode d'utilisation</h2>
              <button onClick={() => setShowModeModal(false)} className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                <X className="w-4 h-4 shrink-0" />
              </button>
            </div>
            <div className="space-y-2">
              {PROFILE_MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => {
                    setProfileMode(m.value)
                    localStorage.setItem('ikivio_profile_mode', m.value)
                    setShowModeModal(false)
                    api.put('/users/me', { profile_mode: m.value }).catch(() => {})
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors text-left ${
                    profileMode === m.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${profileMode === m.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <Users className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{m.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>
                  </div>
                  {profileMode === m.value && (
                    <span className="shrink-0 text-[11px] font-bold text-primary">Actif</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal — Ajouter / modifier enfant */}
      {showAddModal && (
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-foreground">
                {editChild ? 'Modifier le profil' : 'Ajouter un enfant'}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                <X className="w-4 h-4 shrink-0" />
              </button>
            </div>

            {formError && (
              <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-xl px-3 py-2">{formError}</p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <input
                className="rounded-xl border border-border bg-muted px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Prénom *"
                value={form.firstname}
                onChange={(e) => setForm((f) => ({ ...f, firstname: e.target.value }))}
              />
              <input
                className="rounded-xl border border-border bg-muted px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Nom *"
                value={form.lastname}
                onChange={(e) => setForm((f) => ({ ...f, lastname: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block mb-1.5">Date de naissance</label>
              <input
                type="date"
                className="w-full rounded-xl border border-border bg-muted px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                value={form.birthdate}
                onChange={(e) => setForm((f) => ({ ...f, birthdate: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block mb-1.5">Genre</label>
              <div className="flex gap-2">
                {[{ v: 'male', l: 'Garçon' }, { v: 'female', l: 'Fille' }, { v: 'prefer_not_to_say', l: 'Non précisé' }].map(({ v, l }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, gender: v as any }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-colors ${
                      form.gender === v ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <input
              className="w-full rounded-xl border border-border bg-muted px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Téléphone (optionnel)"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors active:scale-95"
              >
                Annuler
              </button>
              <button
                onClick={submit}
                disabled={submitting || !form.firstname || !form.lastname}
                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
              >
                {submitting ? 'Enregistrement…' : editChild ? 'Modifier' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FamilyPage
