import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plane, Car, Train, Bus, Hotel, UtensilsCrossed, Calendar, MapPin, Euro, Eye, User, Check } from 'lucide-react';
import Layout from '../../components/layout/Layout';

type Member = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
};

// Données mockées du voyage (en production, tu les chargerais depuis l'API)
const getMockTripData = (eventId?: string) => {
    const futureDate = new Date(Date.now() + 12 * 24 * 60 * 60 * 1000);
    const departureDate = futureDate.toISOString().split('T')[0];
    
    return {
        eventId: eventId || 'mock-3',
        eventTitle: 'Déplacement compétition régionale',
        eventLocation: 'Gymnase Gerland, 353 avenue Jean Jaurès, 69007 Lyon',
        eventDate: futureDate.toISOString(),
        transportGroups: [
            {
                id: 'transport-group-1',
                name: 'Covoiturage équipe 1',
                members: ['member-1', 'member-2', 'member-3'],
                transportType: 'covoiturage',
                departure: 'Dojo Villeurbanne, 42 rue des Arts Martiaux',
                departureDate: departureDate,
                departureTime: '06:30',
                return: 'Dojo Villeurbanne, 42 rue des Arts Martiaux',
                returnDate: departureDate,
                returnTime: '19:00',
                price: '5',
            },
            {
                id: 'transport-group-2',
                name: 'Covoiturage équipe 2',
                members: ['member-4', 'member-5'],
                transportType: 'covoiturage',
                departure: 'Studio Croix-Rousse, 18 rue du Mail',
                departureDate: departureDate,
                departureTime: '07:00',
                return: 'Studio Croix-Rousse, 18 rue du Mail',
                returnDate: departureDate,
                returnTime: '18:30',
                price: '5',
            },
            {
                id: 'transport-group-3',
                name: 'Vol Paris-Lyon',
                members: ['member-6', 'member-7', 'member-8'],
                transportType: 'avion',
                departure: 'Aéroport Charles de Gaulle, Terminal 2E',
                departureDate: departureDate,
                departureTime: '09:15',
                return: 'Aéroport de Lyon-Saint-Exupéry, Terminal 1',
                returnDate: departureDate,
                returnTime: '20:45',
                price: '120',
            },
        ],
        accommodationGroups: [
            {
                id: 'accommodation-group-1',
                name: 'Chambre double 1',
                members: ['member-1', 'member-2'],
                accommodationType: 'hotel',
                accommodationName: 'Hôtel Central',
                accommodationAddress: '12 rue de la Gare, 69007 Lyon',
                nights: '1',
                price: '45',
            },
            {
                id: 'accommodation-group-2',
                name: 'Chambre triple',
                members: ['member-3', 'member-4', 'member-5'],
                accommodationType: 'hotel',
                accommodationName: 'Hôtel Central',
                accommodationAddress: '12 rue de la Gare, 69007 Lyon',
                nights: '1',
                price: '55',
            },
            {
                id: 'accommodation-group-3',
                name: 'Chambre double 2',
                members: ['member-6', 'member-7'],
                accommodationType: 'hotel',
                accommodationName: 'Hôtel Central',
                accommodationAddress: '12 rue de la Gare, 69007 Lyon',
                nights: '1',
                price: '45',
            },
        ],
        meals: {
            included: true,
            breakfast: true,
            lunch: true,
            dinner: true,
            restaurant: 'Restaurant Le Central, 15 avenue de la République',
            price: '25',
            notes: 'Menu du jour ou carte. Pensez à signaler vos allergies lors de la réservation.',
        },
        invitedMembers: ['member-1', 'member-2', 'member-3', 'member-4', 'member-5', 'member-6', 'member-7', 'member-8'],
    };
};

