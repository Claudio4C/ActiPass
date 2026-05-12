import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import RoleBasedRoute from '../../components/shared/RoleBasedRoute';
import { api } from '../../lib/api';
import type { Event, EventType, EventVisibility, EventStatus } from '../../types';

// ─── Shared primitives ────────────────────────────────────────────────────────

const inputCls = 'w-full h-11 px-3 rounded-xl border border-border bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors'
const selectCls = 'w-full h-11 px-3 rounded-xl border border-border bg-muted text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors appearance-none'

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
  <div>
    <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block mb-1.5">
      {label}{required && ' *'}
    </label>
    {children}
  </div>
)

// ─── Main ─────────────────────────────────────────────────────────────────────

const EventEditPage: React.FC = () => {
  const { organisationId, eventId } = useParams<{ organisationId: string; eventId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
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
    status: 'published' as EventStatus,
    apply_to_all_occurrences: false,
  });

  useEffect(() => {
    if (organisationId && eventId) { loadEvent() }
  }, [organisationId, eventId]);

  const loadEvent = async () => {
    if (!organisationId || !eventId) { return }
    try {
      setLoading(true);
      const data = await api.get<Event>(`/organisations/${organisationId}/events/${eventId}`);
      setEvent(data);

      const fmt = (d: Date) => {
        const pad = (n: number) => String(n).padStart(2, '0')
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
      }

      setFormData({
        title: data.title,
        description: data.description || '',
        event_type: data.event_type,
        start_time: fmt(new Date(data.start_time)),
        end_time: fmt(new Date(data.end_time)),
        location: data.location || '',
        visibility: data.visibility,
        capacity: data.capacity?.toString() || '',
        registration_required: data.registration_required,
        price: data.price?.toString() || '0',
        status: data.status,
        apply_to_all_occurrences: false,
      });
    } catch {
      navigate(`/dashboard/${organisationId}/events`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId || !eventId) { return }
    try {
      setSaving(true);
      await api.put(`/organisations/${organisationId}/events/${eventId}`, {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        price: parseFloat(formData.price) || 0,
      });
      api.clearCache(`/organisations/${organisationId}/events`);
      navigate(`/dashboard/${organisationId}/events/${eventId}`);
    } catch {
      // erreur silencieuse — naviguer reste possible
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!event) { return null }

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to={`/dashboard/${organisationId}/events/${eventId}`}
          className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors active:scale-95 shrink-0"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Modifier l'événement</h1>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">{event.title}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Identité */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold pb-2 border-b border-border">Informations</p>

          <Field label="Titre" required>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="Titre de l'événement"
              className={inputCls}
            />
          </Field>

          <Field label="Description">
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Décrivez l'événement…"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Type" required>
              <select name="event_type" required value={formData.event_type} onChange={handleChange} className={selectCls}>
                <option value="training">Entraînement</option>
                <option value="match">Match</option>
                <option value="meeting">Réunion</option>
                <option value="workshop">Atelier</option>
                <option value="other">Autre</option>
              </select>
            </Field>
            <Field label="Statut">
              <select name="status" value={formData.status} onChange={handleChange} className={selectCls}>
                <option value="draft">Brouillon</option>
                <option value="published">Publié</option>
                <option value="cancelled">Annulé</option>
              </select>
            </Field>
          </div>
        </div>

        {/* Dates */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold pb-2 border-b border-border">Date & lieu</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Début" required>
              <input
                type="datetime-local"
                name="start_time"
                required
                value={formData.start_time}
                onChange={handleChange}
                className={inputCls}
              />
            </Field>
            <Field label="Fin" required>
              <input
                type="datetime-local"
                name="end_time"
                required
                value={formData.end_time}
                onChange={handleChange}
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Lieu">
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Salle omnisports, terrain 2…"
              className={inputCls}
            />
          </Field>
        </div>

        {/* Paramètres */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold pb-2 border-b border-border">Paramètres</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Visibilité">
              <select name="visibility" value={formData.visibility} onChange={handleChange} className={selectCls}>
                <option value="public">Public</option>
                <option value="members_only">Membres uniquement</option>
                <option value="private">Privé</option>
              </select>
            </Field>
            <Field label="Capacité">
              <input
                type="number"
                name="capacity"
                min="1"
                value={formData.capacity}
                onChange={handleChange}
                placeholder="Illimitée"
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Prix (€)">
            <input
              type="number"
              name="price"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
              className={inputCls}
            />
          </Field>

          <div className="space-y-3 pt-1">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setFormData((p) => ({ ...p, registration_required: !p.registration_required }))}
                className={`w-11 h-6 rounded-full transition-colors shrink-0 flex items-center px-0.5 ${formData.registration_required ? 'bg-primary' : 'bg-border'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${formData.registration_required ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
              <span className="text-sm text-foreground font-medium">Inscription requise</span>
            </label>

            {event.is_recurring && (
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setFormData((p) => ({ ...p, apply_to_all_occurrences: !p.apply_to_all_occurrences }))}
                  className={`w-11 h-6 rounded-full transition-colors shrink-0 flex items-center px-0.5 ${formData.apply_to_all_occurrences ? 'bg-primary' : 'bg-border'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${formData.apply_to_all_occurrences ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <span className="text-sm text-foreground font-medium">Appliquer à toutes les occurrences</span>
              </label>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pb-8">
          <Link
            to={`/dashboard/${organisationId}/events/${eventId}`}
            className="flex-1 h-12 flex items-center justify-center rounded-2xl border border-border text-foreground text-sm font-semibold hover:border-primary/40 transition-colors active:scale-95"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 h-12 bg-primary text-primary-foreground rounded-2xl font-bold text-sm inline-flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-transform shadow-lg shadow-primary/25 disabled:opacity-50"
          >
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin shrink-0" /> Enregistrement…</>
              : <><Save className="w-4 h-4 shrink-0" /> Enregistrer</>}
          </button>
        </div>

      </form>
    </div>
  );
};

const ProtectedEventEditPage: React.FC = () => (
  <RoleBasedRoute allowedRoles={['club_owner', 'club_manager', 'coach']}>
    <EventEditPage />
  </RoleBasedRoute>
);

export default ProtectedEventEditPage;
