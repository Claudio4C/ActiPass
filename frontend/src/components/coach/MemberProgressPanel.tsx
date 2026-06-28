import React from 'react'
import { Link } from 'react-router-dom'
import type { MemberProgress } from '../../types/coach'

interface Props {
  items: MemberProgress[]
}

const MemberProgressPanel: React.FC<Props> = ({ items }) => (
  <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
      <p className="text-sm font-semibold text-gray-900 dark:text-white">Progression membres — P5-3</p>
      <Link to="/coach/progression" className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline">
        Voir tout
      </Link>
    </div>
    <div className="divide-y divide-gray-100 dark:divide-slate-800">
      {items.slice(0, 4).map(item => (
        <div key={item.id} className="px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">{item.memberName}</p>
              <p className="text-xs text-gray-500">{item.clubName} · {item.discipline}</p>
            </div>
            <span className="text-[10px] text-gray-400 shrink-0">
              {new Date(item.lastUpdated).toLocaleDateString('fr-FR')}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {item.fields.slice(0, 3).map(field => (
              <span
                key={field.id}
                className="inline-flex items-center gap-1 text-xs bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-lg"
              >
                <span className="text-gray-500">{field.label}:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {item.values[field.id] ?? '—'}
                  {field.unit ? ` ${field.unit}` : ''}
                </span>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)

export default MemberProgressPanel
