import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, Users, Euro, CheckCircle, Clock3, XCircle, AlertCircle, UserPlus, Plane } from 'lucide-react';
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

const EventDetailPage: React.FC = () => {
    const { eventId } = useParams<{ eventId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [organisationId, setOrganisationId] = useState<string | null>(null);
    const [event, setEvent] = useState<EventWithRegistration | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [registering, setRegistering] = useState(false);

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
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [organisationId, eventId]);

    const loadEvent = async () => {
        if (!eventId || !organisationId) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const data = await api.get<EventWithRegistration>(`/organisations/${organisationId}/events/${eventId}`);
            setEvent(data);
        } catch (err) {
            console.error('Error loading event:', err);
            setError("Impossible de charger cet événement. Il n'existe peut-être plus.");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!eventId || !event || !organisationId) return;

        if (event.registration_required === false) {
            setError("Cet événement ne nécessite pas d'inscription");
            return;
        }

        try {
            setRegistering(true);
            setError(null);

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

    const registrationStatus = event ? getRegistrationStatus(event) : null;
    const StatusIcon = registrationStatus?.icon;

    const subtitle = event
        ? `${event.start_time ? formatDate(event.start_time) : ''}${event.location ? ` • ${event.location}` : ''}`
        : "Détail complet de l'événement du club";

    return (
        <>
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

                            <div className="space-y-2">
                                <Link
                                    to={`/club/events/${eventId}/create-trip`}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-indigo-500 hover:to-purple-500 transition-colors"
                                >
                                    <Plane className="w-4 h-4" />
                                    Créer un voyage
                                </Link>
                                <Link
                                    to={`/club/events/${eventId}/trip`}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <Users className="w-4 h-4" />
                                    Voir le voyage organisé
                                </Link>
                            </div>

                            <div className="text-xs text-slate-400 text-center">
                                Connecté en tant que {user?.email ?? 'membre'}.
                            </div>
                        </aside>
                    </div>
                )}
            </div>
        </>
    );
};

export default EventDetailPage;


