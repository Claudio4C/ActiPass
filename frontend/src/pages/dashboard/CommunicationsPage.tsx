import React, { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import {
  Users, FileX, CreditCard, Clock, UserCheck,
  Loader2, SendHorizonal, Mail, Bell, Layers, Trash2,
} from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'

// ── Types ────────────────────────────────────────────────────────────────────

type BroadcastTarget = 'all' | 'missing_documents' | 'unpaid' | 'waitlist' | 'manual'
type BroadcastChannel = 'email' | 'in_app' | 'both'

interface Member {
  id: string
  firstname: string
  lastname: string
  email: string
  status: string
}

interface BroadcastLog {
  id: string
  target: string
  subject: string
  message: string
  recipients_count: number
  created_at: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const TARGETS: { id: BroadcastTarget; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'all',               label: 'Tous les membres',      icon: Users },
  { id: 'missing_documents', label: 'Documents manquants',   icon: FileX },
  { id: 'unpaid',            label: 'Cotisation impayée',    icon: CreditCard },
  { id: 'waitlist',          label: "Liste d'attente",       icon: Clock },
  { id: 'manual',            label: 'Sélection manuelle',    icon: UserCheck },
]

const TARGET_LABELS: Record<BroadcastTarget, string> = {
  all:               'Tous les membres',
  missing_documents: 'Documents manquants',
  unpaid:            'Cotisation impayée',
  waitlist:          "Liste d'attente",
  manual:            'Sélection manuelle',
}

const CHANNELS: { id: BroadcastChannel; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'in_app', label: 'In-app',   icon: Bell },
  { id: 'email',  label: 'Email',    icon: Mail },
  { id: 'both',   label: 'Les deux', icon: Layers },
]

// ── Component ────────────────────────────────────────────────────────────────

const cardClass = 'bg-card border border-border rounded-2xl p-5'

