import React from 'react'
import { Link } from 'react-router-dom'
import { Building2, ChevronRight, Wrench } from 'lucide-react'
import ScoreRing from '../../components/municipal/ScoreRing'
import { facilities } from '../../data/municipal/mockData'
import { facilityMaintenance, getFacilityMaintenance } from '../../data/municipal/pilotData'
import { cn } from '../../lib/utils'

const statusCls = {
  ok: 'bg-emerald-500/10 text-emerald-700',
  watch: 'bg-amber-500/10 text-amber-700',
  urgent: 'bg-destructive/10 text-destructive',
}

const MunicipalPatrimoinePage: React.FC = () => (
  <div className="space-y-6 max-w-[1100px]">
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">Patrimoine & maintenance</h1>
      <p className="text-sm text-muted-foreground mt-1">
        État des équipements, interventions, incidents et budget engagé
      </p>
    </div>

    <div className="grid gap-4">
      {facilities.map(f => {
        const maintenance = getFacilityMaintenance(f.id)
        return (
          <Link
            key={f.id}
            to={`/municipalite/dashboard/patrimoine/${f.id}`}
            className="rounded-2xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center gap-5"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">{f.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{f.rooms.length} salles · {f.address}</p>
              {maintenance && maintenance.risks.length > 0 && (
                <p className="text-xs text-amber-700 mt-2 flex items-center gap-1">
                  <Wrench className="w-3 h-3" /> {maintenance.risks[0]}
                </p>
              )}
            </div>
            {maintenance && (
              <div className="flex items-center gap-4 shrink-0">
                <ScoreRing score={maintenance.healthScore} size="sm" label="Santé" />
                <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full uppercase', statusCls[maintenance.status])}>
                  {maintenance.status === 'ok' ? 'Bon état' : maintenance.status === 'watch' ? 'Surveillance' : 'Urgent'}
                </span>
                <ChevronRight className="w-5 h-5 text-muted-foreground hidden sm:block" />
              </div>
            )}
          </Link>
        )
      })}
    </div>

    <p className="text-xs text-muted-foreground">
      {facilityMaintenance.reduce((n, m) => n + m.tickets.filter(t => t.status !== 'resolved').length, 0)} tickets ouverts sur le patrimoine.
    </p>
  </div>
)

export default MunicipalPatrimoinePage
