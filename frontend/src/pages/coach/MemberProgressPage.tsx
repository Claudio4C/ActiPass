import React, { useMemo, useState } from 'react'
import { TrendingUp, Save } from 'lucide-react'
import CoachClubSwitcher from '../../components/coach/CoachClubSwitcher'
import Button from '../../components/ui/Button'
import {
  coachClubs,
  memberProgressList,
  progressFieldTemplates,
} from '../../data/coach/mockData'
import type { MemberProgress } from '../../types/coach'

const MemberProgressPage: React.FC = () => {
  const [selectedClubId, setSelectedClubId] = useState<string | 'all'>('all')
  const [items, setItems] = useState(memberProgressList)
  const [savedId, setSavedId] = useState<string | null>(null)

  const filtered = useMemo(
    () => (selectedClubId === 'all' ? items : items.filter(p => p.clubId === selectedClubId)),
    [items, selectedClubId],
  )

  const updateValue = (progressId: string, fieldId: string, value: string) => {
    setItems(prev =>
      prev.map(p =>
        p.id === progressId
          ? { ...p, values: { ...p.values, [fieldId]: value }, lastUpdated: new Date().toISOString().slice(0, 10) }
          : p,
      ),
    )
  }

  const updateNote = (progressId: string, note: string) => {
    setItems(prev => prev.map(p => (p.id === progressId ? { ...p, coachNote: note } : p)))
  }

  const handleSave = (id: string) => {
    setSavedId(id)
    setTimeout(() => setSavedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-700 dark:text-emerald-400">
          P5-3 · Suivi progression
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1 flex items-center gap-2">
          <TrendingUp className="w-7 h-7 text-emerald-600" />
          Progression des membres
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Champs personnalisables par sport — ceintures, niveaux, chronos, objectifs.
        </p>
      </div>

      <CoachClubSwitcher clubs={coachClubs} selectedId={selectedClubId} onSelect={setSelectedClubId} />

      <div className="rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 p-4">
        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Modèles par discipline</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(progressFieldTemplates).map(([discipline, fields]) => (
            <span key={discipline} className="text-xs bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
              <strong>{discipline}</strong>: {fields.map(f => f.label).join(', ')}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((item: MemberProgress) => (
          <div
            key={item.id}
            className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{item.memberName}</h3>
                <p className="text-sm text-gray-500">{item.clubName} · {item.discipline}</p>
              </div>
              <span className="text-xs text-gray-400">
                MAJ {new Date(item.lastUpdated).toLocaleDateString('fr-FR')}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              {item.fields.map(field => (
                <label key={field.id} className="block">
                  <span className="text-xs font-medium text-gray-500">{field.label}</span>
                  <input
                    type="text"
                    value={item.values[field.id] ?? ''}
                    onChange={e => updateValue(item.id, field.id, e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                    placeholder={field.unit ? `ex. 120 ${field.unit}` : ''}
                  />
                </label>
              ))}
            </div>

            <label className="block mb-4">
              <span className="text-xs font-medium text-gray-500">Note coach (visible membre/parent)</span>
              <textarea
                value={item.coachNote ?? ''}
                onChange={e => updateNote(item.id, e.target.value)}
                rows={2}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm resize-none"
                placeholder="Observations, axes de travail…"
              />
            </label>

            <Button
              onClick={() => handleSave(item.id)}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-sm"
            >
              <Save className="w-4 h-4" />
              {savedId === item.id ? 'Enregistré !' : 'Enregistrer'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MemberProgressPage
