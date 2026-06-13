import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import {
  CreditCard, TrendingUp, Clock, AlertCircle,
  Download, Loader2, CheckCircle2, Receipt,
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

type FilterKey = 'all' | 'paid' | 'pending' | 'failed'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtAmount = (euros: number) =>
  euros.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

const STATUS_META: Record<string, { label: string; badge: string; icon: React.ComponentType<{ className?: string }> }> = {
  paid: { label: 'Payé',       badge: 'bg-emerald-500/10 text-emerald-700',     icon: CheckCircle2 },
  pending: { label: 'En attente', badge: 'bg-amber-500/10 text-amber-700',         icon: Clock },
  failed: { label: 'Échoué',     badge: 'bg-destructive/10 text-destructive',     icon: AlertCircle },
  refunded: { label: 'Remboursé',  badge: 'bg-muted text-muted-foreground',         icon: Receipt },
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

// ─── Main ─────────────────────────────────────────────────────────────────────

const AdminFinancePage: React.FC = () => {
  const { organisationId } = useParams<{ organisationId: string }>()

  const [payments, setPayments] = useState<AdminPayment[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState<FilterKey>('all')

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

  // ── KPIs ──────────────────────────────────────────────────────────────────

  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const kpis = useMemo(() => ({
    total: payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0),
    month: payments.filter(p => p.status === 'paid' && p.paid_at?.startsWith(thisMonth)).reduce((s, p) => s + Number(p.amount), 0),
    pending: payments.filter(p => p.status === 'pending').length,
    failed: payments.filter(p => p.status === 'failed').length,
  }), [payments, thisMonth])

  // ── Filtered list ─────────────────────────────────────────────────────────

  const displayed = useMemo(() =>
    filter === 'all' ? payments : payments.filter(p => p.status === filter),
  [payments, filter],
  )

  return (
    <RoleBasedRoute allowedRoles={['club_owner', 'club_manager', 'treasurer']}>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Finances</h1>
            <p className="text-sm text-muted-foreground mt-1">Suivi des paiements de cotisation</p>
          </div>
          {payments.length > 0 && (
            <button
              onClick={() => exportCsv(displayed)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Download className="w-4 h-4 shrink-0" />
              Exporter CSV
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                icon={<TrendingUp className="w-5 h-5 text-emerald-600 shrink-0" />}
                label="CA total"
                value={fmtAmount(kpis.total)}
              />
              <KpiCard
                icon={<CreditCard className="w-5 h-5 text-primary shrink-0" />}
                label="Ce mois"
                value={fmtAmount(kpis.month)}
              />
              <KpiCard
                icon={<Clock className="w-5 h-5 text-amber-600 shrink-0" />}
                label="En attente"
                value={String(kpis.pending)}
                tone="warn"
              />
              <KpiCard
                icon={<AlertCircle className="w-5 h-5 text-destructive shrink-0" />}
                label="Échoués"
                value={String(kpis.failed)}
                tone="danger"
              />
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {displayed.map(p => (
                        <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground">
                              {p.user.firstname} {p.user.lastname}
                            </p>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer count */}
                <div className="px-4 py-3 border-t border-border bg-muted/20">
                  <p className="text-xs text-muted-foreground">
                    {displayed.length} paiement{displayed.length > 1 ? 's' : ''}
                    {filter !== 'all' ? ` · filtre : ${FILTERS.find(f => f.key === filter)?.label}` : ''}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </RoleBasedRoute>
  )
}

export default AdminFinancePage
