import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, Star, Video, ChevronLeft } from 'lucide-react'
import Button from '../components/ui/Button'
import BookPrivateCourseModal from '../components/marketplace/BookPrivateCourseModal'
import { getCoachById } from '../data/marketplace/mockData'
import type { MarketplaceListing } from '../types/marketplace'

const unsplash = (w: number, h: number, query: string, seed: string | number) =>
  `https://source.unsplash.com/random/${w}x${h}/?${encodeURIComponent(query)}&sig=${seed}`

const ImgWithFallback: React.FC<{
  src: string
  alt: string
  className?: string
  width: number
  height: number
  seed: string | number
}> = ({ src, alt, className, width, height, seed }) => {
  const [imgSrc, setImgSrc] = React.useState(src)
  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setImgSrc(`https://picsum.photos/${width}/${height}?random=${seed}`)}
    />
  )
}

const CoachDetailPage: React.FC = () => {
  const { coachId } = useParams<{ coachId: string }>()
  const coach = React.useMemo(() => (coachId ? getCoachById(coachId) : undefined), [coachId])
  const [bookingListing, setBookingListing] = useState<MarketplaceListing | null>(null)

  if (!coach) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center space-y-4">
        <p className="text-muted-foreground">Ce coach n&apos;existe pas ou n&apos;est plus disponible.</p>
        <Link to="/club/coaches">
          <Button>Retour à la marketplace</Button>
        </Link>
      </div>
    )
  }

  const fullName = `${coach.firstName} ${coach.lastName}`

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        <Link
          to="/club/coaches"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <ChevronLeft className="w-4 h-4" />
          Retour à la marketplace
        </Link>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="relative h-48 sm:h-56">
              <ImgWithFallback
                src={unsplash(1200, 400, coach.imageQuery, `hero-${coach.id}`)}
                alt={fullName}
                className="w-full h-full object-cover"
                width={1200}
                height={400}
                seed={`hero-${coach.id}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end gap-4">
                <ImgWithFallback
                  src={unsplash(120, 120, coach.imageQuery, `avatar-${coach.id}`)}
                  alt={fullName}
                  className="w-20 h-20 rounded-2xl object-cover ring-4 ring-card"
                  width={120}
                  height={120}
                  seed={`avatar-${coach.id}`}
                />
                <div className="text-white min-w-0">
                  <h1 className="text-2xl font-bold truncate">{fullName}</h1>
                  <p className="text-sm text-white/90 truncate">{coach.speciality}</p>
                  <div className="flex flex-wrap items-center gap-2 text-sm mt-1">
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {coach.rating.toFixed(1)}
                    </span>
                    <span className="text-white/80">({coach.reviewsCount} avis)</span>
                    <span className="text-white/60">·</span>
                    <span className="text-white/80 inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {coach.city}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">{coach.description}</p>
              <div className="flex flex-wrap gap-2">
                {coach.disciplines.map(tag => (
                  <span key={tag} className="text-xs rounded-full bg-primary/10 text-primary px-3 py-1 font-semibold">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Zone : {coach.serviceArea} · Langues : {coach.languages.join(', ')}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4 h-fit">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Offres & réservation</p>
            {coach.listings.map(listing => (
              <div key={listing.id} className="rounded-2xl border border-border p-4 space-y-2">
                <p className="font-semibold text-foreground">{listing.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{listing.description}</p>
                <p className="text-sm font-bold text-foreground">
                  {listing.pricePerHour} €/h · {listing.sessionDuration} min
                </p>
                {listing.isOnline && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                    <Video className="w-3 h-3" /> Cours en visio possible
                  </span>
                )}
                <Button
                  onClick={() => setBookingListing(listing)}
                  className="w-full justify-center bg-primary hover:opacity-90 mt-2"
                >
                  Réserver ce cours
                </Button>
              </div>
            ))}
          </div>
        </section>

        {coach.reviews.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Avis</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {coach.reviews.map(review => (
                <article key={review.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">{review.author}</p>
                      <p className="text-xs text-muted-foreground">{review.date}</p>
                    </div>
                    <span className="text-sm font-semibold text-amber-600">{review.note.toFixed(1)} ★</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{review.content}</p>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>

      {bookingListing && (
        <BookPrivateCourseModal
          coach={coach}
          listing={bookingListing}
          onClose={() => setBookingListing(null)}
        />
      )}
    </>
  )
}

export default CoachDetailPage
