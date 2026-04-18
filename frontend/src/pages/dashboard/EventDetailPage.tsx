import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Calendar, MapPin, Users, Euro, Clock, X, Check, UserPlus } from 'lucide-react';
import RoleBasedRoute from '../../components/shared/RoleBasedRoute';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import type { Event, Reservation } from '../../types';

const EventDetailPage: React.FC = () => {
    const { organisationId, eventId } = useParams<{ organisationId: string; eventId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState<Event | null>(null);
    const [waitlistData, setWaitlistData] = useState<{
        event: { id: string; title: string; capacity?: number; current_registrations: number; available_spots: number | null };
        confirmed: Reservation[];
        waitlist: Reservation[];
        can_manage_capacity: boolean;
    } | null>(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [refundAutomatically, setRefundAutomatically] = useState(true);

    useEffect(() => {
        if (organisationId && eventId) {
            loadEvent();
            loadWaitlist();
        }
    }, [organisationId, eventId]);

    const loadEvent = async () => {
        if (!organisationId || !eventId) return;
        try {
            setLoading(true);
            const data = await api.get<Event>(`/organisations/${organisationId}/events/${eventId}`);
            setEvent(data);
        } catch (error) {
            console.error('Error loading event:', error);
            alert('Erreur lors du chargement de l\'événement');
            navigate(`/dashboard/${organisationId}/events`);
        } finally {
            setLoading(false);
        }
    };

    const loadWaitlist = async () => {
        if (!organisationId || !eventId) return;
        try {
            const data = await api.get(`/organisations/${organisationId}/events/${eventId}/waitlist`);
            setWaitlistData(data);
        } catch (error) {
            console.error('Error loading waitlist:', error);
        }
    };

    const handleDelete = async () => {
        if (!organisationId || !eventId) return;
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;

        try {
            await api.delete(`/organisations/${organisationId}/events/${eventId}`);
            api.clearCache(`/organisations/${organisationId}/events`);
            navigate(`/dashboard/${organisationId}/events`);
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Erreur lors de la suppression de l\'événement');
        }
    };

    const handleCancel = async () => {
        if (!organisationId || !eventId) return;

        try {
            await api.post(`/organisations/${organisationId}/events/${eventId}/cancel`, {
                reason: cancelReason,
                refund_automatically: refundAutomatically,
                notify_participants: true,
            });
            api.clearCache(`/organisations/${organisationId}/events`);
            setShowCancelModal(false);
            await loadEvent();
            await loadWaitlist();
        } catch (error) {
            console.error('Error cancelling event:', error);
            alert('Erreur lors de l\'annulation de l\'événement');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
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

    const getStatusBadge = (status: string) => {
        const badges: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-800',
            published: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        return badges[status] || badges.draft;
    };

    if (loading) {
        return (
            <>
                <div className="p-6">
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-600">Chargement de l'événement...</p>
                    </div>
                </div>
            </>
        );
    }

    if (!event) {
        return null;
    }

    return (
        <RoleBasedRoute allowedRoles={['club_owner', 'club_manager', 'coach']}>
            <>
                <div className="p-6 max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(`/dashboard/${organisationId}/events`)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
                                <span className={`inline-block px-3 py-1 text-sm rounded-full mt-2 ${getStatusBadge(event.status)}`}>
                                    {event.status === 'draft' ? 'Brouillon' : event.status === 'published' ? 'Publié' : 'Annulé'}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Link
                                to={`/dashboard/${organisationId}/events/${eventId}/edit`}
                                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                <Edit className="w-4 h-4" />
                                Modifier
                            </Link>
                            {event.status !== 'cancelled' && (
                                <button
                                    onClick={() => setShowCancelModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 text-orange-700 bg-orange-100 rounded-lg hover:bg-orange-200 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                    Annuler
                                </button>
                            )}
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-2 px-4 py-2 text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Supprimer
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Informations principales */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Description */}
                            {event.description && (
                                <div className="bg-white rounded-lg shadow p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
                                    <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
                                </div>
                            )}

                            {/* Détails */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Détails de l'événement</h2>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-500">Date et heure</p>
                                            <p className="text-gray-900">
                                                {formatDate(event.start_time)} de {formatTime(event.start_time)} à {formatTime(event.end_time)}
                                            </p>
                                        </div>
                                    </div>
                                    {event.location && (
                                        <div className="flex items-start gap-3">
                                            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-sm text-gray-500">Lieu</p>
                                                <p className="text-gray-900">{event.location}</p>
                                            </div>
                                        </div>
                                    )}
                                    {event.capacity && (
                                        <div className="flex items-start gap-3">
                                            <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-sm text-gray-500">Capacité</p>
                                                <p className="text-gray-900">
                                                    {event.current_registrations || 0} / {event.capacity} participants
                                                    {event.available_spots !== null && event.available_spots > 0 && (
                                                        <span className="text-green-600 ml-2">({event.available_spots} places disponibles)</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {event.price > 0 && (
                                        <div className="flex items-start gap-3">
                                            <Euro className="w-5 h-5 text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-sm text-gray-500">Prix</p>
                                                <p className="text-gray-900">{event.price.toFixed(2)} €</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Liste d'attente et participants */}
                            {waitlistData && (
                                <div className="bg-white rounded-lg shadow p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Participants et liste d'attente</h2>

                                    {/* Participants confirmés */}
                                    <div className="mb-6">
                                        <h3 className="text-sm font-medium text-gray-700 mb-3">
                                            Participants confirmés ({waitlistData.confirmed.length})
                                        </h3>
                                        {waitlistData.confirmed.length === 0 ? (
                                            <p className="text-sm text-gray-500">Aucun participant confirmé</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {waitlistData.confirmed.map((reservation) => (
                                                    <div
                                                        key={reservation.id}
                                                        className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                                                    >
                                                        <div>
                                                            <p className="font-medium text-gray-900">
                                                                {reservation.membership?.user.firstname} {reservation.membership?.user.lastname}
                                                            </p>
                                                            <p className="text-sm text-gray-500">{reservation.membership?.user.email}</p>
                                                        </div>
                                                        <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
                                                            Confirmé
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Liste d'attente */}
                                    {waitlistData.waitlist.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-700 mb-3">
                                                Liste d'attente ({waitlistData.waitlist.length})
                                            </h3>
                                            <div className="space-y-2">
                                                {waitlistData.waitlist.map((reservation, index) => (
                                                    <div
                                                        key={reservation.id}
                                                        className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
                                                    >
                                                        <div>
                                                            <p className="font-medium text-gray-900">
                                                                {reservation.membership?.user.firstname} {reservation.membership?.user.lastname}
                                                            </p>
                                                            <p className="text-sm text-gray-500">
                                                                {reservation.membership?.user.email} • Position #{index + 1}
                                                            </p>
                                                        </div>
                                                        {waitlistData.can_manage_capacity && (
                                                            <button
                                                                onClick={async () => {
                                                                    // TODO: Promouvoir de la liste d'attente
                                                                    alert('Fonctionnalité à implémenter');
                                                                }}
                                                                className="text-xs text-blue-700 bg-blue-100 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors"
                                                            >
                                                                Confirmer
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Informations rapides */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-sm font-medium text-gray-700 mb-4">Informations</h3>
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <p className="text-gray-500">Type</p>
                                        <p className="text-gray-900 font-medium">
                                            {event.event_type === 'training' ? 'Entraînement' :
                                                event.event_type === 'match' ? 'Match' :
                                                    event.event_type === 'meeting' ? 'Réunion' :
                                                        event.event_type === 'workshop' ? 'Atelier' : 'Autre'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Visibilité</p>
                                        <p className="text-gray-900 font-medium">
                                            {event.visibility === 'public' ? 'Public' :
                                                event.visibility === 'members_only' ? 'Membres uniquement' : 'Privé'}
                                        </p>
                                    </div>
                                    {event.created_by && (
                                        <div>
                                            <p className="text-gray-500">Créé par</p>
                                            <p className="text-gray-900 font-medium">
                                                {event.created_by.firstname} {event.created_by.lastname}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Modal d'annulation */}
                    {showCancelModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Annuler l'événement</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Raison de l'annulation (optionnel)
                                        </label>
                                        <textarea
                                            value={cancelReason}
                                            onChange={(e) => setCancelReason(e.target.value)}
                                            rows={3}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Ex: Conditions météo défavorables..."
                                        />
                                    </div>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={refundAutomatically}
                                            onChange={(e) => setRefundAutomatically(e.target.checked)}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">Remboursement automatique</span>
                                    </label>
                                </div>
                                <div className="flex justify-end gap-4 mt-6">
                                    <button
                                        onClick={() => setShowCancelModal(false)}
                                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        Confirmer l'annulation
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </>
        </RoleBasedRoute>
    );
};

export default EventDetailPage;

