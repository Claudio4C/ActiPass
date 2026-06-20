import React from 'react'
import { Link } from 'react-router-dom'
import { Building2, MapPin, ChevronRight, Plus, CalendarDays } from 'lucide-react'
import { facilities, getFacilityTotalCapacity } from '../../data/municipal/mockData'
import RoomCapacityBadge from '../../components/municipal/RoomCapacityBadge'

const fmtEuro = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

const MunicipalFacilitiesPage: React.FC = () => (
  <div className="space-y-6 max-w-[1200px]">
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Infrastructures</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gymnases, salles et équipements — capacité, horaires et assignations
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold opacity-60 cursor-not-allowed"
          title="Bientôt disponible"
        >
          <Plus className="w-4 h-4" />
          Nouveau gymnase
        </button>
        <Link
          to="/municipalite/dashboard/planning"
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-border bg-card text-sm font-semibold hover:bg-muted transition-colors"
        >
          <CalendarDays className="w-4 h-4 text-primary" />
          Planning des salles
        </Link>
      </div>
    </div>

    <div className="grid grid-cols-1 gap-4">
      {facilities.map(f => (
        <div key={f.id} className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-[hsl(280,70%,60%/0.12)] flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-[hsl(280,70%,50%)]" />
              </div>
              <div>
                <h2 className="font-display font-bold text-foreground">{f.name}</h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {f.address}
                </p>
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="text-center">
                <p className="font-bold text-foreground tabular-nums">{f.rooms.length}</p>
                <p className="text-[10px] text-muted-foreground">Salles</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-primary tabular-nums">{getFacilityTotalCapacity(f.id)}</p>
                <p className="text-[10px] text-muted-foreground">Cap. max totale</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-foreground tabular-nums">{f.occupancyRate}%</p>
                <p className="text-[10px] text-muted-foreground">Occupation</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-[hsl(160,84%,32%)] tabular-nums">{fmtEuro(f.monthlyRevenue)}</p>
                <p className="text-[10px] text-muted-foreground">Revenus / mois</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-border">
            {f.rooms.map(room => (
              <Link
                key={room.id}
                to={`/municipalite/dashboard/infrastructures/${room.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-muted/40 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {room.name}
                    </p>
                    <RoomCapacityBadge capacity={room.capacity} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {room.areaSqm} m² · {room.weeklyHours} h / semaine
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs font-bold text-foreground tabular-nums">{room.occupancyRate}%</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)

export default MunicipalFacilitiesPage
