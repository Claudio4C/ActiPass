import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  CreditCard, CheckCircle2, Clock, AlertCircle, Loader2,
  ChevronRight, Receipt, ExternalLink,
} from 'lucide-react'
import { api } from '../../lib/api'
import { cn } from '../../lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

const AUDIENCE_LABEL: Record<string, string> = {
  enfant:   '👶 Enfant',
  adulte:   '🧑 Adulte',
  famille:  '👨‍👩‍👧‍👦 Famille',
  etudiant: '🎓 Étudiant',
  senior:   '🧓 Senior',
}

interface Plan {
  id: string
  name: string
  description: string | null
  amount: number
  currency: string
  max_installments: number
  is_active: boolean
  target_audience: string | null
  season: { id: string; name: string } | null
}

interface Payment {
  id: string
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  created_at: string
  paid_at: string | null
  installment_number: number
  total_installments: number
  subscription_plan_id: string | null
  subscription_plan: { name: string; amount: number } | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtAmount = (cents: number) =>
  (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

const PAYMENT_STATUS: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  paid:    { label: 'Payé',        color: 'text-emerald-600',       icon: CheckCircle2 },
  pending: { label: 'En attente',  color: 'text-amber-600',         icon: Clock },
  failed:  { label: 'Échoué',      color: 'text-destructive',       icon: AlertCircle },
  refunded:{ label: 'Remboursé',   color: 'text-muted-foreground',  icon: Receipt },
}

// ─── Plan card ────────────────────────────────────────────────────────────────

const PlanCard: React.FC<{
  plan: Plan
  onPay: (planId: string) => void
  paying: boolean
  alreadyPaid: boolean
}> = ({ plan, onPay, paying, alreadyPaid }) => (
  <div className="bg-card border border-border rounded-2xl p-5 flex items-start justify-between gap-4">
    <div className="min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="font-semibold text-foreground">{plan.name}</p>
        {plan.season && (
          <span className="text-[10px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
            {plan.season.name}
          </span>
        )}
        {plan.target_audience && (
          <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {AUDIENCE_LABEL[plan.target_audience] ?? plan.target_audience}
          </span>
        )}
        {plan.max_installments > 1 && (
          <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {plan.max_installments}× possible
          </span>
        )}
        {alreadyPaid && (
          <span className="text-[10px] font-medium bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 shrink-0" /> Payé
          </span>
        )}
      </div>
      {plan.description && (
        <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
      )}
      <p className="font-display text-xl font-bold text-foreground mt-2">
        {fmtAmount(plan.amount)}
      </p>
    </div>
    <button
      onClick={() => onPay(plan.id)}
      disabled={paying || alreadyPaid}
      className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl active:scale-95 transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {paying ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
      {alreadyPaid ? 'Déjà payé' : 'Payer'}
    </button>
  </div>
)

// ─── Payment history row ──────────────────────────────────────────────────────

const PaymentRow: React.FC<{ payment: Payment; orgId: string }> = ({ payment, orgId }) => {
  const meta = PAYMENT_STATUS[payment.status] ?? PAYMENT_STATUS.pending
  const Icon = meta.icon
  const [receiptLoading, setReceiptLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const handleReceipt = async () => {
    setReceiptLoading(true)
    try {
      const { receipt_url } = await api.get<{ receipt_url: string | null }>(`/payments/${payment.id}/receipt-url`)
      if (receipt_url) {
        window.open(receipt_url, '_blank')
      } else {
        setToast('Reçu non disponible')
        setTimeout(() => setToast(null), 3000)
      }
    } catch {
      setToast('Impossible de récupérer le reçu')
      setTimeout(() => setToast(null), 3000)
    } finally {
      setReceiptLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0 relative">
      {toast && (
        <div className="absolute -top-8 left-0 right-0 text-center text-xs text-muted-foreground bg-card border border-border rounded-lg px-2 py-1">
          {toast}
        </div>
      )}
      <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center bg-muted shrink-0')}>
        <Icon className={cn('w-4 h-4 shrink-0', meta.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {payment.subscription_plan?.name ?? 'Cotisation'}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {fmtDate(payment.paid_at ?? payment.created_at)}
        </p>
      </div>
      <div className="text-right shrink-0 space-y-1">
        <p className="text-sm font-semibold text-foreground">{fmtAmount(payment.amount * 100)}</p>
        <p className={cn('text-xs font-medium', meta.color)}>{meta.label}</p>
        {payment.status === 'paid' && (
          <button
            onClick={() => void handleReceipt()}
            disabled={receiptLoading}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
          >
            {receiptLoading
              ? <Loader2 className="w-3 h-3 animate-spin shrink-0" />
              : <ExternalLink className="w-3 h-3 shrink-0" />}
            Voir le reçu
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const PaymentPage: React.FC = () => {
  const { orgId } = useParams<{ orgId: string }>()
  const navigate = useNavigate()

  const [plans,    setPlans]    = useState<Plan[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading,  setLoading]  = useState(true)
  const [paying,   setPaying]   = useState<string | null>(null)
  const [error,    setError]    = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!orgId) { return }
    setLoading(true)
    setError(null)
    try {
      const [plansData, paymentsData] = await Promise.all([
        api.get<Plan[]>(`/organisations/${orgId}/plans`).catch(() => []),
        api.get<Payment[]>(`/payments/my/${orgId}`).catch(() => []),
      ])
      const active = Array.isArray(plansData) ? plansData.filter(p => p.is_active) : []
      setPlans(active.sort((a, b) =>
        (a.target_audience ? 0 : 1) - (b.target_audience ? 0 : 1)
      ))
      setPayments(Array.isArray(paymentsData) ? paymentsData : [])
    } catch {
      setError('Impossible de charger les informations de paiement.')
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => { load() }, [load])

  const hasPaid = payments.some(p => p.status === 'paid')

  const handlePay = async (planId: string) => {
    if (!orgId || paying) { return }
    setPaying(planId)
    setError(null)
    try {
      const { checkout_url } = await api.post<{ checkout_url: string }>('/payments/checkout', {
        planId,
        organisationId: orgId,
      })
      if (checkout_url) {
        window.location.href = checkout_url
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue lors de la création du paiement.'
      setError(msg)
      setPaying(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Cotisation</h2>
        <p className="text-sm text-muted-foreground mt-1">Réglez votre adhésion en ligne en toute sécurité</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-destructive/5 border border-destructive/20 rounded-2xl">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Already paid banner */}
      {hasPaid && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-700">Cotisation réglée</p>
            <p className="text-xs text-emerald-600/80 mt-0.5">Votre cotisation pour cette saison est à jour.</p>
          </div>
        </div>
      )}

      {/* Plans */}
      {!hasPaid && plans.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Formules disponibles
          </h3>
          {plans.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onPay={handlePay}
              paying={paying === plan.id}
              alreadyPaid={payments.some(p => p.subscription_plan_id === plan.id && p.status === 'paid')}
            />
          ))}
        </div>
      )}

      {!hasPaid && plans.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-muted-foreground shrink-0" />
          </div>
          <p className="text-sm text-muted-foreground">Aucune formule de cotisation disponible pour le moment.</p>
        </div>
      )}

      {/* Payment history */}
      {payments.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Historique des paiements</h3>
          </div>
          <div className="px-5">
            {payments.map(p => <PaymentRow key={p.id} payment={p} orgId={orgId ?? ''} />)}
          </div>
        </div>
      )}

      {/* Stripe security note */}
      <p className="text-xs text-muted-foreground text-center">
        Paiement sécurisé par{' '}
        <span className="font-semibold text-foreground">Stripe</span>.
        Vos données bancaires ne transitent pas par nos serveurs.
      </p>

      <button
        onClick={() => navigate(`/club/${orgId}`)}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Retour à l'espace membre
      </button>
    </div>
  )
}

export default PaymentPage
