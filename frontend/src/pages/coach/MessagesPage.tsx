import React, { useState } from 'react'
import { MessageSquare, Mail, Bell } from 'lucide-react'
import TeamMessagePanel from '../../components/coach/TeamMessagePanel'
import { coachSessions, teamMessages } from '../../data/coach/mockData'

const MessagesPage: React.FC = () => {
  const [selectedSessionId, setSelectedSessionId] = useState(coachSessions[0]?.id ?? '')
  const selectedSession = coachSessions.find(s => s.id === selectedSessionId)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-700 dark:text-emerald-400">
          P4-4 · Messages équipe
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1 flex items-center gap-2">
          <MessageSquare className="w-7 h-7 text-emerald-600" />
          Messages
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Envoyez un message groupé aux inscrits d&apos;un cours — in-app et email.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
            Choisir une séance
          </label>
          <select
            value={selectedSessionId}
            onChange={e => setSelectedSessionId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm mb-4"
          >
            {coachSessions.map(s => (
              <option key={s.id} value={s.id}>
                {s.title} — {new Date(s.date).toLocaleDateString('fr-FR')}
              </option>
            ))}
          </select>

          {selectedSession && (
            <TeamMessagePanel
              sessionTitle={selectedSession.title}
              clubName={selectedSession.clubName}
              recipientCount={selectedSession.enrollees.length || selectedSession.capacity}
            />
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Historique des envois</p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {teamMessages.map(msg => (
              <div key={msg.id} className="px-4 py-3">
                <p className="font-medium text-sm text-gray-900 dark:text-white">{msg.subject}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {msg.sessionTitle} · {msg.clubName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{msg.body}</p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                  <span>{new Date(msg.sentAt).toLocaleString('fr-FR')}</span>
                  <span>{msg.recipientCount} destinataires</span>
                  {msg.channels.includes('in_app') && (
                    <span className="inline-flex items-center gap-1">
                      <Bell className="w-3 h-3" /> In-app
                    </span>
                  )}
                  {msg.channels.includes('email') && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Email
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MessagesPage
