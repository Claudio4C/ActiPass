import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Users, Video, MapPin } from 'lucide-react'
import CoachListingCard from '../../components/marketplace/CoachListingCard'
import DisciplineFilter from '../../components/marketplace/DisciplineFilter'
import { filterCoaches, MARKETPLACE_DISCIPLINES } from '../../data/marketplace/mockData'

const CoachesDirectoryPage: React.FC = () => {
  const [search, setSearch] = useState('')
  const [discipline, setDiscipline] = useState('Tous')
  const [onlineOnly, setOnlineOnly] = useState(false)
  const [city, setCity] = useState('')

  const coaches = useMemo(
    () => filterCoaches({ search, discipline, city, onlineOnly }),
    [search, discipline, city, onlineOnly],
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-gradient-to-br from-primary/10 via-background to-accent/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <p className="text-[10px] uppercase tracking-widest font-bold text-primary">Marketplace</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-1 flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" />
            Coachs indépendants
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Trouvez un coach par discipline, réservez un cours privé et retrouvez-le directement dans votre planning.
          </p>
          <Link
            to="/club/planning"
            className="inline-flex mt-4 text-sm font-semibold text-primary hover:underline"
          >
            Voir mon planning →
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un coach, une discipline, une ville…"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-sm"
            />
          </div>

          <DisciplineFilter
            options={MARKETPLACE_DISCIPLINES}
            value={discipline}
            onChange={setDiscipline}
          />

          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[140px]">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Ville"
                className="w-full pl-10 pr-3 py-2 rounded-xl border border-border bg-card text-sm"
              />
            </div>
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={onlineOnly}
                onChange={e => setOnlineOnly(e.target.checked)}
              />
              <Video className="w-4 h-4 text-emerald-600" />
              Visio uniquement
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {coaches.length} coach{coaches.length > 1 ? 's' : ''} disponible{coaches.length > 1 ? 's' : ''}
          </p>
        </div>

        {coaches.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-border">
            <p className="font-semibold text-foreground">Aucun coach trouvé</p>
            <p className="text-sm text-muted-foreground mt-1">Essayez une autre discipline ou ville.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coaches.map(coach => (
              <CoachListingCard key={coach.id} coach={coach} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CoachesDirectoryPage
