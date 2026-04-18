import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Calendar, MapPin, Users, Euro, FileText } from 'lucide-react';
import RoleBasedRoute from '../../components/shared/RoleBasedRoute';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import type { EventType, EventVisibility, EventStatus } from '../../types';

const EventCreatePage: React.FC = () => {
    const { organisationId } = useParams<{ organisationId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
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
        is_recurring: false,
        recurrence_pattern: '',
        status: 'published' as EventStatus,
        cover_url: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!organisationId) return;

        try {
            setLoading(true);
            const payload = {
                ...formData,
                capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
                price: parseFloat(formData.price) || 0,
                recurrence_pattern: formData.is_recurring && formData.recurrence_pattern
                    ? formData.recurrence_pattern
                    : undefined,
            };

            await api.post(`/organisations/${organisationId}/events`, payload);
            api.clearCache(`/organisations/${organisationId}/events`);
            navigate(`/dashboard/${organisationId}/events`);
        } catch (error) {
            console.error('Error creating event:', error);
            alert('Erreur lors de la création de l\'événement');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    return (
        <RoleBasedRoute allowedRoles={['club_owner', 'club_manager', 'coach']}>
            <>
                <div className="p-6 max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={() => navigate(`/dashboard/${organisationId}/events`)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Créer un événement</h1>
                            <p className="text-gray-600 mt-1">Remplissez les informations de l'événement</p>
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
                                placeholder="Ex: Entraînement Yoga"
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
                                placeholder="Description de l'événement..."
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
                                placeholder="Ex: Salle de sport principale"
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
                                    placeholder="Ex: 20"
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
                                    placeholder="0.00"
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

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="is_recurring"
                                    checked={formData.is_recurring}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">Événement récurrent</span>
                            </label>
                        </div>

                        {/* Récurrence (si activée) */}
                        {formData.is_recurring && (
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 mb-2">
                                    La gestion complète de la récurrence sera implémentée prochainement.
                                    Pour l'instant, vous pouvez créer un événement unique.
                                </p>
                            </div>
                        )}

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
                            </select>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-4 pt-4 border-t">
                            <button
                                type="button"
                                onClick={() => navigate(`/dashboard/${organisationId}/events`)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-4 h-4" />
                                {loading ? 'Création...' : 'Créer l\'événement'}
                            </button>
                        </div>
                    </form>
                </div>
            </>
        </RoleBasedRoute>
    );
};

export default EventCreatePage;

