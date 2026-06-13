import React, { useCallback, useEffect, useState } from 'react'
import { Check, ChevronDown, ChevronUp, Loader2, Pencil, Plus, X } from 'lucide-react'
import { api } from '../../lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Season {
  id: string
  name: string
  is_active: boolean
}

interface SubscriptionPlan {
  id: string
  name: string
  description: string | null
  amount: number
  currency: string
  stripe_price_id: string | null
  max_installments: number
  is_active: boolean
  target_audience: string | null
  created_at: string
  season: { id: string; name: string } | null
  payment_count: number
}

interface PlansSectionProps {
  orgId: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtAmount = (cents: number) =>
  (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

const inputCls =
  'w-full h-10 px-3 rounded-xl border border-border bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors'

const INSTALLMENTS = [
  { value: 1, label: '1x (paiement unique)' },
  { value: 2, label: '2x' },
  { value: 3, label: '3x' },
]

const AUDIENCE_OPTIONS = [
  { value: '',         label: 'Tous (non spécifié)' },
  { value: 'enfant',   label: '👶 Enfant' },
  { value: 'adulte',   label: '🧑 Adulte' },
  { value: 'famille',  label: '👨‍👩‍👧‍👦 Famille' },
  { value: 'etudiant', label: '🎓 Étudiant' },
  { value: 'senior',   label: '🧓 Senior' },
]

// ─── PlanCard ─────────────────────────────────────────────────────────────────

const PlanCard: React.FC<{
  plan: SubscriptionPlan
  onEdit: (plan: SubscriptionPlan) => void
  onToggle: (plan: SubscriptionPlan) => void
  onDelete: (plan: SubscriptionPlan) => void
  saving: boolean
}> = ({ plan, onEdit, onToggle, onDelete, saving }) => (
  <div className="border border-border rounded-2xl p-4 bg-card space-y-2">
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-display font-bold text-sm text-foreground truncate">{plan.name}</p>
          {plan.is_active
            ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 shrink-0">Actif</span>
            : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">Inactif</span>}
          {plan.max_installments > 1 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
              Paiement en {plan.max_installments}x
            </span>
          )}
          {plan.target_audience && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
              {AUDIENCE_OPTIONS.find(o => o.value === plan.target_audience)?.label ?? plan.target_audience}
            </span>
          )}
        </div>
        <p className="font-display text-lg font-bold text-primary mt-0.5">{fmtAmount(plan.amount)}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          {plan.season && <span>{plan.season.name}</span>}
          {plan.payment_count > 0 && (
            <span className="flex items-center gap-1">
              <Check className="w-3 h-3 shrink-0" />
              {plan.payment_count} paiement{plan.payment_count > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {plan.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{plan.description}</p>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onEdit(plan)}
          disabled={saving}
          className="w-8 h-8 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors active:scale-95 disabled:opacity-40"
          title="Modifier"
        >
          <Pencil className="w-3.5 h-3.5 shrink-0" />
        </button>
        <button
          onClick={() => onToggle(plan)}
          disabled={saving}
          className="w-8 h-8 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors active:scale-95 disabled:opacity-40"
          title={plan.is_active ? 'Désactiver' : 'Activer'}
        >
          {plan.is_active
            ? <ChevronDown className="w-3.5 h-3.5 shrink-0" />
            : <ChevronUp className="w-3.5 h-3.5 shrink-0" />}
        </button>
        {plan.payment_count === 0 && (
          <button
            onClick={() => onDelete(plan)}
            disabled={saving}
            className="w-8 h-8 rounded-xl border border-destructive/30 flex items-center justify-center text-destructive/60 hover:text-destructive hover:border-destructive/60 transition-colors active:scale-95 disabled:opacity-40"
            title="Supprimer"
          >
            <X className="w-3.5 h-3.5 shrink-0" />
          </button>
        )}
      </div>
    </div>
  </div>
)

// ─── EditForm ─────────────────────────────────────────────────────────────────

const EditForm: React.FC<{
  plan: SubscriptionPlan
  onSave: (data: { name: string; description: string; is_active: boolean; max_installments: number; target_audience: string | null }) => void
  onCancel: () => void
  saving: boolean
}> = ({ plan, onSave, onCancel, saving }) => {
  const [name, setName] = useState(plan.name)
  const [description, setDescription] = useState(plan.description ?? '')
  const [isActive, setIsActive] = useState(plan.is_active)
  const [installments, setInstallments] = useState(plan.max_installments)
  const [audience, setAudience] = useState(plan.target_audience ?? '')

  return (
    <div className="border border-primary/30 rounded-2xl p-4 bg-primary/5 space-y-3">
      <p className="text-xs font-bold uppercase tracking-wider text-primary">Modifier la formule</p>
      <div className="space-y-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom de la formule"
          className={inputCls}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optionnel)"
          rows={2}
          className="w-full px-3 py-2 rounded-xl border border-border bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
        />
        <div className="grid grid-cols-2 gap-2">
          <select
            value={installments}
            onChange={(e) => setInstallments(Number(e.target.value))}
            className={inputCls}
          >
            {INSTALLMENTS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <div
            onClick={() => setIsActive((v) => !v)}
            className="flex items-center justify-between px-3 h-10 rounded-xl border border-border bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
          >
            <span className="text-sm text-foreground">{isActive ? 'Actif' : 'Inactif'}</span>
            <div className={`w-9 h-5 rounded-full shrink-0 flex items-center px-0.5 transition-colors ${isActive ? 'bg-primary' : 'bg-border'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </div>
        </div>
        <select
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          className={inputCls}
        >
          {AUDIENCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSave({ name, description, is_active: isActive, max_installments: installments, target_audience: audience || null })}
          disabled={saving || !name.trim()}
          className="flex-1 h-9 bg-primary text-primary-foreground rounded-xl font-bold text-sm inline-flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-95 transition-transform disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" /> : 'Enregistrer'}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="h-9 px-4 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}

// ─── CreateForm ───────────────────────────────────────────────────────────────

const CreateForm: React.FC<{
  seasons: Season[]
  onSave: (data: { name: string; amount: number; seasonId?: string; max_installments: number; description?: string; target_audience?: string | null }) => void
  onCancel: () => void
  saving: boolean
}> = ({ seasons, onSave, onCancel, saving }) => {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [seasonId, setSeasonId] = useState('')
  const [installments, setInstallments] = useState(1)
  const [description, setDescription] = useState('')
  const [audience, setAudience] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    const amountVal = parseFloat(amount.replace(',', '.'))
    if (!name.trim()) { setError('Le nom est requis.'); return }
    if (isNaN(amountVal) || amountVal < 1) { setError('Montant invalide (minimum 1 €).'); return }
    setError(null)
    onSave({
      name: name.trim(),
      amount: amountVal,
      seasonId: seasonId || undefined,
      max_installments: installments,
      description: description.trim() || undefined,
      target_audience: audience || null,
    })
  }

  return (
    <div className="border border-dashed border-border rounded-2xl p-4 space-y-3">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nouvelle formule</p>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="space-y-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom (ex: Adulte 2025-2026) *"
          className={inputCls}
        />
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Montant (€) *"
              className={inputCls}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">€</span>
          </div>
          <select
            value={installments}
            onChange={(e) => setInstallments(Number(e.target.value))}
            className={inputCls}
          >
            {INSTALLMENTS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        {seasons.length > 0 && (
          <select
            value={seasonId}
            onChange={(e) => setSeasonId(e.target.value)}
            className={inputCls}
          >
            <option value="">Saison (optionnel)</option>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>{s.name}{s.is_active ? ' ✓' : ''}</option>
            ))}
          </select>
        )}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optionnel)"
          rows={2}
          className="w-full px-3 py-2 rounded-xl border border-border bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
        />
        <select
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          className={inputCls}
        >
          {AUDIENCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={saving}
          className="flex-1 h-9 bg-primary text-primary-foreground rounded-xl font-bold text-sm inline-flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-95 transition-transform disabled:opacity-50"
        >
          {saving
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" /> Création…</>
            : 'Créer la formule'}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="h-9 px-4 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}

// ─── PlansSection (main export) ───────────────────────────────────────────────

const PlansSection: React.FC<PlansSectionProps> = ({ orgId }) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchPlans = useCallback(async () => {
    try {
      const res = await api.get<SubscriptionPlan[]>(`/organisations/${orgId}/plans`, undefined, { useCache: false })
      setPlans(res)
    } catch {
      setError('Impossible de charger les formules.')
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    fetchPlans()
    api.get<{ id: string; name: string; is_active: boolean }[]>(
      `/organisations/${orgId}/seasons`,
      undefined,
      { useCache: true, cacheTTL: 60000 },
    ).then(setSeasons).catch(() => {})
  }, [orgId, fetchPlans])

  const handleCreate = async (data: {
    name: string; amount: number; seasonId?: string; max_installments: number; description?: string; target_audience?: string | null
  }) => {
    setSaving(true)
    setError(null)
    try {
      const plan = await api.post<SubscriptionPlan>(`/organisations/${orgId}/plans`, {
        name: data.name,
        amount: data.amount,
        seasonId: data.seasonId,
        max_installments: data.max_installments,
        description: data.description,
        target_audience: data.target_audience,
      })
      setPlans((prev) => [plan, ...prev])
      setShowCreate(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la création.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (planId: string, data: {
    name: string; description: string; is_active: boolean; max_installments: number; target_audience: string | null
  }) => {
    setSaving(true)
    setError(null)
    try {
      const updated = await api.patch<SubscriptionPlan>(
        `/organisations/${orgId}/plans/${planId}`,
        { name: data.name, description: data.description || null, is_active: data.is_active, max_installments: data.max_installments, target_audience: data.target_audience },
      )
      setPlans((prev) => prev.map((p) => (p.id === planId ? updated : p)))
      setEditingPlan(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la modification.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (plan: SubscriptionPlan) => {
    setSaving(true)
    setError(null)
    try {
      const updated = await api.patch<SubscriptionPlan>(
        `/organisations/${orgId}/plans/${plan.id}`,
        { is_active: !plan.is_active },
      )
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? updated : p)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (planId: string) => {
    setSaving(true)
    setError(null)
    try {
      await api.delete(`/organisations/${orgId}/plans/${planId}`)
      setPlans((prev) => prev.filter((p) => p.id !== planId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la suppression.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-16">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground shrink-0" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-xs text-destructive px-1">{error}</p>}

      {plans.length === 0 && !showCreate && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Aucune formule créée pour l'instant.
        </p>
      )}

      {plans.map((plan) =>
        editingPlan?.id === plan.id ? (
          <EditForm
            key={plan.id}
            plan={plan}
            onSave={(data) => handleEdit(plan.id, data)}
            onCancel={() => setEditingPlan(null)}
            saving={saving}
          />
        ) : (
          <div key={plan.id}>
            <PlanCard
              plan={plan}
              onEdit={(p) => { setEditingPlan(p); setShowCreate(false); setConfirmDeleteId(null) }}
              onToggle={handleToggle}
              onDelete={(p) => setConfirmDeleteId(p.id)}
              saving={saving}
            />
            {confirmDeleteId === plan.id && (
              <div className="mt-2 p-3 rounded-xl bg-destructive/5 border border-destructive/20 space-y-2">
                <p className="text-xs font-semibold text-destructive">
                  Supprimer "{plan.name}" ? Cette action est irréversible.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="flex-1 py-1.5 rounded-lg bg-muted text-foreground text-xs font-semibold active:scale-95"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => { void handleDelete(plan.id); setConfirmDeleteId(null) }}
                    className="flex-1 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold active:scale-95"
                  >
                    Confirmer la suppression
                  </button>
                </div>
              </div>
            )}
          </div>
        ),
      )}

      {showCreate ? (
        <CreateForm
          seasons={seasons}
          onSave={handleCreate}
          onCancel={() => setShowCreate(false)}
          saving={saving}
        />
      ) : (
        <button
          onClick={() => { setShowCreate(true); setEditingPlan(null) }}
          disabled={saving}
          className="w-full h-11 border-2 border-dashed border-border rounded-2xl text-sm font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors active:scale-[0.99] inline-flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <Plus className="w-4 h-4 shrink-0" />
          Ajouter une formule
        </button>
      )}
    </div>
  )
}

export default PlansSection
