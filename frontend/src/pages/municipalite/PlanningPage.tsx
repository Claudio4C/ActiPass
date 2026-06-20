import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Building2, ChevronRight } from 'lucide-react'
import RoomScheduleGrid from '../../components/municipal/RoomScheduleGrid'
import RoomCapacityBadge from '../../components/municipal/RoomCapacityBadge'
import {
  facilities, getSlotsForFacility, getSlotsForRoom, slotAssignments,
} from '../../data/municipal/mockData'
import { cn } from '../../lib/utils'

const MunicipalPlanningPage: React.FC = () => {
  const [facilityId, setFacilityId] = useState(facilities[0]?.id ?? '')
  const [roomFilter, setRoomFilter] = useState<string>('all')

  const facility = facilities.find(f => f.id === facilityId)
  const facilitySlots = useMemo(() => getSlotsForFacility(facilityId), [facilityId])

  const clubsInView = useMemo(() => {
    const slots = roomFilter === 'all' ? facilitySlots : getSlotsForRoom(roomFilter)
    return [...new Set(slots.map(s => s.clubName))]
  }, [facilitySlots, roomFilter])

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Planning des salles</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Attribution des créneaux par lieu et par salle — qui occupe quoi, et quand
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="w-4 h-4" />
          Semaine type · créneaux récurrents
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex flex-wrap gap-2">
          {facilities.map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => { setFacilityId(f.id); setRoomFilter('all') }}
              className={cn(
                'h-10 px-4 rounded-xl text-sm font-semibold border transition-colors',
                facilityId === f.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border text-muted-foreground hover:bg-muted',
              )}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>

      {facility && (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setRoomFilter('all')}
              className={cn(
                'h-9 px-3 rounded-lg text-xs font-bold border transition-colors',
                roomFilter === 'all'
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-card border-border text-muted-foreground hover:bg-muted',
              )}
            >
              Toutes les salles
            </button>
            {facility.rooms.map(room => (
              <button
                key={room.id}
                type="button"
                onClick={() => setRoomFilter(room.id)}
                className={cn(
                  'h-9 px-3 rounded-lg text-xs font-bold border transition-colors',
                  roomFilter === room.id
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-card border-border text-muted-foreground hover:bg-muted',
                )}
              >
                {room.name}
              </button>
            ))}
          </div>

          {roomFilter === 'all' ? (
            <div className="space-y-6">
              {facility.rooms.map(room => {
                const roomSlots = getSlotsForRoom(room.id)
                return (
                  <section key={room.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-foreground truncate">{room.name}</p>
                            <RoomCapacityBadge capacity={room.capacity} />
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {room.areaSqm} m² · {roomSlots.length} créneau{roomSlots.length > 1 ? 'x' : ''}/sem.
                          </p>
                        </div>
                      </div>
                      <Link
                        to={`/municipalite/dashboard/infrastructures/${room.id}`}
                        className="text-xs font-bold text-primary inline-flex items-center gap-1 shrink-0"
                      >
                        Détail <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                    <div className="p-4 sm:p-5">
                      <RoomScheduleGrid slots={roomSlots} />
                    </div>
                    {roomSlots.length > 0 && (
                      <div className="px-5 pb-4 flex flex-wrap gap-2">
                        {roomSlots.map(s => (
                          <span
                            key={s.id}
                            className="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground border border-border"
                          >
                            <strong className="text-foreground font-semibold">{s.day}</strong>
                            {' '}{s.start}–{s.end} · {s.clubName}
                          </span>
                        ))}
                      </div>
                    )}
                  </section>
                )
              })}
            </div>
          ) : (
            <section className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex flex-wrap items-center gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">
                      {facility.rooms.find(r => r.id === roomFilter)?.name}
                    </p>
                    {facility.rooms.find(r => r.id === roomFilter) && (
                      <RoomCapacityBadge capacity={facility.rooms.find(r => r.id === roomFilter)!.capacity} />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{facility.name}</p>
                </div>
              </div>
              <div className="p-4 sm:p-5">
                <RoomScheduleGrid slots={getSlotsForRoom(roomFilter)} />
              </div>
            </section>
          )}

          {/* Légende clubs */}
          {clubsInView.length > 0 && (
            <div className="rounded-xl border border-border bg-card px-5 py-4">
              <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Associations sur ce lieu</p>
              <div className="flex flex-wrap gap-2">
                {clubsInView.map(club => {
                  const sport = facilitySlots.find(s => s.clubName === club)?.sport ?? ''
                  return (
                    <span key={club} className="text-xs font-medium text-foreground">
                      {club}
                      {sport && <span className="text-muted-foreground"> · {sport}</span>}
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      <p className="text-xs text-muted-foreground">
        {slotAssignments.length} créneaux récurrents enregistrés sur le territoire (données démo).
      </p>
    </div>
  )
}

export default MunicipalPlanningPage
