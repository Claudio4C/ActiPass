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

// Événements mockés pour l'affichage lorsque l'API n'est pas encore branchée
const mockEvents: EventWithRegistration[] = [
    {
        id: 'mock-1',
        organisation_id: 'mock-org',
        title: 'Stage technique Jiu-jitsu brésilien',
        description: 'Un après-midi dédié aux passages de garde et aux mises en situation, ouvert à tous les niveaux.',
        event_type: 'training',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        location: 'Dojo Villeurbanne',
        created_by_id: 'mock-user',
        visibility: 'members_only',
        capacity: 30,
        registration_required: true,
        price: 20,
        is_recurring: false,
        status: 'published',
        cover_url: 'https://source.unsplash.com/random/1200x600/?bjj,training,dojo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        current_registrations: 18,
        available_spots: 12,
    },
    {
        id: 'mock-2',
        organisation_id: 'mock-org',
        title: 'Séance découverte “Venez essayer le grappling”',
        description: 'Séance découverte gratuite pour inviter des proches à tester le club dans une ambiance détendue.',
        event_type: 'workshop',
        start_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
        location: 'Studio Croix-Rousse',
        created_by_id: 'mock-user',
        visibility: 'public',
        capacity: 40,
        registration_required: true,
        price: 0,
        is_recurring: false,
        status: 'published',
        cover_url: 'https://source.unsplash.com/random/1200x600/?grappling,jiu-jitsu,fitness',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        current_registrations: 22,
        available_spots: 18,
    },
    {
        id: 'mock-3',
        organisation_id: 'mock-org',
        title: 'Déplacement compétition régionale',
        description: 'Accompagnement du club sur une journée de compétition officielle (transport non inclus).',
        event_type: 'match',
        start_time: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
        location: 'Gymnase Gerland',
        created_by_id: 'mock-user',
        visibility: 'members_only',
        capacity: 20,
        registration_required: true,
        price: 0,
        is_recurring: false,
        status: 'published',
        cover_url: 'https://source.unsplash.com/random/1200x600/?tournament,competition,sport',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        current_registrations: 20,
        available_spots: 0,
    },
];

const EventsPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [events, setEvents] = useState<EventWithRegistration[]>([]);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [organisationId, setOrganisationId] = useState<string | null>(null);
    const [showWaitlistModal, setShowWaitlistModal] = useState(false);
    const [waitlistEventTitle, setWaitlistEventTitle] = useState<string | null>(null);
    const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);

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

    // Fallback pour pouvoir visualiser la page même sans organisation configurée
    useEffect(() => {
        if (!organisationId) {
            setLoading(false);
            setEvents(mockEvents);
        }
    }, [organisationId]);

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
            // Afficher au moins quelques événements mockés pour la démo
            setEvents(mockEvents);
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
                            const isMock = event.id.startsWith('mock-');
                            const isFull =
                                !!event.capacity &&
                                event.available_spots !== null &&
                                event.available_spots <= 0;

                            return (
                                <div
                                    key={event.id}
                                    onClick={() => navigate(`/club/events/${event.id}`)}
                                    className="cursor-pointer bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
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
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        void handleRegister(event.id);
                                                    }}
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
                                            ) : isMock && isFull ? (
                                                <div className="space-y-2 text-center">
                                                    <div className="text-sm text-gray-500">
                                                        Événement complet — les nouvelles inscriptions seront placées sur liste
                                                        d'attente (démo).
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setWaitlistEventTitle(event.title);
                                                            // Position simulée pour la démo
                                                            const randomPosition = Math.floor(Math.random() * 5) + 1;
                                                            setWaitlistPosition(randomPosition);
                                                            setShowWaitlistModal(true);
                                                        }}
                                                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                                                    >
                                                        Rejoindre la liste d'attente (démo)
                                                    </button>
                                                    <p className="text-xs text-gray-400">
                                                        Si un participant annule, les personnes en liste d’attente seront ajoutées
                                                        automatiquement par ordre de priorité.
                                                    </p>
                                                </div>
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

                {showWaitlistModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6 relative overflow-hidden">
                            <div className="absolute -top-16 -right-10 h-32 w-32 rounded-full bg-blue-100 opacity-40 blur-2xl" />
                            <div className="absolute -bottom-20 -left-10 h-32 w-32 rounded-full bg-indigo-100 opacity-50 blur-2xl" />

                            <div className="relative">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="relative inline-flex">
                                        <span className="absolute inline-flex h-9 w-9 rounded-full bg-blue-200 opacity-75 animate-ping" />
                                        <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-semibold shadow-md">
                                            ✔
                                        </span>
                                    </div>
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Ajouté à la liste d’attente
                                    </h2>
                                </div>

                                <p className="text-sm text-slate-600 mb-3">
                                    Vous avez été ajouté(e) à la liste d’attente pour l’événement :
                                </p>
                                <p className="text-sm font-medium text-slate-900 mb-4">
                                    {waitlistEventTitle}
                                </p>
                                {typeof waitlistPosition === 'number' && (
                                    <p className="text-sm text-slate-700 mb-4">
                                        Position simulée dans la liste :{' '}
                                        <span className="font-semibold">#{waitlistPosition}</span>.
                                    </p>
                                )}
                                <p className="text-xs text-slate-500 mb-6">
                                    Dans la version réelle, si un participant se désinscrit, les personnes en liste
                                    d’attente seraient automatiquement intégrées à l’événement dans l’ordre de la liste,
                                    et vous seriez notifié(e) par email.
                                </p>
                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                                        onClick={() => setShowWaitlistModal(false)}
                                    >
                                        Fermer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default EventsPage;

