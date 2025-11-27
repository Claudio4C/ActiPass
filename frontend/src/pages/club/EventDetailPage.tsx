import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, Users, Euro, CheckCircle, Clock3, XCircle, AlertCircle, UserPlus, Plane, Check, X } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import type { Event } from '../../types';
import Button from '../../components/ui/Button';

interface EventWithRegistration extends Event {
    myReservation?: {
        id: string;
        status: 'confirmed' | 'pending' | 'cancelled';
    };
    current_registrations?: number;
    available_spots?: number | null;
}

// Type pour une invitation de voyage
type TripInvitation = {
    id: string;
    eventId: string;
    tripId: string;
    invitedBy: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    status: 'pending' | 'accepted' | 'declined';
    createdAt: string;
    tripSummary: {
        transports: number;
        accommodations: number;
        restaurants: number;
        invitedMembers: number;
    };
};

// Invitations de voyage mockées (en production, tu les chargerais depuis l'API)
const mockTripInvitations: TripInvitation[] = [
    {
        id: 'trip-invitation-1',
        eventId: 'mock-1',
        tripId: 'trip-mock-1',
        invitedBy: {
            id: 'member-2',
            firstName: 'Sophie',
            lastName: 'Martin',
            email: 'sophie.martin@example.com',
        },
        status: 'pending',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        tripSummary: {
            transports: 2,
            accommodations: 2,
            restaurants: 1,
            invitedMembers: 5,
        },
    },
    {
        id: 'trip-invitation-2',
        eventId: 'mock-3',
        tripId: 'trip-mock-3',
        invitedBy: {
            id: 'member-1',
            firstName: 'Alexandre',
            lastName: 'Dubois',
            email: 'alexandre.dubois@example.com',
        },
        status: 'pending',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        tripSummary: {
            transports: 3,
            accommodations: 3,
            restaurants: 1,
            invitedMembers: 8,
        },
    },
];

