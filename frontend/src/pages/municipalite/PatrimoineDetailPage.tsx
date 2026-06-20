import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft, AlertTriangle, Wrench, Euro, CheckCircle2, PlusCircle, ImagePlus,
} from 'lucide-react'
import ScoreRing from '../../components/municipal/ScoreRing'
import RoomCapacityBadge from '../../components/municipal/RoomCapacityBadge'
import { getFacilityById, getFacilityMaintenance } from '../../data/municipal/pilotData'
import { cn } from '../../lib/utils'

const MunicipalPatrimoineDetailPage: React.FC = () => {
  const { facilityId } = useParams<{ facilityId: string }>()
  const facility = facilityId ? getFacilityById(facilityId) : undefined
  const maintenance = facilityId ? getFacilityMaintenance(facilityId) : undefined

  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [roomId, setRoomId] = useState('')
  const [ticketSent, setTicketSent] = useState(false)

  if (!facility || !maintenance) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Équipement introuvable.</p>
        <Link to="/municipalite/dashboard/patrimoine" className="text-primary text-sm font-medium mt-2 inline-block">
          Retour au patrimoine
        </Link>
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setTicketSent(true)
    setShowForm(false)
    setTitle('')
    setDescription('')
    setRoomId('')
    setTimeout(() => setTicketSent(false), 5000)
  }

  return (
    <div className="space-y-6 max-w-[1100px]">
      <Link
        to="/municipalite/dashboard/patrimoine"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Patrimoine
      </Link>

      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{facility.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{facility.address}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 flex items-center gap-5">
          <ScoreRing score={maintenance.healthScore} size="lg" label="Santé bâtiment" />
          <div>
            <p className="text-sm font-bold">Risques identifiés</p>
            <ul className="mt-2 space-y-1">
              {maintenance.risks.map(r => (
                <li key={r} className="text-xs text-amber-700 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Signalement */}
      <section id="signalement" className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="font-semibold text-foreground">Déclarer un signalement</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sélectionnez l'équipement concerné, décrivez le problème — un ticket est créé automatiquement.
            </p>
          </div>
          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold shrink-0 inline-flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Nouveau signalement
            </button>
          )}
        </div>

        {ticketSent && (
          <p className="mx-5 mt-4 text-sm text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Ticket créé pour {facility.name}. Le service technique en a été notifié.
          </p>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 border-t border-border bg-muted/20">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Équipement</label>
              <p className="text-sm font-medium mt-1">{facility.name}</p>
            </div>

            {facility.rooms.length > 0 && (
              <div>
                <label htmlFor="room" className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Salle concernée (optionnel)
                </label>
                <select
                  id="room"
                  value={roomId}
                  onChange={e => setRoomId(e.target.value)}
                  className="mt-1.5 w-full h-10 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Tout l'équipement</option>
                  {facility.rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name} — max {r.capacity} pers.</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="title" className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Intitulé du problème
              </label>
              <input
                id="title"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex. Porte vestiaire bloquée"
                className="mt-1.5 w-full h-10 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label htmlFor="description" className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="Précisez la localisation, l'urgence, les personnes concernées…"
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ImagePlus className="w-4 h-4" />
              Joindre une photo (bientôt)
            </button>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
              >
                Créer le ticket
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="h-10 px-4 rounded-xl border border-border text-sm font-medium hover:bg-muted"
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </section>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="rounded-2xl border border-border bg-card">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Wrench className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">Interventions</h2>
          </div>
          <ul className="divide-y divide-border">
            {maintenance.interventions.map(i => (
              <li key={i.id} className="px-5 py-3 flex justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{i.label}</p>
                  <p className="text-[10px] text-muted-foreground">{i.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold tabular-nums">{i.cost.toLocaleString('fr-FR')} €</p>
                  <p className={cn('text-[10px] font-bold', i.status === 'done' ? 'text-emerald-700' : 'text-amber-700')}>
                    {i.status === 'done' ? 'Réalisée' : 'Planifiée'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">Incidents & tickets</h2>
          </div>
          {maintenance.tickets.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">Aucun ticket ouvert.</p>
          ) : (
            <ul className="divide-y divide-border">
              {maintenance.tickets.map(t => (
                <li key={t.id} className="px-5 py-3">
                  <p className="text-sm font-medium">{t.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {t.date} · {t.reportedBy} · {t.hasPhoto ? 'Photo jointe' : 'Sans photo'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-sm">Salles & capacité maximale</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{facility.rooms.length} salles sur ce site</p>
        </div>
        <ul className="divide-y divide-border">
          {facility.rooms.map(room => (
            <li key={room.id}>
              <Link
                to={`/municipalite/dashboard/infrastructures/${room.id}`}
                className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{room.name}</p>
                  <p className="text-[10px] text-muted-foreground">{room.areaSqm} m² · {room.occupancyRate}% occupé</p>
                </div>
                <RoomCapacityBadge capacity={room.capacity} />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 flex flex-wrap gap-6">
        <div className="flex items-center gap-3">
          <Euro className="w-5 h-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Budget engagé</p>
            <p className="text-lg font-bold tabular-nums">{maintenance.budgetEngaged.toLocaleString('fr-FR')} €</p>
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Prévision annuelle</p>
          <p className="text-lg font-bold tabular-nums">{maintenance.budgetForecast.toLocaleString('fr-FR')} €</p>
        </div>
        <Link
          to="/municipalite/dashboard/infrastructures"
          className="ml-auto text-sm font-medium text-primary hover:underline self-center"
        >
          Voir les salles →
        </Link>
        <Link
          to="/municipalite/dashboard/materiel"
          className="text-sm font-medium text-primary hover:underline self-center"
        >
          Inventaire matériel →
        </Link>
      </section>
    </div>
  )
}

export default MunicipalPatrimoineDetailPage
