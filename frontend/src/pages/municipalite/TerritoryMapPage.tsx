import React from 'react'
import { Link } from 'react-router-dom'
import TerritoryMapPreview from '../../components/municipal/TerritoryMapPreview'
import { territoryPoints } from '../../data/municipal/pilotData'
import { facilities } from '../../data/municipal/mockData'

const MunicipalTerritoryMapPage: React.FC = () => (
  <div className="space-y-6 max-w-[1200px]">
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">Carte de pilotage territorial</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Équipements, associations, fréquentation et niveaux d'occupation
      </p>
    </div>

    <TerritoryMapPreview points={territoryPoints} className="min-h-[420px]" />

    <div className="grid sm:grid-cols-2 gap-4">
      {facilities.map(f => (
        <Link
          key={f.id}
          to={`/municipalite/dashboard/patrimoine/${f.id}`}
          className="rounded-2xl border border-border bg-card p-5 hover:border-primary/30 transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-foreground">{f.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{f.address}</p>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
              f.occupancyRate >= 85 ? 'bg-destructive/10 text-destructive' :
              f.occupancyRate >= 70 ? 'bg-amber-500/10 text-amber-700' :
              'bg-emerald-500/10 text-emerald-700'
            }`}>
              {f.occupancyRate}% occupé
            </span>
          </div>
        </Link>
      ))}
    </div>
  </div>
)

export default MunicipalTerritoryMapPage