const mockMembers: Member[] = [
    { id: 'member-1', firstName: 'Alexandre', lastName: 'Dubois', email: 'alexandre.dubois@example.com' },
    { id: 'member-2', firstName: 'Sophie', lastName: 'Martin', email: 'sophie.martin@example.com' },
    { id: 'member-3', firstName: 'Thomas', lastName: 'Bernard', email: 'thomas.bernard@example.com' },
    { id: 'member-4', firstName: 'Marie', lastName: 'Petit', email: 'marie.petit@example.com' },
    { id: 'member-5', firstName: 'Julien', lastName: 'Durand', email: 'julien.durand@example.com' },
    { id: 'member-6', firstName: 'Emma', lastName: 'Moreau', email: 'emma.moreau@example.com' },
    { id: 'member-7', firstName: 'Lucas', lastName: 'Simon', email: 'lucas.simon@example.com' },
    { id: 'member-8', firstName: 'Léa', lastName: 'Laurent', email: 'lea.laurent@example.com' },
];

const TripViewPage: React.FC = () => {
    const { eventId } = useParams<{ eventId: string }>();

    const [viewMode, setViewMode] = useState<'overview' | 'personal'>('overview');
    const [tripData, setTripData] = useState(getMockTripData(eventId));
    const [loading, setLoading] = useState(false);
    const [selectedMemberView, setSelectedMemberView] = useState<string>('member-1');

    // Simuler l'utilisateur actuel (en production, tu utiliserais le vrai user)
    // Pour la démo, on peut changer de membre pour voir différentes vues
    const currentUserId = selectedMemberView;

    useEffect(() => {
        // En production, tu chargerais les données du voyage depuis l'API
        // Pour la démo, on utilise directement les données mockées
        setTripData(getMockTripData(eventId));
        setLoading(false);
    }, [eventId]);

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            return date.toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return dateString;
        }
    };

    const getMemberName = (memberId: string) => {
        const member = mockMembers.find(m => m.id === memberId);
        return member ? `${member.firstName} ${member.lastName}` : 'Membre inconnu';
    };

    // Trouver les groupes de l'utilisateur actuel
    const myTransportGroup = tripData.transportGroups.find(g => g.members.includes(currentUserId));
    const myAccommodationGroup = tripData.accommodationGroups.find(g => g.members.includes(currentUserId));

    const transportIcons: Record<string, React.ComponentType<any>> = {
        covoiturage: Car,
        train: Train,
        bus: Bus,
        avion: Plane,
        voiture: Car,
    };

    if (loading) {
        return (
            <Layout title="Vue du voyage" subtitle="Détails du voyage organisé" mode="club">
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    <p className="mt-2 text-gray-600">Chargement...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Vue du voyage" subtitle={`Organisation complète pour : ${tripData.eventTitle}`} mode="club">
            <div className="max-w-6xl mx-auto space-y-6">
                <Link
                    to={`/club/events/${eventId}`}
                    className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Retour à l'événement
                </Link>

                {/* En-tête avec switch vue d'ensemble / vue personnelle */}
                <div className="rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 mb-2">{tripData.eventTitle}</h2>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                                <span className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    {formatDate(tripData.eventDate)}
                                </span>
                                <span className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    {tripData.eventLocation}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setViewMode('overview')}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                                    viewMode === 'overview'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                <Eye className="w-4 h-4" />
                                Vue d'ensemble
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('personal')}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                                    viewMode === 'personal'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-white text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                <User className="w-4 h-4" />
                                Ma vue personnelle
                            </button>
                        </div>
                    </div>
                </div>

                {viewMode === 'overview' ? (
                    /* Vue d'ensemble - Tous les groupes et participants */
                    <div className="space-y-6">
                        {/* Résumé général */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-sm ring-1 ring-slate-200/70 p-4">
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Participants</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{tripData.invitedMembers.length}</p>
                            </div>
                            <div className="rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-sm ring-1 ring-slate-200/70 p-4">
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Groupes transport</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{tripData.transportGroups.length}</p>
                            </div>
                            <div className="rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-sm ring-1 ring-slate-200/70 p-4">
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Groupes logement</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{tripData.accommodationGroups.length}</p>
                            </div>
                        </div>

                        {/* Groupes de transport */}
                        <section className="rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-800/80 p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <Car className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Groupes de transport</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {tripData.transportGroups.map((group) => {
                                    const TransportIcon = transportIcons[group.transportType] || Car;
                                    return (
                                        <div
                                            key={group.id}
                                            className={`rounded-xl border-2 p-4 ${
                                                group.members.includes(currentUserId)
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <TransportIcon className="w-5 h-5 text-blue-600" />
                                                    <p className="font-semibold text-slate-900 dark:text-white">{group.name}</p>
                                                </div>
                                                {group.members.includes(currentUserId) && (
                                                    <span className="text-xs font-medium text-blue-700 bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded-full">
                                                        Mon groupe
                                                    </span>
                                                )}
                                            </div>
                                        {group.departureDate && (
                                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                                                Départ : {group.departureDate.includes('T') ? formatDate(group.departureDate) : new Date(group.departureDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} à {group.departureTime} depuis {group.departure}
                                            </p>
                                        )}
                                            {group.price && (
                                                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                                                    Prix : {group.price}€ par personne
                                                </p>
                                            )}
                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                    Participants ({group.members.length})
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {group.members.map((memberId) => (
                                                        <span
                                                            key={memberId}
                                                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                memberId === currentUserId
                                                                    ? 'bg-blue-600 text-white'
                                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                                            }`}
                                                        >
                                                            {getMemberName(memberId)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Groupes de logement */}
                        <section className="rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-800/80 p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                    <Hotel className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Groupes de logement</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {tripData.accommodationGroups.map((group) => (
                                    <div
                                        key={group.id}
                                        className={`rounded-xl border-2 p-4 ${
                                            group.members.includes(currentUserId)
                                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="font-semibold text-slate-900 dark:text-white">{group.name}</p>
                                            {group.members.includes(currentUserId) && (
                                                <span className="text-xs font-medium text-purple-700 bg-purple-100 dark:bg-purple-900/50 px-2 py-1 rounded-full">
                                                    Mon groupe
                                                </span>
                                            )}
                                        </div>
                                        {group.accommodationName && (
                                            <p className="text-sm text-slate-700 dark:text-slate-300 mb-1">{group.accommodationName}</p>
                                        )}
                                        {group.accommodationAddress && (
                                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{group.accommodationAddress}</p>
                                        )}
                                        <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 mb-3">
                                            {group.nights && <span>{group.nights} nuit(s)</span>}
                                            {group.price && <span>{group.price}€ par nuit</span>}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Participants ({group.members.length})
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {group.members.map((memberId) => (
                                                    <span
                                                        key={memberId}
                                                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            memberId === currentUserId
                                                                ? 'bg-purple-600 text-white'
                                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                                        }`}
                                                    >
                                                        {getMemberName(memberId)}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Restauration */}
                        {tripData.meals.included && (
                            <section className="rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-800/80 p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <UtensilsCrossed className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Restauration</h3>
                                </div>
                                <div className="space-y-2">
                                    {tripData.meals.restaurant && (
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{tripData.meals.restaurant}</p>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                        {tripData.meals.breakfast && (
                                            <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">Petit-déjeuner</span>
                                        )}
                                        {tripData.meals.lunch && (
                                            <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">Déjeuner</span>
                                        )}
                                        {tripData.meals.dinner && (
                                            <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">Dîner</span>
                                        )}
                                    </div>
                                    {tripData.meals.price && (
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Prix : {tripData.meals.price}€ par repas</p>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>
                ) : (
                    /* Vue personnelle - Mon transport, mon logement, mes repas */
                    <div className="space-y-6">
                        <div className="rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 p-4">
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Vous consultez la vue de <span className="font-semibold text-slate-900 dark:text-white">{getMemberName(currentUserId)}</span>
                                </p>
                                <div className="flex items-center gap-2">
                                    <label htmlFor="member-select" className="text-xs text-slate-600 dark:text-slate-400">Voir la vue de :</label>
                                    <select
                                        id="member-select"
                                        value={currentUserId}
                                        onChange={(e) => setSelectedMemberView(e.target.value)}
                                        className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500"
                                    >
                                        {tripData.invitedMembers.map(memberId => (
                                            <option key={memberId} value={memberId}>
                                                {getMemberName(memberId)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Mon transport */}
                        <section className="rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-800/80 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <Car className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Mon transport</h3>
                            </div>
                            {myTransportGroup ? (
                                <div className="space-y-4">
                                    <div className="rounded-xl border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="font-semibold text-slate-900 dark:text-white">{myTransportGroup.name}</p>
                                            <span className="text-xs font-medium text-blue-700 bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded-full">
                                                {myTransportGroup.transportType}
                                            </span>
                                        </div>
                                        {myTransportGroup.departureDate && (
                                            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                                                <p>
                                                    <span className="font-medium">Départ :</span> {myTransportGroup.departureDate.includes('T') ? formatDate(myTransportGroup.departureDate) : new Date(myTransportGroup.departureDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} à {myTransportGroup.departureTime}
                                                </p>
                                                <p>
                                                    <span className="font-medium">Lieu :</span> {myTransportGroup.departure}
                                                </p>
                                                {myTransportGroup.returnDate && (
                                                    <p>
                                                        <span className="font-medium">Retour :</span> {myTransportGroup.returnDate} à {myTransportGroup.returnTime}
                                                    </p>
                                                )}
                                                {myTransportGroup.price && (
                                                    <p>
                                                        <span className="font-medium">Prix :</span> {myTransportGroup.price}€
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Vous voyagez avec ({myTransportGroup.members.length - 1} autre{myTransportGroup.members.length > 2 ? 's' : ''})
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {myTransportGroup.members
                                                .filter((id) => id !== currentUserId)
                                                .map((memberId) => (
                                                    <span
                                                        key={memberId}
                                                        className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium"
                                                    >
                                                        {getMemberName(memberId)}
                                                    </span>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-600 dark:text-slate-400">Aucun transport assigné.</p>
                            )}
                        </section>

                        {/* Mon logement */}
                        <section className="rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-800/80 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                    <Hotel className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Mon logement</h3>
                            </div>
                            {myAccommodationGroup ? (
                                <div className="space-y-4">
                                    <div className="rounded-xl border-2 border-purple-500 bg-purple-50 dark:bg-purple-900/20 p-4">
                                        <p className="font-semibold text-slate-900 dark:text-white mb-3">{myAccommodationGroup.name}</p>
                                        {myAccommodationGroup.accommodationName && (
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                {myAccommodationGroup.accommodationName}
                                            </p>
                                        )}
                                        {myAccommodationGroup.accommodationAddress && (
                                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{myAccommodationGroup.accommodationAddress}</p>
                                        )}
                                        <div className="flex items-center gap-4 text-sm text-slate-700 dark:text-slate-300">
                                            {myAccommodationGroup.nights && <span>{myAccommodationGroup.nights} nuit(s)</span>}
                                            {myAccommodationGroup.price && <span>{myAccommodationGroup.price}€ par nuit</span>}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Vous partagez avec ({myAccommodationGroup.members.length - 1} autre{myAccommodationGroup.members.length > 2 ? 's' : ''})
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {myAccommodationGroup.members
                                                .filter((id) => id !== currentUserId)
                                                .map((memberId) => (
                                                    <span
                                                        key={memberId}
                                                        className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium"
                                                    >
                                                        {getMemberName(memberId)}
                                                    </span>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-600 dark:text-slate-400">Aucun logement assigné.</p>
                            )}
                        </section>

                        {/* Ma restauration */}
                        {tripData.meals.included && (
                            <section className="rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-800/80 p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <UtensilsCrossed className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Ma restauration</h3>
                                </div>
                                <div className="space-y-3">
                                    {tripData.meals.restaurant && (
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{tripData.meals.restaurant}</p>
                                    )}
                                    <div className="space-y-2">
                                        {tripData.meals.breakfast && (
                                            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                <Check className="w-4 h-4 text-emerald-600" />
                                                Petit-déjeuner inclus
                                            </div>
                                        )}
                                        {tripData.meals.lunch && (
                                            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                <Check className="w-4 h-4 text-emerald-600" />
                                                Déjeuner inclus
                                            </div>
                                        )}
                                        {tripData.meals.dinner && (
                                            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                <Check className="w-4 h-4 text-emerald-600" />
                                                Dîner inclus
                                            </div>
                                        )}
                                    </div>
                                    {tripData.meals.price && (
                                        <p className="text-sm text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                                            Prix total : {tripData.meals.price}€ par repas
                                        </p>
                                    )}
                                    {tripData.meals.notes && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 italic pt-2 border-t border-slate-200 dark:border-slate-700">
                                            {tripData.meals.notes}
                                        </p>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* Récapitulatif de mes coûts */}
                        <section className="rounded-2xl bg-gradient-to-r from-slate-50 to-indigo-50 border-2 border-indigo-200 dark:border-indigo-800 p-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Euro className="w-5 h-5 text-indigo-600" />
                                Récapitulatif de mes coûts
                            </h3>
                            <div className="space-y-2">
                                {myTransportGroup && myTransportGroup.price && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-600 dark:text-slate-400">Transport</span>
                                        <span className="font-semibold text-slate-900 dark:text-white">{myTransportGroup.price}€</span>
                                    </div>
                                )}
                                {myAccommodationGroup && myAccommodationGroup.price && myAccommodationGroup.nights && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-600 dark:text-slate-400">
                                            Logement ({myAccommodationGroup.nights} nuit{myAccommodationGroup.nights !== '1' ? 's' : ''})
                                        </span>
                                        <span className="font-semibold text-slate-900 dark:text-white">
                                            {parseFloat(myAccommodationGroup.price) * parseFloat(myAccommodationGroup.nights)}€
                                        </span>
                                    </div>
                                )}
                                {tripData.meals.included && tripData.meals.price && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-600 dark:text-slate-400">
                                            Restauration
                                            {(tripData.meals.breakfast ? 1 : 0) + (tripData.meals.lunch ? 1 : 0) + (tripData.meals.dinner ? 1 : 0) > 1 &&
                                                ` (${
                                                    (tripData.meals.breakfast ? 1 : 0) + (tripData.meals.lunch ? 1 : 0) + (tripData.meals.dinner ? 1 : 0)
                                                } repas)`}
                                        </span>
                                        <span className="font-semibold text-slate-900 dark:text-white">
                                            {parseFloat(tripData.meals.price) *
                                                ((tripData.meals.breakfast ? 1 : 0) + (tripData.meals.lunch ? 1 : 0) + (tripData.meals.dinner ? 1 : 0))}
                                            €
                                        </span>
                                    </div>
                                )}
                                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                    <span className="font-semibold text-slate-900 dark:text-white">Total estimé</span>
                                    <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                                        {(
                                            (myTransportGroup && myTransportGroup.price ? parseFloat(myTransportGroup.price) : 0) +
                                            (myAccommodationGroup && myAccommodationGroup.price && myAccommodationGroup.nights
                                                ? parseFloat(myAccommodationGroup.price) * parseFloat(myAccommodationGroup.nights)
                                                : 0) +
                                            (tripData.meals.included && tripData.meals.price
                                                ? parseFloat(tripData.meals.price) *
                                                  ((tripData.meals.breakfast ? 1 : 0) + (tripData.meals.lunch ? 1 : 0) + (tripData.meals.dinner ? 1 : 0))
                                                : 0)
                                        ).toFixed(2)}
                                        €
                                    </span>
                                </div>
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default TripViewPage;

