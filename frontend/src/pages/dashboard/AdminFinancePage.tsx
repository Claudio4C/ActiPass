import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import {
  CreditCard, TrendingUp, Clock, AlertCircle,
  Download, Loader2, CheckCircle2, Receipt, X,
  Mail, Users, ExternalLink,
} from 'lucide-react'
import RoleBasedRoute from '../../components/shared/RoleBasedRoute'
import { api } from '../../lib/api'
import { cn } from '../../lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminPayment {
  id: string
  amount: number
  currency: string
  status: 'paid' | 'pending' | 'failed' | 'refunded'
  created_at: string
  paid_at: string | null
  user: { firstname: string; lastname: string; email: string }
  subscription_plan: { name: string; amount: number } | null
}

interface UnpaidMember {
  userId: string
  firstname: string
  lastname: string
  email: string
  joined_at: string
  membership_id: string
}

type FilterKey = 'all' | 'paid' | 'pending' | 'failed'
type TabKey    = 'payments' | 'unpaid'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtAmount = (euros: number) =>
  euros.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

const AVATAR_COLORS = [
  'hsl(217,91%,60%)', 'hsl(280,70%,60%)', 'hsl(25,95%,53%)',
  'hsl(160,84%,39%)', 'hsl(340,75%,55%)',
]
const avatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]

const STATUS_META: Record<string, { label: string; badge: string; icon: React.ComponentType<{ className?: string }> }> = {
  paid: { label: 'Payé', badge: 'bg-emerald-500/10 text-emerald-700', icon: CheckCircle2 },
  pending: { label: 'En attente', badge: 'bg-amber-500/10 text-amber-700', icon: Clock },
  failed: { label: 'Échoué', badge: 'bg-destructive/10 text-destructive', icon: AlertCircle },
  refunded: { label: 'Remboursé', badge: 'bg-muted text-muted-foreground', icon: Receipt },
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

const KpiCard: React.FC<{
  icon: React.ReactNode
  label: string
  value: string
  tone?: 'default' | 'warn' | 'danger'
}> = ({ icon, label, value, tone = 'default' }) => {
  const valueColor =
    tone === 'warn'   ? 'text-amber-600' :
      tone === 'danger' ? 'text-destructive' :
        'text-foreground'
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3">
      <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className={cn('font-display text-2xl font-bold mt-0.5', valueColor)}>{value}</p>
      </div>
    </div>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const meta = STATUS_META[status] ?? STATUS_META.pending
  const Icon = meta.icon
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full', meta.badge)}>
      <Icon className="w-3 h-3 shrink-0" />
      {meta.label}
    </span>
  )
}

// ─── Export CSV ───────────────────────────────────────────────────────────────

