import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Calendar, MapPin, Users, Euro } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import RoleBasedRoute from '../../components/shared/RoleBasedRoute';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import type { Event, EventType, EventVisibility, EventStatus } from '../../types';

const EventEditPage: React.FC = () => {
    const { organisationId, eventId } = useParams<{ organisationId: string; eventId: string }>();
    const { user } = useAuth();
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
        cover_url: '',
        apply_to_all_occurrences: false,
    });

    useEffect(() => {
        if (organisationId && eventId) {
            loadEvent();
        }
    }, [organisationId, eventId]);

    const loadEvent = async () => {
        if (!organisationId || !eventId) return;
        try {
            setLoading(true);
            const data = await api.get<Event>(`/organisations/${organisationId}/events/${eventId}`);
            setEvent(data);

            // Formater les dates pour les inputs datetime-local
            const startDate = new Date(data.start_time);
            const endDate = new Date(data.end_time);
            const formatDateTime = (date: Date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                return `${year}-${month}-${day}T${hours}:${minutes}`;
            };

            setFormData({
                title: data.title,
                description: data.description || '',
                event_type: data.event_type,
                start_time: formatDateTime(startDate),
                end_time: formatDateTime(endDate),
                location: data.location || '',
                visibility: data.visibility,
                capacity: data.capacity?.toString() || '',
                registration_required: data.registration_required,
                price: data.price?.toString() || '0',
                status: data.status,
                cover_url: data.cover_url || '',
                apply_to_all_occurrences: false,
            });
        } catch (error) {
            console.error('Error loading event:', error);
            alert('Erreur lors du chargement de l\'événement');
            navigate(`/dashboard/${organisationId}/events`);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!organisationId || !eventId) return;

        try {
            setSaving(true);
            const payload = {
                ...formData,
                capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
                price: parseFloat(formData.price) || 0,
            };

            await api.put(`/organisations/${organisationId}/events/${eventId}`, payload);
            api.clearCache(`/organisations/${organisationId}/events`);
            navigate(`/dashboard/${organisationId}/events/${eventId}`);
        } catch (error) {
            console.error('Error updating event:', error);
            alert('Erreur lors de la modification de l\'événement');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="p-6">
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-600">Chargement de l'événement...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!event) {
        return null;
    }

    return (
        <RoleBasedRoute allowedRoles={['club_owner', 'club_manager', 'coach']}>
            <DashboardLayout>
                <div className="p-6 max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={() => navigate(`/dashboard/${organisationId}/events/${eventId}`)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Modifier l'événement</h1>
                            <p className="text-gray-600 mt-1">{event.title}</p>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
                        {/* Titre */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                Titre de l'événement *
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                required
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows={4}
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Type et Visibilité */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="event_type" className="block text-sm font-medium text-gray-700 mb-2">
                                    Type d'événement *
                                </label>
                                <select
                                    id="event_type"
                                    name="event_type"
                                    required
                                    value={formData.event_type}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="training">Entraînement</option>
                                    <option value="match">Match</option>
                                    <option value="meeting">Réunion</option>
                                    <option value="workshop">Atelier</option>
                                    <option value="other">Autre</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-2">
                                    Visibilité *
                                </label>
                                <select
                                    id="visibility"
                                    name="visibility"
                                    required
                                    value={formData.visibility}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="public">Public</option>
                                    <option value="members_only">Membres uniquement</option>
                                    <option value="private">Privé</option>
                                </select>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-2">
                                    Date et heure de début *
                                </label>
                                <input
                                    type="datetime-local"
                                    id="start_time"
                                    name="start_time"
                                    required
                                    value={formData.start_time}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-2">
                                    Date et heure de fin *
                                </label>
                                <input
                                    type="datetime-local"
                                    id="end_time"
                                    name="end_time"
                                    required
                                    value={formData.end_time}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Lieu */}
                        <div>
                            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                                Lieu
                            </label>
                            <input
                                type="text"
                                id="location"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Capacité et Prix */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-2">
                                    Capacité (nombre de places)
                                </label>
                                <input
                                    type="number"
                                    id="capacity"
                                    name="capacity"
                                    min="1"
                                    value={formData.capacity}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                                    Prix (€)
                                </label>
                                <input
                                    type="number"
                                    id="price"
                                    name="price"
                                    min="0"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Options */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="registration_required"
                                    checked={formData.registration_required}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">Inscription requise</span>
                            </label>

                            {event.is_recurring && (
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="apply_to_all_occurrences"
                                        checked={formData.apply_to_all_occurrences}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Appliquer à toutes les occurrences</span>
                                </label>
                            )}
                        </div>

                        {/* Statut */}
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                                Statut
                            </label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="draft">Brouillon</option>
                                <option value="published">Publié</option>
                                <option value="cancelled">Annulé</option>
                            </select>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-4 pt-4 border-t">
                            <button
                                type="button"
                                onClick={() => navigate(`/dashboard/${organisationId}/events/${eventId}`)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </div>
                    </form>
                </div>
            </DashboardLayout>
        </RoleBasedRoute>
    );
};

export default EventEditPage;