const CommunicationsPage: React.FC = () => {
  const { organisationId } = useParams<{ organisationId: string }>()
  const { user } = useAuth()

  const [target, setTarget]           = useState<BroadcastTarget>('all')
  const [channel, setChannel]         = useState<BroadcastChannel>('both')
  const [subject, setSubject]         = useState('')
  const [message, setMessage]         = useState('')
  const [manualIds, setManualIds]     = useState<Set<string>>(new Set())

  const [recipientCount, setRecipientCount] = useState<number | null>(null)
  const [loadingCount, setLoadingCount]     = useState(false)

  const [members, setMembers]         = useState<Member[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  const [history, setHistory]         = useState<BroadcastLog[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  const [sending, setSending]               = useState(false)
  const [confirmOpen, setConfirmOpen]       = useState(false)
  const [confirmClear, setConfirmClear]     = useState(false)
  const [toast, setToast]                   = useState<string | null>(null)

  // ── Fetch recipient count ─────────────────────────────────────────────────

  const fetchCount = useCallback(async (t: BroadcastTarget) => {
    if (!organisationId || t === 'manual') {
      // Pour la sélection manuelle, exclure l'expéditeur du comptage
      const selfExcluded = user?.id && manualIds.has(user.id) ? manualIds.size - 1 : manualIds.size
      setRecipientCount(selfExcluded)
      return
    }
    setLoadingCount(true)
    try {
      const data = await api.get<{ count: number }>(
        `/organisations/${organisationId}/communications/recipients-count`,
        { target: t },
        { useCache: false },
      )
      // Le backend exclut l'expéditeur à l'envoi — on soustrait 1 si on est dans la liste
      // (le preview est une estimation, le vrai chiffre vient de l'envoi)
      setRecipientCount(data.count)
    } catch {
      setRecipientCount(null)
    } finally {
      setLoadingCount(false)
    }
  }, [organisationId, manualIds, user?.id])

  useEffect(() => { fetchCount(target) }, [target, fetchCount])

  // ── Fetch members for manual selection ───────────────────────────────────

  useEffect(() => {
    if (target !== 'manual' || !organisationId) return
    setLoadingMembers(true)
    api.get<{ id: string; firstname: string; lastname: string; email: string; status: string }[]>(
      `/organisations/${organisationId}/members`,
      undefined,
      { useCache: false },
    ).then(setMembers).catch(() => {}).finally(() => setLoadingMembers(false))
  }, [target, organisationId])

  useEffect(() => {
    if (target === 'manual') setRecipientCount(manualIds.size)
  }, [manualIds, target])

  // ── Fetch history ────────────────────────────────────────────────────────

  const fetchHistory = useCallback(async () => {
    if (!organisationId) return
    setLoadingHistory(true)
    try {
      const data = await api.get<BroadcastLog[]>(
        `/organisations/${organisationId}/communications/history`,
        undefined,
        { useCache: false },
      )
      setHistory(data)
    } catch {
      setHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }, [organisationId])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  // ── Send ──────────────────────────────────────────────────────────────────

  const handleClearHistory = async () => {
    if (!organisationId) return
    setConfirmClear(false)
    try {
      await api.delete(`/organisations/${organisationId}/communications/history`)
      setHistory([])
      setToast('Historique vidé.')
      setTimeout(() => setToast(null), 3000)
    } catch {
      setToast('Erreur lors de la suppression.')
      setTimeout(() => setToast(null), 3000)
    }
  }

  const handleSend = async () => {
    if (!organisationId) return
    setSending(true)
    setConfirmOpen(false)
    try {
      const body: Record<string, unknown> = { target, channel, subject, message }
      if (target === 'manual') body.member_ids = [...manualIds]
      const result = await api.post<{ sent: number }>(
        `/organisations/${organisationId}/communications/broadcast`,
        body,
      )
      setToast(`${result.sent} notification(s) envoyée(s).`)
      setSubject('')
      setMessage('')
      setManualIds(new Set())
      fetchHistory()
      setTimeout(() => setToast(null), 4000)
    } catch {
      setToast('Erreur lors de l\'envoi.')
      setTimeout(() => setToast(null), 4000)
    } finally {
      setSending(false)
    }
  }

  const canSend = subject.trim().length > 0 && message.trim().length >= 10
    && (recipientCount ?? 0) > 0 && !sending

  // ── Helpers ───────────────────────────────────────────────────────────────

  const toggleMember = (id: string) => {
    setManualIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-10">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Communications</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Envoyez un message ciblé à un groupe de membres.
        </p>
      </div>

      {/* Form card */}
      <div className={cardClass}>
        <div className="space-y-6">

          {/* Target selection */}
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
              Destinataires
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {TARGETS.map((t) => {
                const Icon = t.icon
                return (
                  <button
                    key={t.id}
                    onClick={() => { setTarget(t.id); setManualIds(new Set()) }}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all active:scale-95',
                      target === t.id
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/40',
                    )}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="text-[11px] font-bold text-center leading-tight">{t.label}</span>
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground h-4">
              {loadingCount
                ? <Loader2 className="w-3 h-3 inline animate-spin" />
                : recipientCount !== null
                  ? `${recipientCount} destinataire(s)`
                  : '—'}
            </p>
          </div>

          {/* Manual member picker */}
          {target === 'manual' && (
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                Sélectionner les membres
              </p>
              {loadingMembers
                ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Chargement...</div>
                : members.length === 0
                  ? <p className="text-sm text-muted-foreground">Aucun membre actif.</p>
                  : (
                    <div className="max-h-56 overflow-y-auto space-y-1 rounded-xl border border-border p-1">
                      {members.map((m) => (
                        <label
                          key={m.id}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors',
                            manualIds.has(m.id) ? 'bg-primary/5' : 'hover:bg-muted',
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={manualIds.has(m.id)}
                            onChange={() => toggleMember(m.id)}
                            className="rounded border-border text-primary"
                          />
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                            {m.firstname[0]}{m.lastname[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {m.firstname} {m.lastname}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )
              }
            </div>
          )}

          {/* Channel */}
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
              Canal
            </p>
            <div className="flex gap-2">
              {CHANNELS.map((c) => {
                const Icon = c.icon
                return (
                  <button
                    key={c.id}
                    onClick={() => setChannel(c.id)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border-2 transition-all active:scale-95',
                      channel === c.id
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/40',
                    )}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
              Objet
            </p>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex : Rappel de document à fournir"
              className="w-full h-11 px-4 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
              Message
              <span className="ml-2 normal-case text-muted-foreground font-normal">
                ({message.length} car. — min. 10)
              </span>
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Rédigez votre message ici..."
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>

          {/* Send button */}
          <div className="flex justify-end">
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={!canSend}
              className={cn(
                'inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all active:scale-95',
                canSend
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed',
              )}
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendHorizonal className="w-4 h-4" />}
              Envoyer
            </button>
          </div>

        </div>
      </div>

      {/* History */}
      <div className={cardClass}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-base font-bold text-foreground">
            Historique des envois
          </h2>
          {history.length > 0 && (
            <button
              onClick={() => setConfirmClear(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Vider
            </button>
          )}
        </div>
        {loadingHistory ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" /> Chargement...
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Aucun envoi pour l'instant.</p>
        ) : (
          <div className="space-y-2">
            {history.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 px-4 py-3 rounded-xl border border-border bg-background"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <SendHorizonal className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{log.subject}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{log.message}</p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {TARGET_LABELS[log.target as BroadcastTarget] ?? log.target}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {log.recipients_count} destinataire(s)
                    </span>
                    <span className="text-[11px] text-muted-foreground">{fmtDate(log.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation modal */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
            <h3 className="font-display text-lg font-bold text-foreground">Confirmer l'envoi</h3>
            <p className="text-sm text-muted-foreground">
              Vous allez envoyer <strong>"{subject}"</strong> à{' '}
              <strong>{recipientCount} destinataire(s)</strong> via{' '}
              {channel === 'both' ? 'email + in-app' : channel === 'email' ? 'email' : 'notification in-app'}.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors active:scale-95"
              >
                Annuler
              </button>
              <button
                onClick={handleSend}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors active:scale-95"
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear history confirmation modal */}
      {confirmClear && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
            <h3 className="font-display text-lg font-bold text-foreground">Vider l'historique</h3>
            <p className="text-sm text-muted-foreground">
              Tous les envois seront supprimés définitivement. Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmClear(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors active:scale-95"
              >
                Annuler
              </button>
              <button
                onClick={handleClearHistory}
                className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold hover:bg-destructive/90 transition-colors active:scale-95"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background text-sm font-medium px-5 py-3 rounded-full shadow-lg">
          {toast}
        </div>
      )}

    </div>
  )
}

export default CommunicationsPage
