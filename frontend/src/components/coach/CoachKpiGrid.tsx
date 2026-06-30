import React from 'react'
import { Link } from 'react-router-dom'
import type { CoachKpi } from '../../types/coach'

interface Props {
  kpis: CoachKpi[]
}

const CoachKpiGrid: React.FC<Props> = ({ kpis }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
    {kpis.map(kpi => {
      const content = (
        <>
          <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">
            {kpi.label}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{kpi.value}</p>
          {kpi.sublabel && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{kpi.sublabel}</p>
          )}
        </>
      )

      const className =
        'rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm transition-all'

      return kpi.href ? (
        <Link key={kpi.id} to={kpi.href} className={`${className} hover:border-emerald-300 hover:shadow-md`}>
          {content}
        </Link>
      ) : (
        <div key={kpi.id} className={className}>
          {content}
        </div>
      )
    })}
  </div>
)

export default CoachKpiGrid
