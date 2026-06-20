import React from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { PilotKpi } from '../../types/municipal'
import { cn } from '../../lib/utils'

interface Props {
  kpis: PilotKpi[]
}

const PilotKpiGrid: React.FC<Props> = ({ kpis }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
    {kpis.map(kpi => (
      <Link
        key={kpi.id}
        to={kpi.href}
        className="group rounded-2xl border border-border bg-card p-4 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
      >
        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
          {kpi.label}
        </p>
        <div className="mt-2 flex items-end justify-between gap-2">
          <div>
            <p className={cn('text-2xl font-display font-bold text-foreground', kpi.accent && '')}>
              {kpi.value}
            </p>
            {kpi.sublabel && (
              <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.sublabel}</p>
            )}
          </div>
          {kpi.trend !== undefined && (
            <span
              className={cn(
                'flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md',
                kpi.trend >= 0 ? 'bg-emerald-500/10 text-emerald-700' : 'bg-destructive/10 text-destructive',
              )}
            >
              {kpi.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {kpi.trend > 0 ? '+' : ''}{kpi.trend}%
            </span>
          )}
        </div>
        <p className="text-[10px] text-primary font-medium mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
          Voir le détail →
        </p>
      </Link>
    ))}
  </div>
)

export default PilotKpiGrid
