import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import RoleBasedRoute from '../../components/shared/RoleBasedRoute'
import { api } from '../../lib/api'
import type { EventType, EventVisibility, EventStatus } from '../../types'

const inputCls =
  'w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-colors'
const labelCls = 'block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5'

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organisationId) { return }
    setLoading(true)
    try {
      await api.post(`/organisations/${organisationId}/events`, {
        ...form,
        capacity: form.capacity ? parseInt(form.capacity) : undefined,
        price: parseFloat(form.price) || 0,
      })
      api.clearCache(`/organisations/${organisationId}/events`)
      navigate(`/dashboard/${organisationId}/events`)
    } catch {
      alert("Erreur lors de la création de l'événement")
    } finally {
      setLoading(false)
    }
  }

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

          {/* Titre + Description */}
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

          {/* Dates + Lieu */}
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

          {/* Capacité + Prix */}
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
          </div>

          {/* Options + Statut */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Options</p>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="registration_required"
                  checked={form.registration_required}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary/40"
                />
                <span className="text-sm text-foreground">Inscription requise</span>
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

            {form.is_recurring && (
              <div className="rounded-xl bg-primary/5 border border-primary/15 p-3">
                <p className="text-xs text-muted-foreground">
                  La gestion de la récurrence sera disponible prochainement.
                </p>
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
