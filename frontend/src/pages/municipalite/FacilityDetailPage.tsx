import React from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { ArrowLeft, Building2, Users, Calendar, Euro, CalendarDays } from 'lucide-react'
import RoomScheduleGrid from '../../components/municipal/RoomScheduleGrid'
import RoomCapacityBadge from '../../components/municipal/RoomCapacityBadge'
import {
  getRoomById, getFacilityByRoomId, getSlotsForRoom, MUNICIPALITY,
} from '../../data/municipal/mockData'
import { cn } from '../../lib/utils'

const fmtEuro = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

const MunicipalFacilityDetailPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>()
  const room = roomId ? getRoomById(roomId) : undefined
  const facility = roomId ? getFacilityByRoomId(roomId) : undefined

  if (!room || !facility) {
    return <Navigate to="/municipalite/dashboard/infrastructures" replace />
  }

  const slots = getSlotsForRoom(room.id)

  return (
    <div className="space-y-6 max-w-[900px]">
      <Link
        to="/municipalite/dashboard/infrastructures"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux infrastructures
      </Link>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="h-24 bg-gradient-to-br from-primary/20 via-[hsl(280,70%,60%/0.15)] to-transparent border-b border-border px-6 flex items-end pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-center -mb-8">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
        <div className="px-6 pt-10 pb-6">
          <p className="text-xs text-muted-foreground">{facility.name}</p>
          <div className="flex flex-wrap items-center gap-3 mt-0.5">
            <h1 className="font-display text-2xl font-bold text-foreground">{room.name}</h1>
            <RoomCapacityBadge capacity={room.capacity} size="md" />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {MUNICIPALITY.name} · Capacité maximale réglementaire : <strong className="text-foreground">{room.capacity} personnes</strong>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Surface', value: `${room.areaSqm} m²`, icon: Building2 },
          { label: 'Capacité max', value: `${room.capacity} pers.`, icon: Users },
          { label: 'Occupation', value: `${room.occupancyRate}%`, icon: Calendar },
          { label: 'Revenus / mois', value: fmtEuro(room.monthlyRevenue), icon: Euro },
        ].map(item => (
          <div
            key={item.label}
            className={cn(
              'bg-card border rounded-2xl p-4',
              item.label === 'Capacité max' ? 'border-primary/40 bg-primary/[0.03]' : 'border-border',
            )}
          >
            <item.icon className="w-4 h-4 text-muted-foreground mb-2" />
            <p className="text-lg font-bold text-foreground tabular-nums">{item.value}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-foreground">Planning hebdomadaire</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Créneaux attribués à cette salle</p>
          </div>
          <Link
            to="/municipalite/dashboard/planning"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline shrink-0"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Voir tout le planning
          </Link>
        </div>
        <div className="p-4 sm:p-5">
          {slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune plage assignée.</p>
          ) : (
            <RoomScheduleGrid slots={slots} compact />
          )}
        </div>
        {slots.length > 0 && (
          <div className="px-5 pb-5 space-y-2 border-t border-border pt-4">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Détail des créneaux</p>
            {slots.map(s => (
              <div
                key={s.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 p-3 rounded-xl bg-muted/40 border border-border"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{s.clubName}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.day} · {s.start} – {s.end} · {s.sport}
                    {s.recurring && ' · Récurrent'}
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-primary/10 text-primary w-fit">
                  Confirmé
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {room.id === 'r1' && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
          <strong>Exemple :</strong> le mardi, le Dojo accueille le Karaté Club (16h–18h) puis le Judo Club (18h–21h).
          Le planning complet est visible dans{' '}
          <Link to="/municipalite/dashboard/planning" className="text-primary font-semibold hover:underline">
            Planning des salles
          </Link>.
        </div>
      )}
    </div>
  )
}

export default MunicipalFacilityDetailPage
