import React from 'react'
import { MapPin, Building2, Users } from 'lucide-react'
import type { TerritoryPoint } from '../../types/municipal'
import { cn } from '../../lib/utils'

interface Props {
  points: TerritoryPoint[]
  className?: string
}

/** Maquette cartographique — remplacée par une vraie carte (Mapbox / Leaflet) en P6. */
const TerritoryMapPreview: React.FC<Props> = ({ points, className }) => {
  const minLat = Math.min(...points.map(p => p.lat)) - 0.003
  const maxLat = Math.max(...points.map(p => p.lat)) + 0.003
  const minLng = Math.min(...points.map(p => p.lng)) - 0.003
  const maxLng = Math.max(...points.map(p => p.lng)) + 0.003

  const toX = (lng: number) => ((lng - minLng) / (maxLng - minLng)) * 100
  const toY = (lat: number) => 100 - ((lat - minLat) / (maxLat - minLat)) * 100

  return (
    <div className={cn('relative rounded-2xl border border-border bg-gradient-to-br from-muted/40 to-card overflow-hidden', className)}>
      <div className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="absolute top-4 left-4 z-10">
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Territoire</p>
        <h3 className="font-display font-bold text-foreground">Carte de pilotage</h3>
      </div>

      <div className="relative h-64 sm:h-80 m-4 mt-14 rounded-xl bg-[hsl(210,40%,96%)] border border-border/60">
        {points.map(point => {
          const occupancy = point.occupancyRate
          const color = occupancy >= 85 ? 'bg-destructive' : occupancy >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
          return (
            <div
              key={point.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: `${toX(point.lng)}%`, top: `${toY(point.lat)}%` }}
            >
              <div className={cn('w-3 h-3 rounded-full ring-4 ring-white shadow-md', color)} />
              <div className="absolute left-1/2 -translate-x-1/2 top-5 hidden group-hover:block z-20 w-44 rounded-lg border border-border bg-card p-2 shadow-lg text-left">
                <p className="text-xs font-semibold flex items-center gap-1">
                  {point.type === 'facility' ? <Building2 className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                  {point.name}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">Occupation {occupancy}%</p>
                {point.weeklyVisitors && (
                  <p className="text-[10px] text-muted-foreground">{point.weeklyVisitors} visiteurs/sem.</p>
                )}
              </div>
            </div>
          )
        })}
        <div className="absolute bottom-3 right-3 flex items-center gap-2 text-[10px] text-muted-foreground bg-card/90 px-2 py-1 rounded-md border border-border">
          <MapPin className="w-3 h-3" />
          Saint-Rivière (31)
        </div>
      </div>

      <div className="px-4 pb-4 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> &lt; 70 %</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> 70–85 %</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" /> &gt; 85 %</span>
      </div>
    </div>
  )
}

export default TerritoryMapPreview
