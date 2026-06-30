/** Marketplace coachs indépendants — modèles cible API Listing / PrivateCourse. */

export interface MarketplaceReview {
  id: string
  author: string
  note: number
  content: string
  date: string
}

export interface MarketplaceSlot {
  id: string
  date: string
  startTime: string
  endTime: string
  location: string
  isOnline?: boolean
}

export interface MarketplaceListing {
  id: string
  coachId: string
  title: string
  description: string
  pricePerHour: number
  sessionDuration: number
  isOnline: boolean
  disciplines: string[]
  availableSlots: MarketplaceSlot[]
}

export interface MarketplaceCoach {
  id: string
  firstName: string
  lastName: string
  speciality: string
  description: string
  city: string
  serviceArea: string
  rating: number
  reviewsCount: number
  imageQuery: string
  disciplines: string[]
  languages: string[]
  listings: MarketplaceListing[]
  reviews: MarketplaceReview[]
}

export interface BookedPrivateCourse {
  id: string
  listingId: string
  coachId: string
  coachName: string
  title: string
  startTime: string
  endTime: string
  location: string
  price: number
  isOnline: boolean
  status: 'confirmed' | 'pending'
  bookedAt: string
}
