import React, { useState } from 'react'
import { Send, Mail, Bell } from 'lucide-react'
import Button from '../ui/Button'

interface Props {
  sessionTitle: string
  clubName: string
  recipientCount: number
  onSend?: (payload: { subject: string; body: string; channels: Array<'in_app' | 'email'> }) => void
}

const TeamMessagePanel: React.FC<Props> = ({ sessionTitle, clubName, recipientCount, onSend }) => {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sendEmail, setSendEmail] = useState(true)
  const [sent, setSent] = useState(false)

  const handleSend = () => {
    if (!subject.trim() || !body.trim()) return
    const channels: Array<'in_app' | 'email'> = ['in_app']
    if (sendEmail) channels.push('email')
    onSend?.({ subject, body, channels })
    setSent(true)
    setSubject('')
    setBody('')
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Message équipe — P4-4</p>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {sessionTitle} · {clubName} · {recipientCount} destinataires
      </p>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Objet du message"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
        />
        <textarea
          placeholder="Votre message aux inscrits du cours…"
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm resize-none"
        />
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={sendEmail}
            onChange={e => setSendEmail(e.target.checked)}
            className="rounded border-gray-300"
          />
          <Mail className="w-4 h-4" />
          Envoyer aussi par email
        </label>
        <Button
          onClick={handleSend}
          disabled={!subject.trim() || !body.trim()}
          className="w-full sm:w-auto inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
        >
          {sent ? (
            <>Envoyé !</>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Envoyer aux inscrits
              <Bell className="w-3.5 h-3.5 opacity-70" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export default TeamMessagePanel
