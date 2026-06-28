import type { MarketplaceCoach } from '../../types/marketplace'

const slot = (
  id: string,
  date: string,
  start: string,
  end: string,
  location: string,
  isOnline = false,
) => ({ id, date, startTime: start, endTime: end, location, isOnline })

export const MARKETPLACE_DISCIPLINES = [
  'Tous',
  'Running',
  'Préparation physique',
  'Pilates',
  'Tennis',
  'Natation',
  'Cross-training',
  'Yoga',
  'Judo',
] as const

export type MarketplaceDiscipline = (typeof MARKETPLACE_DISCIPLINES)[number]

export const marketplaceCoaches: MarketplaceCoach[] = [
  {
    id: 'coach-hugo',
    firstName: 'Hugo',
    lastName: 'Fernandes',
    speciality: 'Préparateur physique endurance & trail',
    description:
      'Ancien athlète semi-pro, Hugo conçoit des plans individualisés pour trails, courses longues et renforcement cardiaque.',
    city: 'Paris',
    serviceArea: 'Paris intra-muros · Bois de Vincennes · visio',
    rating: 4.9,
    reviewsCount: 48,
    imageQuery: 'endurance coach portrait',
    disciplines: ['Running', 'Préparation physique'],
    languages: ['Français', 'Anglais'],
    listings: [
      {
        id: 'listing-hugo-1',
        coachId: 'coach-hugo',
        title: 'Séance running technique & VMA',
        description: 'Analyse foulée, travail VMA et conseils préparation course.',
        pricePerHour: 60,
        sessionDuration: 60,
        isOnline: false,
        disciplines: ['Running', 'Préparation physique'],
        availableSlots: [
          slot('s-h1', '2026-06-23', '07:00', '08:00', 'Bois de Vincennes — lac Daumesnil'),
          slot('s-h2', '2026-06-24', '18:30', '19:30', 'Parc des Buttes-Chaumont'),
          slot('s-h3', '2026-06-26', '08:00', '09:00', 'Visio', true),
        ],
      },
    ],
    reviews: [
      { id: 'r1', author: 'Lucie', note: 5, content: 'Plan clair, disponibilité au top.', date: 'mars 2026' },
      { id: 'r2', author: 'Mickaël', note: 4.8, content: 'Très bon suivi semi-marathon.', date: 'fév. 2026' },
    ],
  },
  {
    id: 'coach-lea',
    firstName: 'Léa',
    lastName: 'Marchal',
    speciality: 'Pilates & mobilité fonctionnelle',
    description:
      'Accompagnement sportifs et actifs sur posture, prévention blessures et mobilité quotidienne.',
    city: 'Lyon',
    serviceArea: 'Lyon centre · cours en visio',
    rating: 4.8,
    reviewsCount: 65,
    imageQuery: 'pilates coach female studio',
    disciplines: ['Pilates', 'Yoga'],
    languages: ['Français'],
    listings: [
      {
        id: 'listing-lea-1',
        coachId: 'coach-lea',
        title: 'Pilates sportif 1-to-1',
        description: 'Renforcement profond, gainage et mobilité articulaire.',
        pricePerHour: 50,
        sessionDuration: 55,
        isOnline: true,
        disciplines: ['Pilates'],
        availableSlots: [
          slot('s-l1', '2026-06-22', '09:00', '09:55', 'Visio', true),
          slot('s-l2', '2026-06-24', '17:00', '17:55', 'Studio Lyon Presqu\'île'),
          slot('s-l3', '2026-06-27', '10:00', '10:55', 'Visio', true),
        ],
      },
    ],
    reviews: [
      { id: 'r3', author: 'Sarah', note: 4.9, content: 'Douleurs lombaires disparues.', date: 'avr. 2026' },
    ],
  },
  {
    id: 'coach-marie',
    firstName: 'Marie',
    lastName: 'Dupont',
    speciality: 'Judo & préparation physique',
    description: 'DE JEPS judo — travail technique, prépa physique et préparation compétition jeunes.',
    city: 'Paris',
    serviceArea: 'Paris 15 · Île-de-France',
    rating: 4.8,
    reviewsCount: 36,
    imageQuery: 'judo coach woman dojo',
    disciplines: ['Judo', 'Préparation physique'],
    languages: ['Français', 'Espagnol'],
    listings: [
      {
        id: 'listing-marie-1',
        coachId: 'coach-marie',
        title: 'Cours privé judo technique',
        description: 'Travail projections, sol et préparation passage de grade.',
        pricePerHour: 45,
        sessionDuration: 60,
        isOnline: false,
        disciplines: ['Judo'],
        availableSlots: [
          slot('s-m1', '2026-06-23', '19:00', '20:00', 'Dojo Paris 15'),
          slot('s-m2', '2026-06-25', '18:00', '19:00', 'Dojo Paris 15'),
        ],
      },
    ],
    reviews: [
      { id: 'r4', author: 'Tom', note: 5, content: 'Excellente pédagogie pour mon fils.', date: 'mai 2026' },
    ],
  },
  {
    id: 'coach-thomas',
    firstName: 'Thomas',
    lastName: 'Berger',
    speciality: 'Tennis — cours particuliers tous niveaux',
    description: 'Ex-joueur classé 15/1, spécialiste coups droit/revers et tactique match.',
    city: 'Bordeaux',
    serviceArea: 'Bordeaux Métropole · courts extérieurs',
    rating: 4.7,
    reviewsCount: 29,
    imageQuery: 'tennis coach court',
    disciplines: ['Tennis'],
    languages: ['Français', 'Anglais'],
    listings: [
      {
        id: 'listing-thomas-1',
        coachId: 'coach-thomas',
        title: 'Cours particulier tennis',
        description: '1h sur court — technique, jeu de jambes ou sparring.',
        pricePerHour: 55,
        sessionDuration: 60,
        isOnline: false,
        disciplines: ['Tennis'],
        availableSlots: [
          slot('s-t1', '2026-06-22', '11:00', '12:00', 'Tennis Club Bordeaux Lac'),
          slot('s-t2', '2026-06-24', '07:30', '08:30', 'Tennis Club Bordeaux Lac'),
          slot('s-t3', '2026-06-28', '16:00', '17:00', 'Tennis Club Bordeaux Lac'),
        ],
      },
    ],
    reviews: [],
  },
  {
    id: 'coach-anne',
    firstName: 'Anne',
    lastName: 'Lefèvre',
    speciality: 'Natation technique adultes',
    description: 'Perfectionnement crawl et brasse, préparation triathlon et open water.',
    city: 'Bordeaux',
    serviceArea: 'Piscines Bordeaux · open water été',
    rating: 4.9,
    reviewsCount: 41,
    imageQuery: 'swimming coach pool',
    disciplines: ['Natation'],
    languages: ['Français'],
    listings: [
      {
        id: 'listing-anne-1',
        coachId: 'coach-anne',
        title: 'Coaching natation 1-to-1',
        description: 'Analyse vidéo sous l\'eau et correction gestuelle.',
        pricePerHour: 48,
        sessionDuration: 45,
        isOnline: false,
        disciplines: ['Natation'],
        availableSlots: [
          slot('s-a1', '2026-06-23', '07:30', '08:15', 'Piscine olympique Bordeaux'),
          slot('s-a2', '2026-06-25', '12:00', '12:45', 'Piscine olympique Bordeaux'),
        ],
      },
    ],
    reviews: [
      { id: 'r5', author: 'Paul', note: 5, content: 'Crawl transformé en 3 séances.', date: 'juin 2026' },
    ],
  },
  {
    id: 'coach-karim',
    firstName: 'Karim',
    lastName: 'Benali',
    speciality: 'Cross-training & HYROX',
    description: 'Préparation fonctionnelle, force et enchaînements compétition HYROX.',
    city: 'Lyon',
    serviceArea: 'Lyon · box fonctionnelle · visio',
    rating: 4.6,
    reviewsCount: 22,
    imageQuery: 'crossfit coach gym',
    disciplines: ['Cross-training', 'Préparation physique'],
    languages: ['Français', 'Arabe'],
    listings: [
      {
        id: 'listing-karim-1',
        coachId: 'coach-karim',
        title: 'Séance cross-training privée',
        description: 'WOD personnalisé selon votre niveau et objectifs.',
        pricePerHour: 52,
        sessionDuration: 60,
        isOnline: false,
        disciplines: ['Cross-training'],
        availableSlots: [
          slot('s-k1', '2026-06-22', '18:00', '19:00', 'Box Confluence Lyon'),
          slot('s-k2', '2026-06-26', '07:00', '08:00', 'Box Confluence Lyon'),
        ],
      },
    ],
    reviews: [],
  },
]

