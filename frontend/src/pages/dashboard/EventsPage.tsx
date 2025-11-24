import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Plus, Search, Filter, Edit, Trash2, Eye, Users, Clock, MapPin } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import RoleBasedRoute from '../../components/shared/RoleBasedRoute';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import type { Event, EventStatus, EventType } from '../../types';

const EventsPage: React.FC = () => {
    const { organisationId } = useParams<{ organisationId: string }>();
    const { user } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all');
    const [typeFilter, setTypeFilter] = useState<EventType | 'all'>('all');

    useEffect(() => {
        if (organisationId) {
            loadEvents();
        }
    }, [organisationId, statusFilter, typeFilter]);

    const loadEvents = async () => {
        if (!organisationId) return;
        try {
            setLoading(true);
            const filters: Record<string, string> = {};
            if (statusFilter !== 'all') {
                filters.status = statusFilter;
            }
            if (typeFilter !== 'all') {
                filters.event_type = typeFilter;
            }
            const data = await api.get<Event[]>(
                `/organisations/${organisationId}/events`,
                filters,
                { useCache: true, cacheTTL: 30000 }
            );
            setEvents(data);
        } catch (error) {
            console.error('Error loading events:', error);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (eventId: string) => {
        if (!organisationId) return;
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;

        try {
            await api.delete(`/organisations/${organisationId}/events/${eventId}`);
            api.clearCache(`/organisations/${organisationId}/events`);
            await loadEvents();
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Erreur lors de la suppression de l\'événement');
        }
    };

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.description?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status: EventStatus) => {
        const badges = {
            draft: 'bg-gray-100 text-gray-800',
            published: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        return badges[status] || badges.draft;
    };

    const getTypeLabel = (type: EventType) => {
        const labels: Record<EventType, string> = {
            training: 'Entraînement',
            match: 'Match',
            meeting: 'Réunion',
            workshop: 'Atelier',
            other: 'Autre',
        };
        return labels[type] || type;
    };

    return (
        <RoleBasedRoute allowedRoles={['club_owner', 'club_manager', 'coach']}>
            <DashboardLayout>
                <div className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Événements</h1>
                            <p className="text-gray-600 mt-1">Gérez les événements de votre organisation</p>
                        </div>
                        <Link
                            to={`/dashboard/${organisationId}/events/create`}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Créer un événement
                        </Link>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Rechercher un événement..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Status Filter */}
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as EventStatus | 'all')}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">Tous les statuts</option>
                                <option value="draft">Brouillon</option>
                                <option value="published">Publié</option>
                                <option value="cancelled">Annulé</option>
                            </select>

                            {/* Type Filter */}
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value as EventType | 'all')}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">Tous les types</option>
                                <option value="training">Entraînement</option>
                                <option value="match">Match</option>
                                <option value="meeting">Réunion</option>
                                <option value="workshop">Atelier</option>
                                <option value="other">Autre</option>
                            </select>
                        </div>
                    </div>

                    {/* Events List */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="mt-2 text-gray-600">Chargement des événements...</p>
                        </div>
                    ) : filteredEvents.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-lg shadow">
                            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">Aucun événement trouvé</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredEvents.map((event) => (
                                <div
                                    key={event.id}
                                    className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
                                >
                                    {event.cover_url && (
                                        <img
                                            src={event.cover_url}
                                            alt={event.title}
                                            className="w-full h-48 object-cover rounded-t-lg"
                                        />
                                    )}
                                    <div className="p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-lg text-gray-900">{event.title}</h3>
                                                <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusBadge(event.status)}`}>
                                                    {event.status === 'draft' ? 'Brouillon' : event.status === 'published' ? 'Publié' : 'Annulé'}
                                                </span>
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>

                                        <div className="space-y-2 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4" />
                                                <span>{formatDate(event.start_time)} à {formatTime(event.start_time)}</span>
                                            </div>
                                            {event.location && (
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4" />
                                                    <span>{event.location}</span>
                                                </div>
                                            )}
                                            {event.capacity && (
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4" />
                                                    <span>
                                                        {event.current_registrations || 0} / {event.capacity} participants
                                                        {event.available_spots !== null && event.available_spots > 0 && (
                                                            <span className="text-green-600 ml-1">({event.available_spots} places disponibles)</span>
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t">
                                            <span className="text-xs text-gray-500">{getTypeLabel(event.event_type)}</span>
                                            <div className="flex gap-2">
                                                <Link
                                                    to={`/dashboard/${organisationId}/events/${event.id}`}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Voir les détails"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                <Link
                                                    to={`/dashboard/${organisationId}/events/${event.id}/edit`}
                                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                    title="Modifier"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(event.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DashboardLayout>
        </RoleBasedRoute>
    );
};

export default EventsPage;

