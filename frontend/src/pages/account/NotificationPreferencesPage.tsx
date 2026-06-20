import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'

import { api } from '../../lib/api'
import Toggle from '../../components/shared/Toggle'

interface NotificationPreferences {
  email_payment_received: boolean
  email_document_decision: boolean
  email_event_reminder: boolean
  email_membership_decision: boolean
  email_renewal_invitation: boolean
  email_marketing: boolean
  push_enabled: boolean
}

type EmailPrefKey = Exclude<keyof NotificationPreferences, 'push_enabled'>

const EMAIL_PREFS: { key: EmailPrefKey; label: string; desc: string }[] = [
  { key: 'email_payment_received', label: 'Paiements', desc: "Confirmation de vos paiements de cotisation et d'événements" },
  { key: 'email_document_decision', label: 'Documents', desc: 'Validation ou refus de vos documents administratifs' },
  { key: 'email_event_reminder', label: "Rappels d'événements", desc: "Rappel 24h avant un événement auquel vous êtes inscrit" },
  { key: 'email_membership_decision', label: 'Adhésions', desc: "Acceptation ou refus de vos demandes d'adhésion" },
  { key: 'email_renewal_invitation', label: 'Renouvellement', desc: "Invitation à renouveler votre adhésion en fin de saison" },
  { key: 'email_marketing', label: 'Newsletter & offres', desc: 'Actualités, nouveautés et offres Actipass (optionnel)' },
]

const NotificationPreferencesPage: React.FC = () => {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    api.get<NotificationPreferences>('/users/me/notification-preferences', undefined, { useCache: false })
      .then(setPrefs)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!toast) { return undefined }
    const id = window.setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(id)
  }, [toast])

  const handleToggle = async (key: keyof NotificationPreferences) => {
    if (!prefs) { return }
    const previous = prefs
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    try {
      await api.patch('/users/me/notification-preferences', { [key]: next[key] })
      setToast('Préférence mise à jour')
    } catch {
      setPrefs(previous)
      setToast('Erreur, réessayez')
    }
  }

  if (loading || !prefs) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-4">
        <Link
          to="/account/profile"
          className="w-9 h-9 rounded-xl flex items-center justify-center border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">Préférences de notifications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Choisissez les notifications que vous souhaitez recevoir par email.
          </p>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-2xl border border-emerald-500/35 bg-emerald-500/10 text-emerald-950 dark:text-emerald-50 px-4 py-2.5 text-sm"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <p className="font-medium">{toast}</p>
        </div>
      )}

      <div className="space-y-2">
        {EMAIL_PREFS.map((p) => (
          <div
            key={p.key}
            className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{p.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{p.desc}</p>
            </div>
            <Toggle checked={prefs[p.key]} onChange={() => handleToggle(p.key)} />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Notifications push</p>
          <p className="text-xs text-muted-foreground mt-0.5">Recevoir des notifications sur cet appareil</p>
        </div>
        <Toggle checked={prefs.push_enabled} onChange={() => handleToggle('push_enabled')} />
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        Les notifications in-app (cloche) restent toujours actives — elles n'envahissent pas votre boîte mail.
      </p>
    </div>
  )
}

export default NotificationPreferencesPage
