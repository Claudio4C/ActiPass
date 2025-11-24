import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, Euro, CheckCircle, Clock3, XCircle, AlertCircle } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import type { Event } from '../../types';

interface EventWithRegistration extends Event {
    myReservation?: {
        id: string;
        status: 'confirmed' | 'pending' | 'cancelled';
    };
    current_registrations?: number;
    available_spots?: number | null;
}

const EventsPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [events, setEvents] = useState<EventWithRegistration[]>([]);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [organisationId, setOrganisationId] = useState<string | null>(null);

    useEffect(() => {
        // Récupérer l'organisation sélectionnée depuis localStorage
        const loadOrganisation = () => {
            try {
                const raw = window.localStorage.getItem('selectedOrganisation');
                if (raw) {
                    const org = JSON.parse(raw);
                    if (org?.id) {
                        setOrganisationId(org.id);
                    }
                }
            } catch (error) {
                console.error('Error loading organisation:', error);
            }
        };

        loadOrganisation();
        window.addEventListener('storage', loadOrganisation);
        window.addEventListener('organisation:updated', loadOrganisation);

        return () => {
            window.removeEventListener('storage', loadOrganisation);
            window.removeEventListener('organisation:updated', loadOrganisation);
        };
    }, []);

    useEffect(() => {
        if (organisationId) {
            loadEvents();
        }
    }, [organisationId]);

    const loadEvents = async () => {
        if (!organisationId) return;
        try {
            setLoading(true);
            setError(null);
            // Charger les événements publiés uniquement
            const data = await api.get<EventWithRegistration[]>(
                `/organisations/${organisationId}/events`,
                { status: 'published' },
                { useCache: true, cacheTTL: 30000 }
            );
            setEvents(data);
        } catch (error) {
            console.error('Error loading events:', error);
            setError('Erreur lors du chargement des événements');
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (eventId: string) => {
        if (!organisationId) return;

        // Vérifier si l'événement nécessite une inscription
        const event = events.find(e => e.id === eventId);
        if (event && event.registration_required === false) {
            setError("Cet événement ne nécessite pas d'inscription");
            return;
        }

        try {
            setRegistering(eventId);
            setError(null);

            const result = await api.post<{
                message: string;
                reservation: {
                    id: string;
                    status: 'confirmed' | 'pending';
                };
            }>(`/organisations/${organisationId}/events/${eventId}/register`);

            // Mettre à jour l'événement avec la réservation
            setEvents(prev => prev.map(e => {
                if (e.id === eventId) {
                    const wasPending = result.reservation.status === 'pending';
                    return {
                        ...e,
                        myReservation: result.reservation,
                        // Ne pas incrémenter current_registrations si c'est en attente
                        current_registrations: wasPending
                            ? (e.current_registrations || 0)
                            : (e.current_registrations || 0) + 1,
                        available_spots: e.capacity
                            ? (wasPending
                                ? (e.available_spots || e.capacity)
                                : (e.available_spots || e.capacity) - 1)
                            : null
                    };
                }
                return e;
            }));

            // Afficher un message de succès
            alert(result.message);
            // Recharger les événements pour avoir les données à jour
            await loadEvents();
        } catch (error: any) {
            console.error('Error registering to event:', error);
            const errorMessage = error?.response?.data?.message || error?.message || "Erreur lors de l'inscription";
            setError(errorMessage);
            alert(errorMessage);
        } finally {
            setRegistering(null);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getRegistrationStatus = (event: EventWithRegistration) => {
        if (!event.registration_required) {
            return null; // Pas d'inscription nécessaire
        }
        if (event.myReservation) {
            if (event.myReservation.status === 'confirmed') {
                return { type: 'confirmed', label: 'Inscrit', icon: CheckCircle };
            }
            if (event.myReservation.status === 'pending') {
                return { type: 'pending', label: 'En attente', icon: Clock3 };
            }
            if (event.myReservation.status === 'cancelled') {
                return { type: 'cancelled', label: 'Annulé', icon: XCircle };
            }
        }
        return null;
    };

    const canRegister = (event: EventWithRegistration) => {
        if (!event.registration_required) return false;
        if (event.myReservation) return false;
        if (event.status !== 'published') return false;
        if (event.capacity && event.available_spots !== null && event.available_spots <= 0) {
            return false; // Plus de places disponibles
        }
        return true;
    };

    return (
        <Layout title="Événements" subtitle="Découvrez et inscrivez-vous aux événements du club" mode="club">
            <div className="space-y-6">
                {/* Message d'erreur */}
                {error && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-red-800">Erreur</p>
                            <p className="text-sm text-red-600 mt-1">{error}</p>
                        </div>
                        <button
                            onClick={() => setError(null)}
                            className="ml-auto text-red-600 hover:text-red-800"
                        >
                            <XCircle className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Liste des événements */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-600">Chargement des événements...</p>
                    </div>
                ) : events.length === 0 ? (
                    <div className="rounded-lg bg-gray-50 border border-gray-200 p-12 text-center">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">Aucun événement disponible</p>
                        <p className="text-sm text-gray-500 mt-2">Les événements à venir apparaîtront ici</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map((event) => {
                            const registrationStatus = getRegistrationStatus(event);
                            const canRegisterToEvent = canRegister(event);
                            const StatusIcon = registrationStatus?.icon;

                            return (
                                <div
                                    key={event.id}
                                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                                >
                                    {/* Image de couverture */}
                                    {event.cover_url && (
                                        <div className="h-48 overflow-hidden">
                                            <img
                                                src={event.cover_url}
                                                alt={event.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}

                                    <div className="p-6 space-y-4">
                                        {/* En-tête */}
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                                            {event.description && (
                                                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                                    {event.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Informations */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar className="w-4 h-4" />
                                                <span>{formatDate(event.start_time)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Clock className="w-4 h-4" />
                                                <span>
                                                    {formatTime(event.start_time)} - {formatTime(event.end_time)}
                                                </span>
                                            </div>
                                            {event.location && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <MapPin className="w-4 h-4" />
                                                    <span>{event.location}</span>
                                                </div>
                                            )}
                                            {event.capacity && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Users className="w-4 h-4" />
                                                    <span>
                                                        {event.current_registrations || 0} / {event.capacity} participants
                                                        {event.available_spots !== null && event.available_spots > 0 && (
                                                            <span className="text-green-600 ml-1">
                                                                ({event.available_spots} places disponibles)
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                            {event.price > 0 && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Euro className="w-4 h-4" />
                                                    <span className="font-medium">{event.price.toFixed(2)} €</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Statut d'inscription */}
                                        {registrationStatus && (
                                            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${registrationStatus.type === 'confirmed'
                                                ? 'bg-green-50 text-green-700'
                                                : registrationStatus.type === 'pending'
                                                    ? 'bg-yellow-50 text-yellow-700'
                                                    : 'bg-gray-50 text-gray-700'
                                                }`}>
                                                {StatusIcon && <StatusIcon className="w-4 h-4" />}
                                                <span className="text-sm font-medium">{registrationStatus.label}</span>
                                            </div>
                                        )}

                                        {/* Bouton d'action */}
                                        {event.registration_required ? (
                                            canRegisterToEvent ? (
                                                <button
                                                    onClick={() => handleRegister(event.id)}
                                                    disabled={registering === event.id}
                                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    {registering === event.id ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                            <span>Inscription...</span>
                                                        </>
                                                    ) : (
                                                        <span>S'inscrire</span>
                                                    )}
                                                </button>
                                            ) : (
                                                <div className="text-sm text-gray-500 text-center py-2">
                                                    {event.myReservation
                                                        ? 'Déjà inscrit'
                                                        : event.capacity && event.available_spots !== null && event.available_spots <= 0
                                                            ? 'Complet'
                                                            : 'Inscription non disponible'}
                                                </div>
                                            )
                                        ) : (
                                            <div className="text-sm text-gray-500 text-center py-2">
                                                Inscription non requise
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default EventsPage;

