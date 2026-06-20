import React from 'react'
import { occupancyByDay, facilities, KPI } from '../../data/municipal/mockData'
import { cn } from '../../lib/utils'

const fmtEuro = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

const MunicipalStatsPage: React.FC = () => {
  const maxOcc = Math.max(...occupancyByDay.map(d => d.rate))

  return (
    <div className="space-y-6 max-w-[1000px]">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Statistiques d&apos;utilisation</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Fréquentation et revenus par infrastructure (données de démo)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {facilities.map(f => (
          <div key={f.id} className="bg-card border border-border rounded-2xl p-5">
            <p className="font-semibold text-foreground">{f.name}</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-2xl font-bold text-foreground tabular-nums">{f.occupancyRate}%</p>
                <p className="text-xs text-muted-foreground">Taux d&apos;occupation</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[hsl(160,84%,32%)] tabular-nums">{fmtEuro(f.monthlyRevenue)}</p>
                <p className="text-xs text-muted-foreground">Revenus mensuels</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {f.rooms.map(r => (
                <div key={r.id} className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground w-28 truncate">{r.name}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${r.occupancyRate}%` }} />
                  </div>
                  <span className="font-semibold tabular-nums w-8 text-right">{r.occupancyRate}%</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <p className="font-display font-bold text-foreground mb-4">Occupation globale par jour</p>
        <div className="grid grid-cols-7 gap-2">
          {occupancyByDay.map(d => (
            <div key={d.day} className="text-center">
              <div
                className={cn(
                  'mx-auto w-full max-w-[3rem] rounded-lg bg-primary/80 mb-2',
                )}
                style={{ height: `${(d.rate / maxOcc) * 80 + 20}px` }}
              />
              <p className="text-[10px] text-muted-foreground">{d.day}</p>
              <p className="text-xs font-bold tabular-nums">{d.rate}%</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Taux moyen sur 30 jours : <strong className="text-foreground">{KPI.occupancyRate.value}%</strong>
        </p>
      </div>
    </div>
  )
}

export default MunicipalStatsPage
