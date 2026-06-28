import React from 'react'
import { Building2, Check } from 'lucide-react'
import type { CoachClub } from '../../types/coach'

interface Props {
  clubs: CoachClub[]
  selectedId: string | 'all'
  onSelect: (id: string | 'all') => void
}

const CoachClubSwitcher: React.FC<Props> = ({ clubs, selectedId, onSelect }) => (
  <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
      Mes clubs — P5-2
    </p>
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onSelect('all')}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
          selectedId === 'all'
            ? 'bg-emerald-600 text-white'
            : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
        }`}
      >
        {selectedId === 'all' && <Check className="w-3.5 h-3.5" />}
        Tous les clubs ({clubs.length})
      </button>
      {clubs.map(club => (
        <button
          key={club.id}
          type="button"
          onClick={() => onSelect(club.id)}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
            selectedId === club.id
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
          }`}
        >
          {selectedId === club.id && <Check className="w-3.5 h-3.5" />}
          <Building2 className="w-3.5 h-3.5 opacity-70" />
          {club.name}
          <span className="text-xs opacity-70">({club.city})</span>
        </button>
      ))}
    </div>
    {selectedId !== 'all' && (
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-800">
        {(() => {
          const club = clubs.find(c => c.id === selectedId)
          if (!club) return null
          return (
            <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
              <span>{club.membersCount} membres suivis</span>
              <span>{club.attendanceRate}% présence</span>
              <span className="capitalize">{club.role === 'freelance' ? 'Indépendant' : 'Salarié club'}</span>
              <span>{club.disciplines.join(', ')}</span>
            </div>
          )
        })()}
      </div>
    )}
  </div>
)

export default CoachClubSwitcher
