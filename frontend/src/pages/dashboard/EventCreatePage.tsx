import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import RoleBasedRoute from '../../components/shared/RoleBasedRoute'
import { api } from '../../lib/api'
import type { EventType, EventVisibility, EventStatus } from '../../types'

const inputCls =
  'w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-colors'
const labelCls = 'block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5'

type Frequency = 'daily' | 'weekly' | 'monthly'
type EndType = 'count' | 'date'

const DAY_LABELS = ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa']

const EventCreatePage: React.FC = () => {
  const { organisationId } = useParams<{ organisationId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    title: '',
    description: '',
    event_type: 'training' as EventType,
    start_time: '',
    end_time: '',
    location: '',
    visibility: 'public' as EventVisibility,
    capacity: '',
    registration_required: false,
    price: '0',
    is_recurring: false,
    status: 'published' as EventStatus,
    cancellation_deadline_hours: '' as string,
  })

  const [recurrence, setRecurrence] = useState({
    frequency: 'weekly' as Frequency,
    interval: '1',
    days_of_week: [] as number[],
    end_type: 'count' as EndType,
    end_date: '',
    occurrences: '10',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const toggleDay = (day: number) => {
    setRecurrence(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day].sort((a, b) => a - b),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organisationId) { return }
    setLoading(true)
    try {
      const recurrencePattern = form.is_recurring
        ? JSON.stringify({
            frequency: recurrence.frequency,
            interval: parseInt(recurrence.interval) || 1,
            ...(recurrence.frequency === 'weekly' && recurrence.days_of_week.length > 0
              ? { days_of_week: recurrence.days_of_week }
              : {}),
            end_type: recurrence.end_type,
            ...(recurrence.end_type === 'date'
              ? { end_date: recurrence.end_date }
              : { occurrences: Math.min(parseInt(recurrence.occurrences) || 1, 52) }),
          })
        : undefined

      await api.post(`/organisations/${organisationId}/events`, {
        title: form.title,
        description: form.description || undefined,
        event_type: form.event_type,
        start_time: form.start_time,
        end_time: form.end_time,
        location: form.location || undefined,
        visibility: form.visibility,
        capacity: form.capacity ? parseInt(form.capacity) : undefined,
        registration_required: form.registration_required || registrationForced,
        price: parseFloat(form.price) || 0,
        is_recurring: form.is_recurring,
        recurrence_pattern: recurrencePattern,
        status: form.status,
        cancellation_deadline_hours: form.cancellation_deadline_hours
          ? parseInt(form.cancellation_deadline_hours)
          : undefined,
      })
      api.clearCache(`/organisations/${organisationId}/events`)
      navigate(`/dashboard/${organisationId}/events`)
    } catch {
      alert("Erreur lors de la création de l'événement")
    } finally {
      setLoading(false)
    }
  }

  const registrationForced =
    parseFloat(form.price) > 0 || (form.capacity !== '' && parseInt(form.capacity) > 0)

  const registrationForcedReason = parseFloat(form.price) > 0
    ? 'événement payant'
    : 'capacité limitée'

  return (
    <RoleBasedRoute allowedRoles={['club_owner', 'club_manager', 'coach']}>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/dashboard/${organisationId}/events`)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Créer un événement</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Remplissez les informations de l'événement</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Informations générales */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
              Informations générales
            </p>

            <div>
              <label htmlFor="title" className={labelCls}>Titre *</label>
              <input
                id="title"
                name="title"
                required
                value={form.title}
                onChange={handleChange}
                placeholder="Ex : Entraînement Yoga"
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="description" className={labelCls}>Description</label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={form.description}
                onChange={handleChange}
                placeholder="Décrivez l'événement…"
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="event_type" className={labelCls}>Type *</label>
                <select
                  id="event_type"
                  name="event_type"
                  required
                  value={form.event_type}
                  onChange={handleChange}
                  className={inputCls}
                >
                  <option value="training">Entraînement</option>
                  <option value="match">Match</option>
                  <option value="meeting">Réunion</option>
                  <option value="workshop">Atelier</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div>
                <label htmlFor="visibility" className={labelCls}>Visibilité *</label>
                <select
                  id="visibility"
                  name="visibility"
                  required
                  value={form.visibility}
                  onChange={handleChange}
                  className={inputCls}
                >
                  <option value="public">Public</option>
                  <option value="members_only">Membres uniquement</option>
                  <option value="private">Privé</option>
                </select>
              </div>
            </div>
          </div>

          {/* Date & lieu */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Date & lieu</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_time" className={labelCls}>Début *</label>
                <input
                  id="start_time"
                  name="start_time"
                  type="datetime-local"
                  required
                  value={form.start_time}
                  onChange={handleChange}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="end_time" className={labelCls}>Fin *</label>
                <input
                  id="end_time"
                  name="end_time"
                  type="datetime-local"
                  required
                  value={form.end_time}
                  onChange={handleChange}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label htmlFor="location" className={labelCls}>Lieu</label>
              <input
                id="location"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Ex : Salle de sport principale"
                className={inputCls}
              />
            </div>
          </div>

          {/* Capacité & tarif */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Capacité & tarif</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="capacity" className={labelCls}>Nombre de places</label>
                <input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={handleChange}
                  placeholder="Illimité"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="price" className={labelCls}>Prix (€)</label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label htmlFor="cancellation_deadline_hours" className={labelCls}>Délai d'annulation</label>
              <select
                id="cancellation_deadline_hours"
                name="cancellation_deadline_hours"
                value={form.cancellation_deadline_hours}
                onChange={handleChange}
                className={inputCls}
              >
                <option value="">Aucun délai (annulation libre)</option>
                <option value="1">1h avant</option>
                <option value="2">2h avant</option>
                <option value="6">6h avant</option>
                <option value="12">12h avant</option>
                <option value="24">24h avant</option>
                <option value="48">48h avant</option>
                <option value="72">72h avant</option>
              </select>
            </div>
          </div>

          {/* Options */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Options</p>

            <div className="space-y-3">
              <label className={`flex items-center gap-3 ${registrationForced ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  name="registration_required"
                  checked={form.registration_required || registrationForced}
                  onChange={handleChange}
                  disabled={registrationForced}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary/40 disabled:opacity-60"
                />
                <span className="text-sm text-foreground">
                  Inscription requise
                  {registrationForced && (
                    <span className="ml-1.5 text-[11px] font-bold text-primary/70 uppercase tracking-wide">
                      — imposé ({registrationForcedReason})
                    </span>
                  )}
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_recurring"
                  checked={form.is_recurring}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary/40"
                />
                <span className="text-sm text-foreground">Événement récurrent</span>
              </label>
            </div>

            {/* Recurrence form */}
            {form.is_recurring && (
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-4">
                <p className="text-[11px] uppercase tracking-wider text-primary font-bold">Récurrence</p>

                {/* Fréquence + intervalle */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Fréquence</label>
                    <select
                      value={recurrence.frequency}
                      onChange={e => setRecurrence(p => ({ ...p, frequency: e.target.value as Frequency, days_of_week: [] }))}
                      className={inputCls}
                    >
                      <option value="daily">Quotidienne</option>
                      <option value="weekly">Hebdomadaire</option>
                      <option value="monthly">Mensuelle</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>
                      Tous les {recurrence.frequency === 'daily' ? 'jours' : recurrence.frequency === 'weekly' ? 'semaines' : 'mois'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={recurrence.interval}
                      onChange={e => setRecurrence(p => ({ ...p, interval: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Jours de la semaine (weekly seulement) */}
                {recurrence.frequency === 'weekly' && (
                  <div>
                    <label className={labelCls}>Jours de répétition</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {DAY_LABELS.map((label, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => toggleDay(idx)}
                          className={`w-9 h-9 rounded-full text-xs font-bold transition-colors ${
                            recurrence.days_of_week.includes(idx)
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground hover:bg-muted/70'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fin de récurrence */}
                <div>
                  <label className={labelCls}>Fin de la récurrence</label>
                  <div className="flex rounded-xl overflow-hidden border border-border text-sm">
                    <button
                      type="button"
                      onClick={() => setRecurrence(p => ({ ...p, end_type: 'count' }))}
                      className={`flex-1 py-2 font-semibold transition-colors ${
                        recurrence.end_type === 'count'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      Nombre d'occurrences
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecurrence(p => ({ ...p, end_type: 'date' }))}
                      className={`flex-1 py-2 font-semibold transition-colors ${
                        recurrence.end_type === 'date'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      Date de fin
                    </button>
                  </div>

                  <div className="mt-2">
                    {recurrence.end_type === 'count' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="52"
                          value={recurrence.occurrences}
                          onChange={e => setRecurrence(p => ({ ...p, occurrences: e.target.value }))}
                          className={inputCls}
                        />
                        <span className="text-sm text-muted-foreground whitespace-nowrap">occurrences (max 52)</span>
                      </div>
                    ) : (
                      <input
                        type="date"
                        value={recurrence.end_date}
                        onChange={e => setRecurrence(p => ({ ...p, end_date: e.target.value }))}
                        className={inputCls}
                        required={form.is_recurring && recurrence.end_type === 'date'}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="status" className={labelCls}>Statut</label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className={inputCls}
              >
                <option value="draft">Brouillon</option>
                <option value="published">Publié</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pb-2">
            <button
              type="button"
              onClick={() => navigate(`/dashboard/${organisationId}/events`)}
              className="px-4 py-2.5 text-sm font-semibold rounded-full border border-border text-foreground hover:bg-muted transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-full bg-primary text-primary-foreground active:scale-95 transition-transform disabled:opacity-50"
            >
              <Save className="w-4 h-4 shrink-0" />
              {loading ? 'Création…' : "Créer l'événement"}
            </button>
          </div>

        </form>
      </div>
    </RoleBasedRoute>
  )
}

export default EventCreatePage
