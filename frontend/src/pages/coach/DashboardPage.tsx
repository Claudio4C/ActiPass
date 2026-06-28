import React, { useMemo, useState } from 'react'
import { LayoutDashboard } from 'lucide-react'
import CoachKpiGrid from '../../components/coach/CoachKpiGrid'
import CoachClubSwitcher from '../../components/coach/CoachClubSwitcher'
import CoachSessionCard from '../../components/coach/CoachSessionCard'
import MemberProgressPanel from '../../components/coach/MemberProgressPanel'
import { coachClubs, coachKpis, coachSessions, memberProgressList } from '../../data/coach/mockData'
import { useCurrentOrganisation } from '../../hooks/useCurrentOrganisation'

const DashboardPage: React.FC = () => {
  const { role } = useCurrentOrganisation()
  const isIndependent = role === 'freelance'
  const [selectedClubId, setSelectedClubId] = useState<string | 'all'>('all')

  const filteredSessions = useMemo(
    () =>
      selectedClubId === 'all'
        ? coachSessions
        : coachSessions.filter(s => s.clubId === selectedClubId),
    [selectedClubId],
  )

  const weekSessions = useMemo(
    () => [...filteredSessions].sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)),
    [filteredSessions],
  )

  const filteredProgress = useMemo(
    () =>
      selectedClubId === 'all'
        ? memberProgressList
        : memberProgressList.filter(p => p.clubId === selectedClubId),
    [selectedClubId],
  )

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-700 dark:text-emerald-400">
          P5-1 · Dashboard coach
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1 flex items-center gap-2">
          <LayoutDashboard className="w-7 h-7 text-emerald-600" />
          Tableau de bord
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {isIndependent
            ? 'Vue consolidée de vos clubs — séances, inscrits, présences et suivis.'
            : 'Vue semaine de vos séances, inscrits et taux de présence.'}
        </p>
      </div>

      <CoachKpiGrid kpis={coachKpis} />

      {(isIndependent || coachClubs.length > 1) && (
        <CoachClubSwitcher
          clubs={coachClubs}
          selectedId={selectedClubId}
          onSelect={setSelectedClubId}
        />
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Séances de la semaine
        </h2>
        <div className="space-y-3">
          {weekSessions.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune séance pour ce club cette semaine.</p>
          ) : (
            weekSessions.map(session => (
              <CoachSessionCard key={session.id} session={session} />
            ))
          )}
        </div>
      </div>

      <MemberProgressPanel items={filteredProgress} />
    </div>
  )
}

export default DashboardPage