export const getCoachById = (id: string) => marketplaceCoaches.find(c => c.id === id)

export const getListingById = (listingId: string) => {
  for (const coach of marketplaceCoaches) {
    const listing = coach.listings.find(l => l.id === listingId)
    if (listing) return { coach, listing }
  }
  return null
}

export const filterCoaches = (params: {
  search?: string
  discipline?: string
  city?: string
  onlineOnly?: boolean
}): MarketplaceCoach[] => {
  const q = params.search?.trim().toLowerCase() ?? ''
  const discipline = params.discipline && params.discipline !== 'Tous' ? params.discipline : null

  return marketplaceCoaches.filter(coach => {
    if (params.city && !coach.city.toLowerCase().includes(params.city.toLowerCase())) return false
    if (discipline && !coach.disciplines.includes(discipline)) return false
    if (params.onlineOnly && !coach.listings.some(l => l.isOnline)) return false
    if (!q) return true
    const haystack = [
      coach.firstName,
      coach.lastName,
      coach.speciality,
      coach.city,
      ...coach.disciplines,
      ...coach.listings.flatMap(l => [l.title, ...l.disciplines]),
    ].join(' ').toLowerCase()
    return haystack.includes(q)
  })
}

export const getMinPrice = (coach: MarketplaceCoach) =>
  Math.min(...coach.listings.map(l => l.pricePerHour))

export const getNextSlot = (coach: MarketplaceCoach) => {
  const slots = coach.listings.flatMap(l => l.availableSlots)
  return slots.sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))[0]
}
