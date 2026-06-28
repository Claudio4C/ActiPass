import React from 'react'
import { Link } from 'react-router-dom'
import { Clock, MapPin, Users, MessageSquare, ChevronRight } from 'lucide-react'
import type { CoachSession } from '../../types/coach'

interface Props {
  session: CoachSession
  showEnrollees?: boolean
  compact?: boolean
}

const attendanceLabel: Record<string, { label: string; className: string }> = {
  present: { label: 'Présent', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  absent: { label: 'Absent', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  late: { label: 'Retard', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  unknown: { label: '—', className: 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-gray-400' },
}

const statusBadge: Record<string, string> = {
  confirmed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  cancelled: 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-gray-400',
}

const CoachSessionCard: React.FC<Props> = ({ session, showEnrollees = true, compact = false }) => {
  const presentCount = session.enrollees.filter(e => e.attendance === 'present' || e.attendance === 'late').length
  const attendanceRate =
    session.enrollees.length > 0 ? Math.round((presentCount / session.enrollees.length) * 100) : null

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
      <div className={`p-4 ${compact ? '' : 'sm:p-5'}`}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${statusBadge[session.status]}`}>
                {session.status === 'confirmed' ? 'Confirmé' : session.status === 'pending' ? 'En attente' : 'Annulé'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{session.discipline}</span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{session.title}</h3>
            <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">{session.clubName}</p>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(session.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                {' · '}{session.startTime}–{session.endTime}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {session.location}
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {session.enrollees.length}/{session.capacity} inscrits
              </span>
            </div>
          </div>
          {attendanceRate !== null && (
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{attendanceRate}%</p>
              <p className="text-xs text-gray-500">présence</p>
            </div>
          )}
        </div>

        {showEnrollees && session.enrollees.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Inscrits</p>
            <div className="space-y-1.5">
              {session.enrollees.map(e => (
                <div key={e.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">{e.name}</span>
                    {e.parentName && (
                      <span className="text-xs text-gray-500 ml-2">({e.parentName})</span>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${attendanceLabel[e.attendance].className}`}>
                    {attendanceLabel[e.attendance].label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {session.followUpComment && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-400 mb-1">
              <MessageSquare className="w-3.5 h-3.5" />
              Suivi post-séance publié
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{session.followUpComment}</p>
          </div>
        )}

        {!compact && (
          <Link
            to={`/coach/planning?session=${session.id}`}
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            {session.followUpComment ? 'Modifier le suivi' : 'Rédiger le suivi post-séance'}
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  )
}

export default CoachSessionCard