function exportCsv(payments: AdminPayment[]) {
  const header = ['Prénom', 'Nom', 'Email', 'Formule', 'Montant (€)', 'Statut', 'Date paiement']
  const rows = payments.map(p => [
    p.user.firstname,
    p.user.lastname,
    p.user.email,
    p.subscription_plan?.name ?? '—',
    Number(p.amount).toFixed(2),
    STATUS_META[p.status]?.label ?? p.status,
    p.paid_at ? fmtDate(p.paid_at) : '—',
  ])
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `paiements-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Filter pills ─────────────────────────────────────────────────────────────

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',     label: 'Tous' },
  { key: 'paid',    label: 'Payés' },
  { key: 'pending', label: 'En attente' },
  { key: 'failed',  label: 'Échoués' },
]

// ─── Refund confirmation modal ────────────────────────────────────────────────

const RefundModal: React.FC<{
  payment: AdminPayment
  onConfirm: () => void
  onClose: () => void
  loading: boolean
}> = ({ payment, onConfirm, onClose, loading }) => (
  <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-card border border-border rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-bold text-foreground">Confirmer le remboursement</h3>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
        >
          <X className="w-4 w-4 shrink-0" />
        </button>
      </div>
      <p className="text-sm text-muted-foreground">
        Rembourser{' '}
        <span className="font-semibold text-foreground">{fmtAmount(Number(payment.amount))}</span>{' '}
        à{' '}
        <span className="font-semibold text-foreground">{payment.user.firstname}</span>{' '}?
        Cette action est irréversible.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          disabled={loading}
          className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors active:scale-95 disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 px-4 py-2.5 bg-destructive text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : null}
          {loading ? 'Remboursement…' : 'Confirmer le remboursement'}
        </button>
      </div>
    </div>
  </div>
)

// ─── Main ─────────────────────────────────────────────────────────────────────

const AdminFinancePage: React.FC = () => {
  const { organisationId } = useParams<{ organisationId: string }>()

  // ── Payments tab state ─────────────────────────────────────────────────────
  const [payments,      setPayments]      = useState<AdminPayment[]>([])
  const [loading,       setLoading]       = useState(true)
  const [filter,        setFilter]        = useState<FilterKey>('all')
  const [refundTarget,  setRefundTarget]  = useState<AdminPayment | null>(null)
  const [refundLoading, setRefundLoading] = useState(false)
  const [receiptLoading, setReceiptLoading] = useState<string | null>(null)

  // ── Unpaid tab state ───────────────────────────────────────────────────────
  const [activeTab,     setActiveTab]     = useState<TabKey>('payments')
  const [unpaid,        setUnpaid]        = useState<UnpaidMember[]>([])
  const [unpaidLoading, setUnpaidLoading] = useState(false)
  const [unpaidFetched, setUnpaidFetched] = useState(false)
  const [remindingId,   setRemindingId]   = useState<string | null>(null)
  const [remindingAll,  setRemindingAll]  = useState(false)
  const [remindedIds,   setRemindedIds]   = useState<Set<string>>(new Set())

  // ── Toast ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  // ── Load payments ──────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!organisationId) { return }
    setLoading(true)
    try {
      const data = await api.get<AdminPayment[]>(`/payments/admin/${organisationId}`)
      setPayments(Array.isArray(data) ? data : [])
    } catch {
      setPayments([])
    } finally {
      setLoading(false)
    }
  }, [organisationId])

  useEffect(() => { load() }, [load])

  // ── Load unpaid members ────────────────────────────────────────────────────
  const loadUnpaid = useCallback(async () => {
    if (!organisationId) { return }
    setUnpaidLoading(true)
    try {
      const data = await api.get<UnpaidMember[]>(`/organisations/${organisationId}/payments/unpaid-members`)
      setUnpaid(Array.isArray(data) ? data : [])
    } catch {
      setUnpaid([])
    } finally {
      setUnpaidLoading(false)
      setUnpaidFetched(true)
    }
  }, [organisationId])

  useEffect(() => {
    if (activeTab === 'unpaid' && !unpaidFetched) {
      void loadUnpaid()
    }
  }, [activeTab, unpaidFetched, loadUnpaid])

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const kpis = useMemo(() => ({
    total: payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0),
    month: payments.filter(p => p.status === 'paid' && p.paid_at?.startsWith(thisMonth)).reduce((s, p) => s + Number(p.amount), 0),
    pending: payments.filter(p => p.status === 'pending').length,
    failed: payments.filter(p => p.status === 'failed').length,
  }), [payments, thisMonth])

  const displayed = useMemo(() =>
    filter === 'all' ? payments : payments.filter(p => p.status === filter),
  [payments, filter])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleReceipt = async (paymentId: string) => {
    setReceiptLoading(paymentId)
    try {
      const { receipt_url } = await api.get<{ receipt_url: string | null }>(`/payments/${paymentId}/receipt-url`)
      if (receipt_url) {
        window.open(receipt_url, '_blank')
      } else {
        showToast('Reçu non disponible')
      }
    } catch {
      showToast('Impossible de récupérer le reçu')
    } finally {
      setReceiptLoading(null)
    }
  }

  const handleRefundConfirm = async () => {
    if (!refundTarget) { return }
    setRefundLoading(true)
    try {
      const { amount } = await api.post<{ refunded: boolean; amount: number }>(
        `/payments/${refundTarget.id}/refund`,
      )
      showToast(`Remboursement de ${fmtAmount(amount)} effectué`)
      setRefundTarget(null)
      await load()
    } catch {
      showToast('Erreur lors du remboursement')
    } finally {
      setRefundLoading(false)
    }
  }

  const handleRemind = async (member: UnpaidMember) => {
    if (!organisationId) { return }
    setRemindingId(member.userId)
    try {
      await api.post(`/organisations/${organisationId}/payments/remind/${member.userId}`)
      setRemindedIds(prev => new Set(prev).add(member.userId))
      showToast(`Relance envoyée à ${member.firstname}`)
    } catch {
      showToast('Erreur lors de la relance')
    } finally {
      setRemindingId(null)
    }
  }

  const handleRemindAll = async () => {
    if (!organisationId || remindingAll) { return }
    setRemindingAll(true)
    let count = 0
    for (const m of unpaid) {
      if (remindedIds.has(m.userId)) { continue }
      try {
        await api.post(`/organisations/${organisationId}/payments/remind/${m.userId}`)
        setRemindedIds(prev => new Set(prev).add(m.userId))
        count++
      } catch { /* continue */ }
    }
    showToast(`${count} relance${count !== 1 ? 's' : ''} envoyée${count !== 1 ? 's' : ''}`)
    setRemindingAll(false)
  }

  return (
    <RoleBasedRoute allowedRoles={['club_owner', 'club_manager', 'treasurer']}>
      <div className="space-y-6">

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-foreground text-background text-sm font-semibold rounded-full shadow-lg">
            {toast}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Finances</h1>
            <p className="text-sm text-muted-foreground mt-1">Suivi des paiements de cotisation</p>
          </div>
          {activeTab === 'payments' && payments.length > 0 && (
            <button
              onClick={() => exportCsv(displayed)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Download className="w-4 h-4 shrink-0" />
              Exporter CSV
            </button>
          )}
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-2 border-b border-border">
          {([
            { key: 'payments' as TabKey, label: 'Paiements' },
            { key: 'unpaid'   as TabKey, label: 'Impayés' },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px',
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
              {tab.key === 'unpaid' && unpaidFetched && unpaid.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-destructive text-white text-[10px] font-bold">
                  {unpaid.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── TAB : Paiements ───────────────────────────────────────────────── */}
        {activeTab === 'payments' && (
          loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* KPI cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard icon={<TrendingUp className="w-5 h-5 text-emerald-600 shrink-0" />} label="CA total" value={fmtAmount(kpis.total)} />
                <KpiCard icon={<CreditCard className="w-5 h-5 text-primary shrink-0" />} label="Ce mois" value={fmtAmount(kpis.month)} />
                <KpiCard icon={<Clock className="w-5 h-5 text-amber-600 shrink-0" />} label="En attente" value={String(kpis.pending)} tone="warn" />
                <KpiCard icon={<AlertCircle className="w-5 h-5 text-destructive shrink-0" />} label="Échoués" value={String(kpis.failed)} tone="danger" />
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-2 flex-wrap">
                {FILTERS.map(f => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={cn(
                      'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                      filter === f.key
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {f.label}
                    {f.key !== 'all' && (
                      <span className="ml-1.5 text-[11px] opacity-70">
                        {payments.filter(p => p.status === f.key).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Table / empty state */}
              {displayed.length === 0 ? (
                <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-primary shrink-0" />
                  </div>
                  <p className="text-sm text-muted-foreground">Aucun paiement enregistré pour le moment.</p>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/40">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Membre</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Formule</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Montant</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {displayed.map(p => (
                          <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-medium text-foreground">{p.user.firstname} {p.user.lastname}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{p.user.email}</p>
                            </td>
                            <td className="px-4 py-3 text-foreground">
                              {p.subscription_plan?.name ?? <span className="text-muted-foreground">—</span>}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-foreground">
                              {fmtAmount(Number(p.amount))}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={p.status} />
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {p.paid_at ? fmtDate(p.paid_at) : fmtDate(p.created_at)}
                            </td>
                            <td className="px-4 py-3">
                              {p.status === 'paid' && (
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => void handleReceipt(p.id)}
                                    disabled={receiptLoading === p.id}
                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
                                  >
                                    {receiptLoading === p.id
                                      ? <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                                      : <ExternalLink className="w-3 h-3 shrink-0" />}
                                    Reçu
                                  </button>
                                  <button
                                    onClick={() => setRefundTarget(p)}
                                    className="text-xs text-destructive hover:underline"
                                  >
                                    Rembourser
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-3 border-t border-border bg-muted/20">
                    <p className="text-xs text-muted-foreground">
                      {displayed.length} paiement{displayed.length > 1 ? 's' : ''}
                      {filter !== 'all' ? ` · filtre : ${FILTERS.find(f => f.key === filter)?.label}` : ''}
                    </p>
                  </div>
                </div>
              )}
            </>
          )
        )}

        {/* ── TAB : Impayés ─────────────────────────────────────────────────── */}
        {activeTab === 'unpaid' && (
          unpaidLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
            </div>
          ) : unpaid.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              </div>
              <p className="text-sm text-muted-foreground">Tous les membres ont réglé leur cotisation 🎉</p>
            </div>
          ) : (
            <div className="space-y-4">

              {/* Header badge + relancer tous */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive text-sm font-semibold animate-pulse">
                  <Users className="w-4 h-4 shrink-0" />
                  {unpaid.length} membre{unpaid.length !== 1 ? 's' : ''} sans paiement
                </span>
                <button
                  onClick={() => void handleRemindAll()}
                  disabled={remindingAll || unpaid.every(m => remindedIds.has(m.userId))}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 active:scale-95 transition-all disabled:opacity-50"
                >
                  {remindingAll
                    ? <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    : <Mail className="w-4 h-4 shrink-0" />}
                  Relancer tous
                </button>
              </div>

              {/* Member list */}
              <div className="space-y-2">
                {unpaid.map(m => {
                  const reminded  = remindedIds.has(m.userId)
                  const reminding = remindingId === m.userId
                  return (
                    <div key={m.userId} className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3">
                      <div
                        className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white"
                        style={{ backgroundColor: avatarColor(m.firstname) }}
                      >
                        {m.firstname.charAt(0)}{m.lastname.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {m.firstname} {m.lastname}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Membre depuis le {fmtDate(m.joined_at)}
                        </p>
                      </div>
                      <button
                        onClick={() => void handleRemind(m)}
                        disabled={reminding || reminded}
                        className={cn(
                          'shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold active:scale-95 transition-all disabled:opacity-60',
                          reminded
                            ? 'bg-emerald-500/10 text-emerald-700'
                            : 'bg-amber-500/15 text-amber-700 hover:bg-amber-500/25',
                        )}
                      >
                        {reminding
                          ? <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                          : reminded
                            ? <CheckCircle2 className="w-3 h-3 shrink-0" />
                            : <Mail className="w-3 h-3 shrink-0" />}
                        {reminded ? 'Relancé ✓' : 'Relancer'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        )}

        {/* Refund modal */}
        {refundTarget && (
          <RefundModal
            payment={refundTarget}
            onConfirm={() => void handleRefundConfirm()}
            onClose={() => setRefundTarget(null)}
            loading={refundLoading}
          />
        )}
      </div>
    </RoleBasedRoute>
  )
}

export default AdminFinancePage
