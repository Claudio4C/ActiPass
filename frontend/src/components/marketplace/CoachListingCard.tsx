import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Star, Video, Clock, ChevronRight } from 'lucide-react'
import type { MarketplaceCoach } from '../../types/marketplace'
import { getMinPrice, getNextSlot } from '../../data/marketplace/mockData'
import { cn } from '../../lib/utils'

interface Props {
  coach: MarketplaceCoach
}

const CoachListingCard: React.FC<Props> = ({ coach }) => {
  const minPrice = getMinPrice(coach)
  const nextSlot = getNextSlot(coach)
  const hasOnline = coach.listings.some(l => l.isOnline)

  return (
    <Link
      to={`/coach/independants/${coach.id}`}
      className="group block rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-md transition-all"
    >
      <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/5 to-accent/10 relative">
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display font-bold text-foreground truncate">
              {coach.firstName} {coach.lastName}
            </h3>
            <p className="text-xs text-muted-foreground truncate">{coach.speciality}</p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-bold bg-card/90 backdrop-blur px-2 py-1 rounded-lg shrink-0">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            {coach.rating.toFixed(1)}
          </span>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {coach.disciplines.slice(0, 3).map(d => (
            <span key={d} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {d}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3 h-3 shrink-0" />
            {coach.city}
          </span>
          {hasOnline && (
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <Video className="w-3 h-3 shrink-0" />
              Visio
            </span>
          )}
          <span className="font-semibold text-foreground">dès {minPrice} €/h</span>
        </div>
        {nextSlot && (
          <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Prochain créneau :{' '}
            {new Date(nextSlot.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
            {' · '}{nextSlot.startTime}
          </p>
        )}
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:underline">
          Voir le profil
          <ChevronRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  )
}

export default CoachListingCard