// Événements mockés avec des descriptions enrichies pour la page détail
const mockEvents: Record<string, EventWithRegistration> = {
    'mock-1': {
        id: 'mock-1',
        organisation_id: 'mock-org',
        title: 'Stage technique Jiu-jitsu brésilien',
        description: 'Un après-midi complet dédié aux passages de garde et aux mises en situation réelles. Ce stage s\'adresse à tous les niveaux, du débutant au confirmé.\n\nProgramme :\n• Échauffement spécifique et mobilité articulaire (20 min)\n• Passage de garde debout : techniques X-guard, toreando, knee cut (1h30)\n• Situations de combat au sol avec rotations (1h)\n• Sparring libre avec feedback personnalisé (30 min)\n\nLe stage est encadré par nos coachs certifiés. Prévoir une tenue adaptée (kimono ou no-gi).\n\nMatériel fourni : tapis, protections. Pensez à apporter votre gourde !',
        event_type: 'training',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        location: 'Dojo Villeurbanne, 42 rue des Arts Martiaux, 69100 Villeurbanne',
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
    'mock-2': {
        id: 'mock-2',
        organisation_id: 'mock-org',
        title: 'Séance découverte “Venez essayer le grappling”',
        description: 'Séance découverte gratuite pour inviter vos proches (famille, amis) à tester le club dans une ambiance détendue et bienveillante.\n\nAu programme :\n• Présentation des disciplines pratiquées au club\n• Découverte des bases du grappling et du Jiu-jitsu brésilien\n• Séquence d\'échauffement ludique\n• Petits jeux techniques adaptés aux débutants\n• Échanges avec les membres du club\n\nCette séance est ouverte à tous, sans condition physique particulière. Idéal pour se faire une première idée de la pratique avant de s\'engager. Les enfants à partir de 10 ans sont les bienvenus accompagnés d\'un parent.\n\nTenue de sport classique recommandée. Tapis et matériel fournis.',
        event_type: 'workshop',
        start_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
        location: 'Studio Croix-Rousse, 18 rue du Mail, 69004 Lyon',
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
    'mock-3': {
        id: 'mock-3',
        organisation_id: 'mock-org',
        title: 'Déplacement compétition régionale',
        description: 'Accompagnement du club sur une journée complète de compétition officielle de Jiu-jitsu brésilien organisée par la fédération régionale.\n\nInformations pratiques :\n• Départ prévu à 6h30 depuis le club\n• Retour estimé vers 19h00\n• Transport non inclus : covoiturage organisé (participation aux frais : 5€)\n• Repas de midi : prévoir un pique-nique ou possibilité de restauration sur place (12€)\n\nCompétiteurs et supporters sont les bienvenus. Nous encadrons les athlètes et partageons cette expérience ensemble pour renforcer la cohésion du groupe.\n\nMerci de confirmer votre présence avant jeudi pour organiser le covoiturage. Les places sont limitées pour des raisons logistiques.',
        event_type: 'match',
        start_time: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
        location: 'Gymnase Gerland, 353 avenue Jean Jaurès, 69007 Lyon',
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
};

const EventDetailPage: React.FC = () => {
    const { eventId } = useParams<{ eventId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [organisationId, setOrganisationId] = useState<string | null>(null);
    const [event, setEvent] = useState<EventWithRegistration | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [registering, setRegistering] = useState(false);
    const [tripInvitation, setTripInvitation] = useState<TripInvitation | null>(null);
    const [processingInvitation, setProcessingInvitation] = useState(false);
    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const [showDeclineConfirmModal, setShowDeclineConfirmModal] = useState(false);

    useEffect(() => {
        // Récupérer l'organisation sélectionnée depuis localStorage (même logique que EventsPage)
        const loadOrganisation = () => {
            try {
                const raw = window.localStorage.getItem('selectedOrganisation');
                if (raw) {
                    const org = JSON.parse(raw);
                    if (org?.id) {
                        setOrganisationId(org.id);
                    }
                }
            } catch (err) {
                console.error('Error loading organisation:', err);
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
        if (eventId) {
            void loadEvent();
            void loadTripInvitation();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [organisationId, eventId]);

    const loadTripInvitation = async () => {
        if (!eventId || !user?.id) return;
        
        try {
            // Simuler le chargement d'une invitation (en production, tu chargerais depuis l'API)
            // Pour la démo, on simule que l'utilisateur est invité à l'événement mock-3
            const invitation = mockTripInvitations.find(
                inv => inv.eventId === eventId && inv.status === 'pending'
            );
            
            if (invitation) {
                setTripInvitation(invitation);
            } else {
                setTripInvitation(null);
            }
        } catch (err) {
            console.error('Error loading trip invitation:', err);
        }
    };

    const loadEvent = async () => {
        if (!eventId) return;
        try {
            setLoading(true);
            setError(null);
            
            // Vérifier si c'est un événement mocké
            if (mockEvents[eventId]) {
                setEvent(mockEvents[eventId]);
                setLoading(false);
                return;
            }
            
            // Sinon, essayer de charger depuis l'API si une organisation est configurée
            if (organisationId) {
                const data = await api.get<EventWithRegistration>(`/organisations/${organisationId}/events/${eventId}`);
                setEvent(data);
            } else {
                // Si pas d'organisation configurée, utiliser les données mockées comme fallback
                if (mockEvents[eventId]) {
                    setEvent(mockEvents[eventId]);
                } else {
                    setError("Cet événement n'existe pas ou n'est plus disponible.");
                }
            }
        } catch (err) {
            console.error('Error loading event:', err);
            // En cas d'erreur API, essayer d'utiliser les données mockées
            if (mockEvents[eventId]) {
                setEvent(mockEvents[eventId]);
                setError(null); // Pas d'erreur si on a des données mockées
            } else {
                setError("Impossible de charger cet événement. Il n'existe peut-être plus.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!eventId || !event) return;

        if (event.registration_required === false) {
            setError("Cet événement ne nécessite pas d'inscription");
            return;
        }

        try {
            setRegistering(true);
            setError(null);

            // Vérifier si c'est un événement mocké
            const isMockEvent = event.id.startsWith('mock-');
            
            if (isMockEvent) {
                // Simuler une inscription pour les événements mockés
                const isFull = event.capacity && event.available_spots !== null && event.available_spots <= 0;
                
                if (isFull) {
                    // Pour l'événement complet, simuler une inscription sur liste d'attente
                    setEvent(prev => {
                        if (!prev) return prev;
                        return {
                            ...prev,
                            myReservation: {
                                id: `reservation-mock-${Date.now()}`,
                                status: 'pending',
                            },
                        };
                    });
                    alert('Vous avez été ajouté à la liste d\'attente pour cet événement. Vous serez notifié si une place se libère.');
                } else {
                    // Inscription normale
                    setEvent(prev => {
                        if (!prev) return prev;
                        return {
                            ...prev,
                            myReservation: {
                                id: `reservation-mock-${Date.now()}`,
                                status: 'confirmed',
                            },
                            current_registrations: (prev.current_registrations || 0) + 1,
                            available_spots: prev.capacity
                                ? (prev.available_spots !== null ? Math.max(0, prev.available_spots - 1) : prev.capacity - 1)
                                : null,
                        };
                    });
                    alert('Votre inscription à cet événement a été confirmée. Vous recevrez un email de confirmation sous peu.');
                }
                return;
            }

            // Sinon, faire un vrai appel API
            if (!organisationId) {
                setError("Organisation non configurée. Impossible de s'inscrire.");
                return;
            }

            const result = await api.post<{
                message: string;
                reservation: {
                    id: string;
                    status: 'confirmed' | 'pending';
                };
            }>(`/organisations/${organisationId}/events/${eventId}/register`);

            setEvent(prev => {
                if (!prev) return prev;
                const wasPending = result.reservation.status === 'pending';
                return {
                    ...prev,
                    myReservation: result.reservation,
                    current_registrations: wasPending
                        ? (prev.current_registrations || 0)
                        : (prev.current_registrations || 0) + 1,
                    available_spots: prev.capacity
                        ? (wasPending
                            ? (prev.available_spots || prev.capacity)
                            : (prev.available_spots || prev.capacity) - 1)
                        : null,
                };
            });

            alert(result.message);
            await loadEvent();
        } catch (err: any) {
            console.error('Error registering to event:', err);
            const errorMessage = err?.response?.data?.message || err?.message || "Erreur lors de l'inscription";
            setError(errorMessage);
            alert(errorMessage);
        } finally {
            setRegistering(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getRegistrationStatus = (ev: EventWithRegistration) => {
        if (!ev.registration_required) {
            return null;
        }
        if (ev.myReservation) {
            if (ev.myReservation.status === 'confirmed') {
                return { type: 'confirmed' as const, label: 'Inscrit', icon: CheckCircle };
            }
            if (ev.myReservation.status === 'pending') {
                return { type: 'pending' as const, label: 'En attente', icon: Clock3 };
            }
            if (ev.myReservation.status === 'cancelled') {
                return { type: 'cancelled' as const, label: 'Annulé', icon: XCircle };
            }
        }
        return null;
    };

    const canRegister = (ev: EventWithRegistration) => {
        if (!ev.registration_required) return false;
        if (ev.myReservation) return false;
        if (ev.status !== 'published') return false;
        if (ev.capacity && ev.available_spots !== null && ev.available_spots <= 0) {
            return false;
        }
        return true;
    };

    const handleAcceptInvitation = async () => {
        if (!tripInvitation) return;
        
        try {
            setProcessingInvitation(true);
            
            // Simuler l'acceptation de l'invitation
            await new Promise(resolve => setTimeout(resolve, 800));
            
            setTripInvitation(prev => prev ? { ...prev, status: 'accepted' } : null);
            
            // Afficher la modale de confirmation
            setShowAcceptModal(true);
            
            // Recharger les données
            await loadTripInvitation();
        } catch (err) {
            console.error('Error accepting invitation:', err);
            alert('Erreur lors de l\'acceptation de l\'invitation.');
        } finally {
            setProcessingInvitation(false);
        }
    };

    const handleDeclineInvitation = () => {
        if (!tripInvitation) return;
        setShowDeclineConfirmModal(true);
    };

    const confirmDeclineInvitation = async () => {
        if (!tripInvitation) return;
        
        try {
            setProcessingInvitation(true);
            setShowDeclineConfirmModal(false);
            
            // Simuler le refus de l'invitation
            await new Promise(resolve => setTimeout(resolve, 800));
            
            setTripInvitation(prev => prev ? { ...prev, status: 'declined' } : null);
            
            // Recharger les données
            await loadTripInvitation();
        } catch (err) {
            console.error('Error declining invitation:', err);
            alert('Erreur lors du refus de l\'invitation.');
        } finally {
            setProcessingInvitation(false);
        }
    };

    const registrationStatus = event ? getRegistrationStatus(event) : null;
    const StatusIcon = registrationStatus?.icon;

    const subtitle = event
        ? `${event.start_time ? formatDate(event.start_time) : ''}${event.location ? ` • ${event.location}` : ''}`
        : "Détail complet de l'événement du club";

    return (
        <Layout title={event?.title || "Détail de l'événement"} subtitle={subtitle} mode="club">
            <div className="max-w-4xl mx-auto space-y-6">
                <button
                    type="button"
                    onClick={() => navigate('/club/events')}
                    className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Retour aux événements
                </button>

                {error && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-red-800">Erreur</p>
                            <p className="text-sm text-red-600 mt-1">{error}</p>
                        </div>
                    </div>
                )}

                {loading || !event ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                        <p className="mt-2 text-gray-600">Chargement de l'événement...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <article className="lg:col-span-2 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-800/80 overflow-hidden">
                            {event.cover_url && (
                                <div className="h-56 w-full overflow-hidden">
                                    <img
                                        src={event.cover_url}
                                        alt={event.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <div className="p-6 space-y-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                        Événement du club
                                    </span>
                                    {event.event_type && (
                                        <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                                            {event.event_type === 'training'
                                                ? 'Entraînement'
                                                : event.event_type === 'match'
                                                    ? 'Match'
                                                    : event.event_type === 'meeting'
                                                        ? 'Réunion'
                                                        : event.event_type === 'workshop'
                                                            ? 'Atelier'
                                                            : 'Événement'}
                                        </span>
                                    )}
                                </div>

                                {event.description && (
                                    <div>
                                        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                            Description
                                        </h2>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                            {event.description}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </article>

                        <aside className="space-y-4">
                            <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-800/80 p-5 space-y-4 text-sm text-slate-700 dark:text-slate-200">
                                <div className="space-y-3">
                                    {event.start_time && (
                                        <div className="flex items-start gap-3">
                                            <Calendar className="w-4 h-4 mt-0.5 text-slate-500" />
                                            <div>
                                                <p className="text-xs text-slate-500">Date</p>
                                                <p className="font-medium">{formatDate(event.start_time)}</p>
                                            </div>
                                        </div>
                                    )}
                                    {event.start_time && event.end_time && (
                                        <div className="flex items-start gap-3">
                                            <Clock className="w-4 h-4 mt-0.5 text-slate-500" />
                                            <div>
                                                <p className="text-xs text-slate-500">Horaire</p>
                                                <p className="font-medium">
                                                    {formatTime(event.start_time)} - {formatTime(event.end_time)}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {event.location && (
                                        <div className="flex items-start gap-3">
                                            <MapPin className="w-4 h-4 mt-0.5 text-slate-500" />
                                            <div>
                                                <p className="text-xs text-slate-500">Lieu</p>
                                                <p className="font-medium">{event.location}</p>
                                            </div>
                                        </div>
                                    )}
                                    {event.capacity && (
                                        <div className="flex items-start gap-3">
                                            <Users className="w-4 h-4 mt-0.5 text-slate-500" />
                                            <div>
                                                <p className="text-xs text-slate-500">Capacité</p>
                                                <p className="font-medium">
                                                    {event.current_registrations || 0} / {event.capacity} participants
                                                    {event.available_spots !== null && event.available_spots > 0 && (
                                                        <span className="text-emerald-600 ml-1">
                                                            ({event.available_spots} places disponibles)
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {event.price > 0 && (
                                        <div className="flex items-start gap-3">
                                            <Euro className="w-4 h-4 mt-0.5 text-slate-500" />
                                            <div>
                                                <p className="text-xs text-slate-500">Tarif</p>
                                                <p className="font-medium">{event.price.toFixed(2)} €</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {registrationStatus && (
                                    <div
                                        className={`mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium ${
                                            registrationStatus.type === 'confirmed'
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : registrationStatus.type === 'pending'
                                                    ? 'bg-amber-50 text-amber-700'
                                                    : 'bg-slate-50 text-slate-700'
                                        }`}
                                    >
                                        {StatusIcon && <StatusIcon className="w-4 h-4" />}
                                        <span>{registrationStatus.label}</span>
                                    </div>
                                )}
                            </div>

                            {event.registration_required ? (
                                canRegister(event) ? (
                                    <button
                                        type="button"
                                        onClick={handleRegister}
                                        disabled={registering}
                                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {registering ? (
                                            <>
                                                <span className="inline-block h-4 w-4 rounded-full border-b-2 border-white animate-spin" />
                                                <span>Inscription...</span>
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="w-4 h-4" />
                                                <span>Je m'inscris à cet événement</span>
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <div className="text-xs text-slate-500 text-center">
                                        {registrationStatus
                                            ? 'Votre inscription est déjà prise en compte.'
                                            : event.capacity && event.available_spots !== null && event.available_spots <= 0
                                                ? 'Événement complet.'
                                                : event.status !== 'published'
                                                    ? "Les inscriptions ne sont pas ouvertes pour cet événement."
                                                    : "Inscription non disponible."}
                                    </div>
                                )
                            ) : (
                                <div className="text-xs text-slate-500 text-center">
                                    Cet événement ne nécessite pas d'inscription préalable.
                                </div>
                            )}

                            {/* Section Invitation au voyage */}
                            {tripInvitation && tripInvitation.status === 'pending' && (
                                <div className="rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-200 dark:border-indigo-800 p-5">
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                                            Invitation au voyage
                                        </h3>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                                                <span className="font-medium text-slate-900 dark:text-white">
                                                    {tripInvitation.invitedBy.firstName} {tripInvitation.invitedBy.lastName}
                                                </span>
                                                {' vous invite à participer au voyage organisé pour cet événement.'}
                                            </p>
                                            
                                            {/* Détails du voyage */}
                                            <div className="rounded-xl bg-white/80 dark:bg-slate-800/80 p-3 mb-4">
                                                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                    Détails du voyage :
                                                </p>
                                                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <Plane className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                                        <span className="text-xs text-slate-600 dark:text-slate-400">{tripInvitation.tripSummary.transports} transport(s)</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Users className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                                        <span className="text-xs text-slate-600 dark:text-slate-400">{tripInvitation.tripSummary.invitedMembers} participant(s)</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                                        <span className="text-xs text-slate-600 dark:text-slate-400">{tripInvitation.tripSummary.accommodations} logement(s)</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Euro className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                                        <span className="text-xs text-slate-600 dark:text-slate-400">{tripInvitation.tripSummary.restaurants} restaurant(s)</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Boutons d'action */}
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={handleAcceptInvitation}
                                                    disabled={processingInvitation}
                                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                                    size="sm"
                                                >
                                                    {processingInvitation ? (
                                                        <>
                                                            <span className="inline-block h-3 w-3 rounded-full border-b-2 border-white animate-spin mr-2" />
                                                            Acceptation...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Check className="w-4 h-4 mr-2" />
                                                            Accepter
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    onClick={handleDeclineInvitation}
                                                    disabled={processingInvitation}
                                                    variant="outline"
                                                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    size="sm"
                                                >
                                                    {processingInvitation ? (
                                                        <>
                                                            <span className="inline-block h-3 w-3 rounded-full border-b-2 border-red-600 animate-spin mr-2" />
                                                            Refus...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <X className="w-4 h-4 mr-2" />
                                                            Refuser
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                    </div>
                                </div>
                            )}

                            {tripInvitation && tripInvitation.status === 'accepted' && (
                                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                                        <span className="text-emerald-800 dark:text-emerald-200 font-medium">
                                            Vous participez au voyage organisé par {tripInvitation.invitedBy.firstName} {tripInvitation.invitedBy.lastName}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {tripInvitation && tripInvitation.status === 'declined' && (
                                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <XCircle className="w-4 h-4 text-slate-500" />
                                        <span className="text-slate-600 dark:text-slate-400">
                                            Vous avez refusé l'invitation au voyage
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Link
                                    to={`/club/events/${eventId}/create-trip`}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-indigo-500 hover:to-purple-500 transition-colors"
                                >
                                    <Plane className="w-4 h-4" />
                                    Créer un voyage
                                </Link>
                                {tripInvitation && tripInvitation.status === 'accepted' && (
                                    <Link
                                        to={`/club/events/${eventId}/trip`}
                                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <Users className="w-4 h-4" />
                                        Voir le voyage
                                    </Link>
                                )}
                                {!tripInvitation && (
                                    <Link
                                        to={`/club/events/${eventId}/trip`}
                                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <Users className="w-4 h-4" />
                                        Voir le voyage organisé
                                    </Link>
                                )}
                            </div>

                            <div className="text-xs text-slate-400 text-center">
                                Connecté en tant que {user?.email ?? 'membre'}.
                            </div>
                        </aside>
                    </div>
                )}

                {/* Modale de confirmation d'acceptation */}
                {showAcceptModal && tripInvitation && (
                    <div 
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-200"
                        style={{ animation: 'fadeIn 0.2s ease-out' }}
                        onClick={() => setShowAcceptModal(false)}
                    >
                        <style>{`
                            @keyframes fadeIn {
                                from { opacity: 0; }
                                to { opacity: 1; }
                            }
                            @keyframes slideUp {
                                from { 
                                    opacity: 0;
                                    transform: translateY(20px) scale(0.95);
                                }
                                to { 
                                    opacity: 1;
                                    transform: translateY(0) scale(1);
                                }
                            }
                        `}</style>
                        <div 
                            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full mx-4 p-6 relative overflow-hidden"
                            style={{ animation: 'slideUp 0.3s ease-out' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Effets de fond animés */}
                            <div className="absolute -top-16 -right-10 h-32 w-32 rounded-full bg-emerald-100 dark:bg-emerald-900/30 opacity-40 blur-2xl animate-pulse" />
                            <div className="absolute -bottom-20 -left-10 h-32 w-32 rounded-full bg-indigo-100 dark:bg-indigo-900/30 opacity-50 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />

                            <div className="relative">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="relative inline-flex">
                                        <span className="absolute inline-flex h-12 w-12 rounded-full bg-emerald-200 dark:bg-emerald-800 opacity-75 animate-ping" />
                                        <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 dark:bg-emerald-500 text-white text-lg font-semibold shadow-lg">
                                            <Check className="w-6 h-6" />
                                        </span>
                                    </div>
                                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                                        Invitation acceptée !
                                    </h2>
                                </div>

                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                    Vous participez maintenant au voyage organisé par{' '}
                                    <span className="font-medium text-slate-900 dark:text-white">
                                        {tripInvitation.invitedBy.firstName} {tripInvitation.invitedBy.lastName}
                                    </span>
                                    {' pour cet événement.'}
                                </p>

                                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 mb-4">
                                    <p className="text-xs font-medium text-emerald-900 dark:text-emerald-200 mb-2">
                                        Détails du voyage :
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                                        <div className="flex items-center gap-1.5">
                                            <Plane className="w-3.5 h-3.5" />
                                            <span>{tripInvitation.tripSummary.transports} transport(s)</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5" />
                                            <span>{tripInvitation.tripSummary.invitedMembers} participant(s)</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span>{tripInvitation.tripSummary.accommodations} logement(s)</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Euro className="w-3.5 h-3.5" />
                                            <span>{tripInvitation.tripSummary.restaurants} restaurant(s)</span>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                                    Vous pouvez maintenant consulter les détails du voyage et vous organiser avec les autres participants.
                                </p>

                                <div className="flex justify-end gap-3">
                                    <Link
                                        to={`/club/events/${eventId}/trip`}
                                        className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                                        onClick={() => setShowAcceptModal(false)}
                                    >
                                        Voir le voyage
                                    </Link>
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                        onClick={() => setShowAcceptModal(false)}
                                    >
                                        Fermer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modale de confirmation de refus */}
                {showDeclineConfirmModal && tripInvitation && (
                    <div 
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                        style={{ animation: 'fadeIn 0.2s ease-out' }}
                        onClick={() => setShowDeclineConfirmModal(false)}
                    >
                        <div 
                            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full mx-4 p-6 relative overflow-hidden"
                            style={{ animation: 'slideUp 0.3s ease-out' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Effets de fond animés */}
                            <div className="absolute -top-16 -right-10 h-32 w-32 rounded-full bg-red-100 dark:bg-red-900/30 opacity-40 blur-2xl animate-pulse" />
                            <div className="absolute -bottom-20 -left-10 h-32 w-32 rounded-full bg-amber-100 dark:bg-amber-900/30 opacity-50 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />

                            <div className="relative">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="relative inline-flex">
                                        <span className="absolute inline-flex h-12 w-12 rounded-full bg-red-200 dark:bg-red-800 opacity-75 animate-ping" />
                                        <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-600 dark:bg-red-500 text-white text-lg font-semibold shadow-lg">
                                            <AlertCircle className="w-6 h-6" />
                                        </span>
                                    </div>
                                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                                        Confirmer le refus
                                    </h2>
                                </div>

                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                    Êtes-vous sûr de vouloir refuser l'invitation au voyage organisé par{' '}
                                    <span className="font-medium text-slate-900 dark:text-white">
                                        {tripInvitation.invitedBy.firstName} {tripInvitation.invitedBy.lastName}
                                    </span>
                                    {' ?'}
                                </p>

                                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 mb-4">
                                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Vous perdrez l'accès à :
                                    </p>
                                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                                        <li className="flex items-center gap-2">
                                            <span className="text-red-500">•</span>
                                            <span>Les options de transport organisées</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="text-red-500">•</span>
                                            <span>Les logements partagés</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="text-red-500">•</span>
                                            <span>La coordination avec les autres participants</span>
                                        </li>
                                    </ul>
                                </div>

                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                                    Cette action ne peut pas être annulée. Vous devrez être réinvité pour rejoindre le voyage.
                                </p>

                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                        onClick={() => setShowDeclineConfirmModal(false)}
                                        disabled={processingInvitation}
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={confirmDeclineInvitation}
                                        disabled={processingInvitation}
                                    >
                                        {processingInvitation ? (
                                            <>
                                                <span className="inline-block h-3 w-3 rounded-full border-b-2 border-white animate-spin mr-2" />
                                                Refus en cours...
                                            </>
                                        ) : (
                                            <>
                                                <X className="w-4 h-4 inline mr-2" />
                                                Oui, refuser
                                            </>
                                        )}
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

export default EventDetailPage;


