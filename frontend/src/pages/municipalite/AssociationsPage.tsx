import React, { useState } from 'react'

import { Link } from 'react-router-dom'

import { Search, Users, Filter, ChevronRight } from 'lucide-react'

import { associations } from '../../data/municipal/mockData'

import { associationProfiles, getAssociationProfile } from '../../data/municipal/pilotData'

import ScoreRing from '../../components/municipal/ScoreRing'

import { cn } from '../../lib/utils'



const statusLabel = {

  active: { text: 'Active', cls: 'bg-[hsl(160_84%_39%/0.12)] text-[hsl(160,84%,32%)]' },

  pending: { text: 'En attente', cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },

  suspended: { text: 'Suspendue', cls: 'bg-destructive/10 text-destructive' },

}



const MunicipalAssociationsPage: React.FC = () => {

  const [search, setSearch] = useState('')

  const [filter, setFilter] = useState<'all' | 'active' | 'pending'>('all')



  const filtered = associations.filter(a => {

    const matchSearch =

      a.name.toLowerCase().includes(search.toLowerCase()) ||

      a.sport.toLowerCase().includes(search.toLowerCase())

    const matchFilter = filter === 'all' || a.status === filter

    return matchSearch && matchFilter

  })



  const avgCompliance = Math.round(

    associationProfiles.reduce((s, p) => s + p.complianceScore, 0) / associationProfiles.length,

  )



  return (

    <div className="space-y-6 max-w-[1200px]">

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">

        <div>

          <h1 className="font-display text-2xl font-bold text-foreground">Associations</h1>

          <p className="text-sm text-muted-foreground mt-1">

            Conformité, documents, conventions et vie associative

          </p>

        </div>

        <div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3">

          <ScoreRing score={avgCompliance} size="sm" />

          <div>

            <p className="text-xs font-bold">Conformité moyenne</p>

            <p className="text-[10px] text-muted-foreground">{associationProfiles.length} profils détaillés</p>

          </div>

        </div>

      </div>



      <div className="flex flex-col sm:flex-row gap-3">

        <div className="relative flex-1">

          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

          <input

            type="search"

            value={search}

            onChange={e => setSearch(e.target.value)}

            placeholder="Rechercher une association…"

            className="w-full h-11 pl-9 pr-4 rounded-2xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"

          />

        </div>

        <div className="flex items-center gap-2">

          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />

          {(['all', 'active', 'pending'] as const).map(f => (

            <button

              key={f}

              type="button"

              onClick={() => setFilter(f)}

              className={cn(

                'h-10 px-3 rounded-xl text-xs font-semibold border transition-colors',

                filter === f

                  ? 'bg-primary text-primary-foreground border-primary'

                  : 'bg-card border-border text-muted-foreground hover:bg-muted',

              )}

            >

              {f === 'all' ? 'Toutes' : f === 'active' ? 'Actives' : 'En attente'}

            </button>

          ))}

        </div>

      </div>



      <div className="grid gap-3">

        {filtered.map(a => {

          const profile = getAssociationProfile(a.id)

          const CardInner = (

            <div className="rounded-2xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center gap-4">

              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">

                <Users className="w-5 h-5 text-primary" />

              </div>

              <div className="flex-1 min-w-0">

                <p className="font-semibold text-foreground">{a.name}</p>

                <p className="text-xs text-muted-foreground mt-0.5">

                  {a.sport} · {a.members} membres · Convention {a.conventionUntil}

                </p>

                {profile && (

                  <div className="flex flex-wrap gap-1.5 mt-2">

                    {profile.complianceChecks.map(c => (

                      <span

                        key={c.label}

                        className={cn(

                          'text-[9px] font-bold px-2 py-0.5 rounded-full',

                          c.ok ? 'bg-emerald-500/10 text-emerald-700' : 'bg-destructive/10 text-destructive',

                        )}

                      >

                        {c.label}

                      </span>

                    ))}

                  </div>

                )}

              </div>

              <div className="flex items-center gap-3 shrink-0">

                {profile ? (

                  <ScoreRing score={profile.complianceScore} size="sm" label="Conformité" />

                ) : (

                  <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full', statusLabel[a.status].cls)}>

                    {statusLabel[a.status].text}

                  </span>

                )}

                {profile && <ChevronRight className="w-5 h-5 text-muted-foreground hidden sm:block" />}

              </div>

            </div>

          )



          return profile ? (

            <Link key={a.id} to={`/municipalite/dashboard/associations/${a.id}`}>{CardInner}</Link>

          ) : (

            <div key={a.id}>{CardInner}</div>

          )

        })}

      </div>



      {filtered.length === 0 && (

        <p className="p-12 text-center text-sm text-muted-foreground rounded-2xl border border-border bg-card">

          Aucune association trouvée.

        </p>

      )}

    </div>

  )

}



export default MunicipalAssociationsPage

