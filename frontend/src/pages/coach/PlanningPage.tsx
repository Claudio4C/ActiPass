import React, { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Calendar, Save, Eye } from 'lucide-react'
import CoachSessionCard from '../../components/coach/CoachSessionCard'
import TeamMessagePanel from '../../components/coach/TeamMessagePanel'
import Button from '../../components/ui/Button'
import { coachSessions } from '../../data/coach/mockData'

const PlanningPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const preselectedId = searchParams.get('session')
  const [sessions, setSessions] = useState(coachSessions)
  const [selectedId, setSelectedId] = useState(preselectedId ?? coachSessions[0]?.id ?? '')
  const [followUpDraft, setFollowUpDraft] = useState('')
  const [published, setPublished] = useState(false)

  const selected = useMemo(
    () => sessions.find(s => s.id === selectedId),
    [sessions, selectedId],
  )

  React.useEffect(() => {
    if (selected) {
      setFollowUpDraft(selected.followUpComment ?? '')
    }
  }, [selectedId, selected])

  const handlePublishFollowUp = () => {
    if (!selected || !followUpDraft.trim()) return
    setSessions(prev =>
      prev.map(s =>
        s.id === selected.id
          ? { ...s, followUpComment: followUpDraft, followUpPublishedAt: new Date().toISOString() }
          : s,
      ),
    )
    setPublished(true)
    setTimeout(() => setPublished(false), 2500)
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-700 dark:text-emerald-400">
          P5-5 · Suivi post-séance
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1 flex items-center gap-2">
          <Calendar className="w-7 h-7 text-emerald-600" />
          Mon planning
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Séances de la semaine, commentaires de suivi visibles par les parents/membres.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-2">
          <p className="text-xs font-bold uppercase text-gray-500 mb-2">Séances</p>
          {sessions.map(session => (
            <button
              key={session.id}
              type="button"
              onClick={() => setSelectedId(session.id)}
              className={`w-full text-left rounded-xl border px-3 py-2.5 transition-colors ${
                selectedId === session.id
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-gray-200 dark:border-slate-700 hover:border-emerald-300'
              }`}
            >
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{session.title}</p>
              <p className="text-xs text-gray-500">
                {new Date(session.date).toLocaleDateString('fr-FR')} · {session.startTime}
              </p>
              {session.followUpComment && (
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">Suivi publié</span>
              )}
            </button>
          ))}
        </div>

        <div className="lg:col-span-3 space-y-4">
          {selected && (
            <>
              <CoachSessionCard session={selected} compact />

              <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
                <p className="text-xs font-bold uppercase text-gray-500 mb-1">Commentaire de suivi — P5-5</p>
                <p className="text-xs text-gray-500 mb-3">
                  Visible par le membre et le parent après publication.
                </p>
                <textarea
                  value={followUpDraft}
                  onChange={e => setFollowUpDraft(e.target.value)}
                  rows={5}
                  placeholder="Résumé de la séance, points travaillés, axes d'amélioration…"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm resize-none"
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button
                    onClick={handlePublishFollowUp}
                    disabled={!followUpDraft.trim()}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Save className="w-4 h-4" />
                    {published ? 'Publié !' : 'Publier le suivi'}
                  </Button>
                  {selected.followUpPublishedAt && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <Eye className="w-3.5 h-3.5" />
                      Dernière publication :{' '}
                      {new Date(selected.followUpPublishedAt).toLocaleString('fr-FR')}
                    </span>
                  )}
                </div>
              </div>

              <TeamMessagePanel
                sessionTitle={selected.title}
                clubName={selected.clubName}
                recipientCount={selected.enrollees.length || selected.capacity}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PlanningPage
