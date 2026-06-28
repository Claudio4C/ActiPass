import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarPlus, MapPin, Video, X } from 'lucide-react'
import Button from '../ui/Button'
import type { MarketplaceCoach, MarketplaceListing, MarketplaceSlot } from '../../types/marketplace'
import { bookPrivateCourse, isSlotBooked, removeBookedSlot } from '../../lib/privateCoursesStorage'

interface Props {
  coach: MarketplaceCoach
  listing: MarketplaceListing
  onClose: () => void
}

const BookPrivateCourseModal: React.FC<Props> = ({ coach, listing, onClose }) => {
  const navigate = useNavigate()
  const availableSlots = listing.availableSlots.filter(s => !isSlotBooked(listing.id, s.id))
  const [selectedSlotId, setSelectedSlotId] = useState(availableSlots[0]?.id ?? '')
  const [done, setDone] = useState(false)

  const selectedSlot = availableSlots.find(s => s.id === selectedSlotId)

  const handleBook = () => {
    if (!selectedSlot) return
    const start = new Date(`${selectedSlot.date}T${selectedSlot.startTime}:00`)
    const end = new Date(`${selectedSlot.date}T${selectedSlot.endTime}:00`)
    const price = Math.round((listing.pricePerHour * listing.sessionDuration) / 60)

    bookPrivateCourse({
      listingId: listing.id,
      coachId: coach.id,
      coachName: `${coach.firstName} ${coach.lastName}`,
      title: listing.title,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      location: selectedSlot.location,
      price,
      isOnline: selectedSlot.isOnline ?? listing.isOnline,
    })
    removeBookedSlot(selectedSlot.id, listing.id)
    setDone(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="text-xs font-bold uppercase text-muted-foreground">Réserver un cours privé</p>
            <p className="font-semibold text-foreground">{listing.title}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {done ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CalendarPlus className="w-6 h-6" />
              </div>
              <p className="font-semibold text-foreground">Cours réservé !</p>
              <p className="text-sm text-muted-foreground">
                Il apparaît dans votre planning hebdomadaire.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  onClick={() => navigate('/club/planning')}
                  className="flex-1 bg-primary hover:opacity-90"
                >
                  Voir mon planning
                </Button>
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Fermer
                </Button>
              </div>
            </div>
          ) : availableSlots.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aucun créneau disponible pour cette offre. Revenez plus tard ou contactez le coach.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {listing.sessionDuration} min · {listing.pricePerHour} €/h · avec {coach.firstName}
              </p>
              <div className="space-y-2">
                {availableSlots.map(slot => (
                  <label
                    key={slot.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      selectedSlotId === slot.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="slot"
                      checked={selectedSlotId === slot.id}
                      onChange={() => setSelectedSlotId(slot.id)}
                      className="mt-1"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {new Date(slot.date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {slot.startTime} – {slot.endTime}
                      </p>
                      <p className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-1">
                        {slot.isOnline ? (
                          <>
                            <Video className="w-3 h-3" /> Visio
                          </>
                        ) : (
                          <>
                            <MapPin className="w-3 h-3" /> {slot.location}
                          </>
                        )}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              <Button
                onClick={handleBook}
                disabled={!selectedSlotId}
                className="w-full bg-primary hover:opacity-90 inline-flex items-center justify-center gap-2"
              >
                <CalendarPlus className="w-4 h-4" />
                Confirmer la réservation
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default BookPrivateCourseModal
