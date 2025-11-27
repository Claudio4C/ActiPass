import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plane, Car, Train, Bus, Hotel, Home, UtensilsCrossed, Calendar, MapPin, Euro, Users, Check, X, UserPlus, Search, UserMinus, UserCheck, Plus, Trash2 } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';

type Member = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
};

type TransportGroup = {
    id: string;
    name: string;
    members: string[]; // IDs des membres
    transportType: string;
    transportId: string; // ID du transport associé
};

type AccommodationGroup = {
    id: string;
    name: string;
    members: string[]; // IDs des membres
    accommodationType: string;
    accommodationId: string; // ID du logement associé
};

type Transport = {
    id: string;
    type: 'covoiturage' | 'train' | 'bus' | 'avion' | 'voiture';
    departure: string;
    departureDate: string;
    departureTime: string;
    return: string;
    returnDate: string;
    returnTime: string;
    price: string;
    seats: string;
    notes: string;
};

type Accommodation = {
    id: string;
    type: 'hotel' | 'gite' | 'auberge' | 'camping';
    name: string;
    address: string;
    nights: string;
    price: string;
    rooms: string;
    notes: string;
};

type Restaurant = {
    id: string;
    name: string;
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    price: string;
    notes: string;
};

// Membres mockés du club pour les invitations
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

const CreateTripPage: React.FC = () => {
    const { eventId } = useParams<{ eventId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Gestion des membres et invitations
    const [invitedMembers, setInvitedMembers] = useState<Set<string>>(new Set());
    const [searchMember, setSearchMember] = useState('');
    const [showMemberSearch, setShowMemberSearch] = useState(false);
    
    // Groupes transport (un par transport)
    const [transportGroups, setTransportGroups] = useState<TransportGroup[]>([]);
    const [creatingGroupForTransport, setCreatingGroupForTransport] = useState<string | null>(null);
    const [newTransportGroupName, setNewTransportGroupName] = useState('');
    const [selectedMembersForTransport, setSelectedMembersForTransport] = useState<Set<string>>(new Set());
    
    // Groupes logement (un par logement)
    const [accommodationGroups, setAccommodationGroups] = useState<AccommodationGroup[]>([]);
    const [creatingGroupForAccommodation, setCreatingGroupForAccommodation] = useState<string | null>(null);
    const [newAccommodationGroupName, setNewAccommodationGroupName] = useState('');
    const [selectedMembersForAccommodation, setSelectedMembersForAccommodation] = useState<Set<string>>(new Set());

    // Transports (plusieurs sections possibles)
    const [transports, setTransports] = useState<Transport[]>([]);

    // Logements (plusieurs sections possibles)
    const [accommodations, setAccommodations] = useState<Accommodation[]>([]);

    // Restaurants (plusieurs sections possibles)
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

    useEffect(() => {
        // Simuler le chargement de l'événement
        // En production, tu chargerais depuis l'API
        const mockEvent = {
            id: eventId || 'mock-3',
            title: 'Déplacement compétition régionale',
            location: 'Gymnase Gerland, 353 avenue Jean Jaurès, 69007 Lyon',
            start_time: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
            end_time: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
        };
        setEvent(mockEvent);
        setLoading(false);
    }, [eventId]);

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

    // Membres filtrés pour la recherche
    const filteredMembers = useMemo(() => {
        if (!searchMember.trim()) return mockMembers;
        const searchLower = searchMember.toLowerCase();
        return mockMembers.filter(
            m =>
                m.firstName.toLowerCase().includes(searchLower) ||
                m.lastName.toLowerCase().includes(searchLower) ||
                m.email.toLowerCase().includes(searchLower)
        );
    }, [searchMember]);

    // Membres disponibles (non invités)
    const availableMembers = useMemo(() => {
        return filteredMembers.filter(m => !invitedMembers.has(m.id));
    }, [filteredMembers, invitedMembers]);

    // Fonction pour inviter un membre
    const handleInviteMember = (memberId: string) => {
        setInvitedMembers(prev => new Set(prev).add(memberId));
        setSearchMember('');
    };

    // Fonction pour retirer un membre
    const handleRemoveInvitedMember = (memberId: string) => {
        setInvitedMembers(prev => {
            const next = new Set(prev);
            next.delete(memberId);
            return next;
        });
        // Retirer aussi des groupes s'il y est
        setTransportGroups(prev => prev.map(g => ({
            ...g,
            members: g.members.filter(id => id !== memberId)
        })).filter(g => g.members.length > 0));
        setAccommodationGroups(prev => prev.map(g => ({
            ...g,
            members: g.members.filter(id => id !== memberId)
        })).filter(g => g.members.length > 0));
    };

    // Créer un groupe de transport pour un transport spécifique
    const handleCreateTransportGroup = (transportId: string) => {
        if (!newTransportGroupName.trim() || selectedMembersForTransport.size === 0 || !transportId) return;
        
        const transport = transports.find(t => t.id === transportId);
        if (!transport) return;
        
        const newGroup: TransportGroup = {
            id: `transport-group-${Date.now()}`,
            name: newTransportGroupName.trim(),
            members: Array.from(selectedMembersForTransport),
            transportType: transport.type,
            transportId: transportId,
        };
        
        setTransportGroups(prev => [...prev, newGroup]);
        setNewTransportGroupName('');
        setSelectedMembersForTransport(new Set());
        setCreatingGroupForTransport(null);
    };

    // Créer un groupe de logement pour un logement spécifique
    const handleCreateAccommodationGroup = (accommodationId: string) => {
        if (!newAccommodationGroupName.trim() || selectedMembersForAccommodation.size === 0 || !accommodationId) return;
        
        const accommodation = accommodations.find(a => a.id === accommodationId);
        if (!accommodation) return;
        
        const newGroup: AccommodationGroup = {
            id: `accommodation-group-${Date.now()}`,
            name: newAccommodationGroupName.trim(),
            members: Array.from(selectedMembersForAccommodation),
            accommodationType: accommodation.type,
            accommodationId: accommodationId,
        };
        
        setAccommodationGroups(prev => [...prev, newGroup]);
        setNewAccommodationGroupName('');
        setSelectedMembersForAccommodation(new Set());
        setCreatingGroupForAccommodation(null);
    };

    // Fonctions pour gérer les transports
    const addTransport = () => {
        const newTransport: Transport = {
            id: `transport-${Date.now()}`,
            type: 'covoiturage',
            departure: '',
            departureDate: '',
            departureTime: '',
            return: '',
            returnDate: '',
            returnTime: '',
            price: '',
            seats: '',
            notes: '',
        };
        setTransports(prev => [...prev, newTransport]);
    };

    const removeTransport = (id: string) => {
        setTransports(prev => prev.filter(t => t.id !== id));
        // Supprimer aussi les groupes associés
        setTransportGroups(prev => prev.filter(g => g.transportId !== id));
    };

    const updateTransport = (id: string, updates: Partial<Transport>) => {
        setTransports(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    // Fonctions pour gérer les logements
    const addAccommodation = () => {
        const newAccommodation: Accommodation = {
            id: `accommodation-${Date.now()}`,
            type: 'hotel',
            name: '',
            address: '',
            nights: '1',
            price: '',
            rooms: '1',
            notes: '',
        };
        setAccommodations(prev => [...prev, newAccommodation]);
    };

    const removeAccommodation = (id: string) => {
        setAccommodations(prev => prev.filter(a => a.id !== id));
        // Supprimer aussi les groupes associés
        setAccommodationGroups(prev => prev.filter(g => g.accommodationId !== id));
    };

    const updateAccommodation = (id: string, updates: Partial<Accommodation>) => {
        setAccommodations(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    };

    // Fonctions pour gérer les restaurants
    const addRestaurant = () => {
        const newRestaurant: Restaurant = {
            id: `restaurant-${Date.now()}`,
            name: '',
            breakfast: false,
            lunch: false,
            dinner: false,
            price: '',
            notes: '',
        };
        setRestaurants(prev => [...prev, newRestaurant]);
    };

    const removeRestaurant = (id: string) => {
        setRestaurants(prev => prev.filter(r => r.id !== id));
    };

    const updateRestaurant = (id: string, updates: Partial<Restaurant>) => {
        setRestaurants(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    };

    // Retirer un groupe
    const handleRemoveTransportGroup = (groupId: string) => {
        setTransportGroups(prev => prev.filter(g => g.id !== groupId));
    };

    const handleRemoveAccommodationGroup = (groupId: string) => {
        setAccommodationGroups(prev => prev.filter(g => g.id !== groupId));
    };

    // Obtenir le nom complet d'un membre
    const getMemberName = (memberId: string) => {
        const member = mockMembers.find(m => m.id === memberId);
        return member ? `${member.firstName} ${member.lastName}` : 'Membre inconnu';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        // Préparer les données du voyage
        const tripData = {
            eventId,
            transports: transports.map(t => ({
                ...t,
                groups: transportGroups.filter(g => g.transportId === t.id),
            })),
            accommodations: accommodations.map(a => ({
                ...a,
                groups: accommodationGroups.filter(g => g.accommodationId === a.id),
            })),
            restaurants,
            invitedMembers: Array.from(invitedMembers),
        };

        console.log('Données du voyage:', tripData);

        // Simuler l'enregistrement
        await new Promise(resolve => setTimeout(resolve, 1500));

        const summaryInfo = [];
        summaryInfo.push(`${invitedMembers.size} membre(s) invité(s)`);
        if (transports.length > 0) {
            summaryInfo.push(`${transports.length} option(s) de transport`);
        }
        if (accommodations.length > 0) {
            summaryInfo.push(`${accommodations.length} option(s) de logement`);
        }
        if (restaurants.length > 0) {
            summaryInfo.push(`${restaurants.length} option(s) de restauration`);
        }
        if (transportGroups.length > 0) {
            summaryInfo.push(`${transportGroups.length} groupe(s) de transport`);
        }
        if (accommodationGroups.length > 0) {
            summaryInfo.push(`${accommodationGroups.length} groupe(s) de logement`);
        }

        const message = `Voyage créé avec succès !\n\n` +
            summaryInfo.map(info => `- ${info}`).join('\n') +
            `\n\nLes participants recevront une notification et pourront consulter les options de transport, logement et restauration.`;

        alert(message);
        navigate(`/club/events/${eventId}/trip`);
    };

    const transportIcons = {
        covoiturage: Car,
        train: Train,
        bus: Bus,
        avion: Plane,
        voiture: Car,
    };

    if (loading) {
        return (
            <Layout title="Créer un voyage" subtitle="Organisez le transport, le logement et la restauration pour cet événement" mode="club">
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    <p className="mt-2 text-gray-600">Chargement...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Créer un voyage" subtitle={`Organiser le transport, logement et restauration pour : ${event?.title || 'Cet événement'}`} mode="club">
            <div className="max-w-4xl mx-auto space-y-6">
                <Link
                    to={`/club/events/${eventId}`}
                    className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Retour à l'événement
                </Link>

                <div className="rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-2">{event?.title}</h2>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {event?.start_time ? formatDate(event.start_time) : ''}
                        </span>
                        <span className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {event?.location || 'Lieu à définir'}
                        </span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Section Invitations et regroupements */}
                    <section className="rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-800/80 p-6 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Inviter des membres</h2>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Invitez des membres du club et organisez-vous en groupes pour partager transport et logement</p>
                            </div>
                        </div>

                        {/* Recherche et invitation de membres */}
                        <div className="space-y-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchMember}
                                    onChange={(e) => {
                                        setSearchMember(e.target.value);
                                        setShowMemberSearch(e.target.value.trim().length > 0);
                                    }}
                                    onFocus={() => setShowMemberSearch(true)}
                                    placeholder="Rechercher un membre par nom ou email..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            {/* Liste des membres disponibles */}
                            {showMemberSearch && availableMembers.length > 0 && (
                                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
                                    {availableMembers.map(member => (
                                        <button
                                            key={member.id}
                                            type="button"
                                            onClick={() => handleInviteMember(member.id)}
                                            className="w-full px-4 py-3 text-left hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors flex items-center justify-between border-b border-slate-100 dark:border-slate-700 last:border-0"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                    {member.firstName} {member.lastName}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{member.email}</p>
                                            </div>
                                            <UserPlus className="w-5 h-5 text-indigo-600" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Membres invités */}
                            {invitedMembers.size > 0 && (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Membres invités ({invitedMembers.size})
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {Array.from(invitedMembers).map(memberId => {
                                            const member = mockMembers.find(m => m.id === memberId);
                                            if (!member) return null;
                                            return (
                                                <div
                                                    key={memberId}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800"
                                                >
                                                    <span className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                                                        {member.firstName} {member.lastName}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveInvitedMember(memberId)}
                                                        className="text-indigo-600 dark:text-indigo-400 hover:text-red-600 transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                    </section>

                    {/* Section Transport */}
                    <section className="rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-800/80 p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <Car className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Transport</h2>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Organisez le déplacement vers l'événement (optionnel)</p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                onClick={addTransport}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Ajouter un transport
                            </Button>
                        </div>

                        {transports.length === 0 && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 italic text-center py-4">
                                Aucun transport ajouté. Cliquez sur "Ajouter un transport" pour commencer.
                            </p>
                        )}

                        {transports.map((transport, index) => {
                            const TransportIcon = transportIcons[transport.type] || Car;
                            return (
                                <div key={transport.id} className="border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6 space-y-4 bg-blue-50/50 dark:bg-blue-900/10">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <TransportIcon className="w-5 h-5 text-blue-600" />
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                                Transport {index + 1}
                                            </h3>
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={() => removeTransport(transport.id)}
                                            variant="outline"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700 hover:border-red-600"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Supprimer
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Type de transport
                                            </label>
                                            <select
                                                value={transport.type}
                                                onChange={(e) => updateTransport(transport.id, { type: e.target.value as any })}
                                                className="w-full rounded-xl border border-slate-300 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="covoiturage">Covoiturage</option>
                                                <option value="train">Train</option>
                                                <option value="bus">Bus / Autocar</option>
                                                <option value="avion">Avion</option>
                                                <option value="voiture">Voiture individuelle</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Prix par personne (€)
                                            </label>
                                            <input
                                                type="number"
                                                value={transport.price}
                                                onChange={(e) => updateTransport(transport.id, { price: e.target.value })}
                                                placeholder="0.00"
                                                min="0"
                                                step="0.01"
                                                className="w-full rounded-xl border border-slate-300 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Lieu de départ
                                            </label>
                                            <input
                                                type="text"
                                                value={transport.departure}
                                                onChange={(e) => updateTransport(transport.id, { departure: e.target.value })}
                                                placeholder="Adresse ou lieu de rendez-vous"
                                                className="w-full rounded-xl border border-slate-300 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Date et heure de départ
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input
                                                    type="date"
                                                    value={transport.departureDate}
                                                    onChange={(e) => updateTransport(transport.id, { departureDate: e.target.value })}
                                                    className="w-full rounded-xl border border-slate-300 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                                <input
                                                    type="time"
                                                    value={transport.departureTime}
                                                    onChange={(e) => updateTransport(transport.id, { departureTime: e.target.value })}
                                                    className="w-full rounded-xl border border-slate-300 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Lieu de retour
                                            </label>
                                            <input
                                                type="text"
                                                value={transport.return}
                                                onChange={(e) => updateTransport(transport.id, { return: e.target.value })}
                                                placeholder="Même lieu ou différent"
                                                className="w-full rounded-xl border border-slate-300 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Date et heure de retour
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input
                                                    type="date"
                                                    value={transport.returnDate}
                                                    onChange={(e) => updateTransport(transport.id, { returnDate: e.target.value })}
                                                    className="w-full rounded-xl border border-slate-300 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                                <input
                                                    type="time"
                                                    value={transport.returnTime}
                                                    onChange={(e) => updateTransport(transport.id, { returnTime: e.target.value })}
                                                    className="w-full rounded-xl border border-slate-300 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {transport.type === 'covoiturage' && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Nombre de places disponibles
                                            </label>
                                            <input
                                                type="number"
                                                value={transport.seats}
                                                onChange={(e) => updateTransport(transport.id, { seats: e.target.value })}
                                                placeholder="Ex: 4"
                                                min="1"
                                                className="w-full rounded-xl border border-slate-300 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Notes complémentaires
                                        </label>
                                        <textarea
                                            value={transport.notes}
                                            onChange={(e) => updateTransport(transport.id, { notes: e.target.value })}
                                            placeholder="Informations supplémentaires sur le transport (ex: prévoir pass navigo, tickets à réserver à l'avance...)"
                                            rows={3}
                                            className="w-full rounded-xl border border-slate-300 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    {/* Groupes pour ce transport */}
                                    {invitedMembers.size > 0 && (
                                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-blue-600" />
                                                    Groupes pour ce transport
                                                </h4>
                                                {creatingGroupForTransport !== transport.id && (
                                                    <Button
                                                        type="button"
                                                        onClick={() => {
                                                            setCreatingGroupForTransport(transport.id);
                                                            setNewTransportGroupName('');
                                                            setSelectedMembersForTransport(new Set());
                                                        }}
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                        Ajouter un groupe
                                                    </Button>
                                                )}
                                            </div>

                                            {/* Afficher les groupes existants pour ce transport */}
                                            {transportGroups.filter(g => g.transportId === transport.id).length > 0 && (
                                                <div className="space-y-2">
                                                    {transportGroups.filter(g => g.transportId === transport.id).map(group => (
                                                        <div
                                                            key={group.id}
                                                            className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 p-3"
                                                        >
                                                            <div className="flex items-center justify-between mb-2">
                                                                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                                                                    {group.name}
                                                                </p>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveTransportGroup(group.id)}
                                                                    className="text-red-600 hover:text-red-700"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {group.members.map(memberId => (
                                                                    <span
                                                                        key={memberId}
                                                                        className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-800 text-xs font-medium text-blue-900 dark:text-blue-100"
                                                                    >
                                                                        {getMemberName(memberId)}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Formulaire de création de groupe */}
                                            {creatingGroupForTransport === transport.id && (
                                                <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20 p-4 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm font-medium text-slate-900 dark:text-white">Créer un groupe</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setCreatingGroupForTransport(null);
                                                                setNewTransportGroupName('');
                                                                setSelectedMembersForTransport(new Set());
                                                            }}
                                                            className="text-slate-600 hover:text-slate-900"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={newTransportGroupName}
                                                        onChange={(e) => setNewTransportGroupName(e.target.value)}
                                                        placeholder="Nom du groupe (ex: Covoiturage équipe 1, Vol Paris-Lyon)"
                                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500"
                                                    />
                                                    <div className="flex flex-wrap gap-2">
                                                        {Array.from(invitedMembers).map(memberId => {
                                                            const member = mockMembers.find(m => m.id === memberId);
                                                            if (!member) return null;
                                                            const isSelected = selectedMembersForTransport.has(memberId);
                                                            // Vérifier si le membre est déjà dans un autre groupe de transport
                                                            const alreadyInTransportGroup = transportGroups.some(g => 
                                                                g.transportId !== transport.id && g.members.includes(memberId)
                                                            );
                                                            return (
                                                                <button
                                                                    key={memberId}
                                                                    type="button"
                                                                    disabled={alreadyInTransportGroup}
                                                                    onClick={() => {
                                                                        setSelectedMembersForTransport(prev => {
                                                                            const next = new Set(prev);
                                                                            if (isSelected) {
                                                                                next.delete(memberId);
                                                                            } else {
                                                                                next.add(memberId);
                                                                            }
                                                                            return next;
                                                                        });
                                                                    }}
                                                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                                                        alreadyInTransportGroup
                                                                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                                            : isSelected
                                                                            ? 'bg-blue-600 text-white'
                                                                            : 'bg-white dark:bg-slate-900 border border-slate-300 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                                                                    }`}
                                                                    title={alreadyInTransportGroup ? 'Déjà dans un autre groupe de transport' : ''}
                                                                >
                                                                    {member.firstName} {member.lastName}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                    {newTransportGroupName.trim() && selectedMembersForTransport.size > 0 && (
                                                        <div className="flex gap-2">
                                                            <Button
                                                                type="button"
                                                                onClick={() => handleCreateTransportGroup(transport.id)}
                                                                size="sm"
                                                                className="flex-1"
                                                            >
                                                                Créer le groupe
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                onClick={() => {
                                                                    setCreatingGroupForTransport(null);
                                                                    setNewTransportGroupName('');
                                                                    setSelectedMembersForTransport(new Set());
                                                                }}
                                                                variant="outline"
                                                                size="sm"
                                                            >
                                                                Annuler
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </section>

                    {/* Section Logement */}
                    <section className="rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-800/80 p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                    <Hotel className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Logement</h2>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Proposez des options d'hébergement (optionnel)</p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                onClick={addAccommodation}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Ajouter un logement
                            </Button>
                        </div>

                        {accommodations.length === 0 && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 italic text-center py-4">
                                Aucun logement ajouté. Cliquez sur "Ajouter un logement" pour commencer.
                            </p>
                        )}

                        {accommodations.map((accommodation, index) => (
                            <div key={accommodation.id} className="border-2 border-purple-200 dark:border-purple-800 rounded-xl p-6 space-y-4 bg-purple-50/50 dark:bg-purple-900/10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <Hotel className="w-5 h-5 text-purple-600" />
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                            Logement {index + 1}
                                        </h3>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={() => removeAccommodation(accommodation.id)}
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700 hover:border-red-600"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Supprimer
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Type de logement
                                        </label>
                                        <select
                                            value={accommodation.type}
                                            onChange={(e) => updateAccommodation(accommodation.id, { type: e.target.value as any })}
                                            className="w-full rounded-xl border border-slate-300 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        >
                                            <option value="hotel">Hôtel</option>
                                            <option value="gite">Gîte / Location</option>
                                            <option value="auberge">Auberge de jeunesse</option>
                                            <option value="camping">Camping</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Nombre de nuits
                                        </label>
                                        <input
                                            type="number"
                                            value={accommodation.nights}
                                            onChange={(e) => updateAccommodation(accommodation.id, { nights: e.target.value })}
                                            min="1"
                                            className="w-full rounded-xl border border-slate-300 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Nom de l'établissement
                                    </label>
                                    <input
                                        type="text"
                                        value={accommodation.name}
                                        onChange={(e) => updateAccommodation(accommodation.id, { name: e.target.value })}
                                        placeholder="Ex: Hôtel Central"
                                        className="w-full rounded-xl border border-slate-300 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Adresse
                                    </label>
                                    <input
                                        type="text"
                                        value={accommodation.address}
                                        onChange={(e) => updateAccommodation(accommodation.id, { address: e.target.value })}
                                        placeholder="Adresse complète"
                                        className="w-full rounded-xl border border-slate-300 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Prix par nuit (€)
                                        </label>
                                        <input
                                            type="number"
                                            value={accommodation.price}
                                            onChange={(e) => updateAccommodation(accommodation.id, { price: e.target.value })}
                                            placeholder="0.00"
                                            min="0"
                                            step="0.01"
                                            className="w-full rounded-xl border border-slate-300 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Nombre de chambres disponibles
                                        </label>
                                        <input
                                            type="number"
                                            value={accommodation.rooms}
                                            onChange={(e) => updateAccommodation(accommodation.id, { rooms: e.target.value })}
                                            min="1"
                                            className="w-full rounded-xl border border-slate-300 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Notes complémentaires
                                    </label>
                                    <textarea
                                        value={accommodation.notes}
                                        onChange={(e) => updateAccommodation(accommodation.id, { notes: e.target.value })}
                                        placeholder="Informations supplémentaires (ex: petit-déjeuner inclus, wifi gratuit, parking...)"
                                        rows={3}
                                        className="w-full rounded-xl border border-slate-300 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>

                                {/* Groupes pour ce logement */}
                                {invitedMembers.size > 0 && (
                                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                                <Users className="w-4 h-4 text-purple-600" />
                                                Groupes pour ce logement
                                            </h4>
                                            {creatingGroupForAccommodation !== accommodation.id && (
                                                <Button
                                                    type="button"
                                                    onClick={() => {
                                                        setCreatingGroupForAccommodation(accommodation.id);
                                                        setNewAccommodationGroupName('');
                                                        setSelectedMembersForAccommodation(new Set());
                                                    }}
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex items-center gap-2"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    Ajouter un groupe
                                                </Button>
                                            )}
                                        </div>

                                        {/* Afficher les groupes existants pour ce logement */}
                                        {accommodationGroups.filter(g => g.accommodationId === accommodation.id).length > 0 && (
                                            <div className="space-y-2">
                                                {accommodationGroups.filter(g => g.accommodationId === accommodation.id).map(group => (
                                                    <div
                                                        key={group.id}
                                                        className="rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/30 p-3"
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                                                                {group.name}
                                                            </p>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveAccommodationGroup(group.id)}
                                                                className="text-red-600 hover:text-red-700"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {group.members.map(memberId => (
                                                                <span
                                                                    key={memberId}
                                                                    className="px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-800 text-xs font-medium text-purple-900 dark:text-purple-100"
                                                                >
                                                                    {getMemberName(memberId)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Formulaire de création de groupe */}
                                        {creatingGroupForAccommodation === accommodation.id && (
                                            <div className="rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/20 p-4 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white">Créer un groupe</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setCreatingGroupForAccommodation(null);
                                                            setNewAccommodationGroupName('');
                                                            setSelectedMembersForAccommodation(new Set());
                                                        }}
                                                        className="text-slate-600 hover:text-slate-900"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={newAccommodationGroupName}
                                                    onChange={(e) => setNewAccommodationGroupName(e.target.value)}
                                                    placeholder="Nom du groupe (ex: Chambre 1, Appartement équipe)"
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500"
                                                />
                                                <div className="flex flex-wrap gap-2">
                                                    {Array.from(invitedMembers).map(memberId => {
                                                        const member = mockMembers.find(m => m.id === memberId);
                                                        if (!member) return null;
                                                        const isSelected = selectedMembersForAccommodation.has(memberId);
                                                        // Vérifier si le membre est déjà dans un autre groupe de logement
                                                        const alreadyInAccommodationGroup = accommodationGroups.some(g => 
                                                            g.accommodationId !== accommodation.id && g.members.includes(memberId)
                                                        );
                                                        return (
                                                            <button
                                                                key={memberId}
                                                                type="button"
                                                                disabled={alreadyInAccommodationGroup}
                                                                onClick={() => {
                                                                    setSelectedMembersForAccommodation(prev => {
                                                                        const next = new Set(prev);
                                                                        if (isSelected) {
                                                                            next.delete(memberId);
                                                                        } else {
                                                                            next.add(memberId);
                                                                        }
                                                                        return next;
                                                                    });
                                                                }}
                                                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                                                    alreadyInAccommodationGroup
                                                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                                        : isSelected
                                                                        ? 'bg-purple-600 text-white'
                                                                        : 'bg-white dark:bg-slate-900 border border-slate-300 text-slate-700 dark:text-slate-300 hover:border-purple-400'
                                                                }`}
                                                                title={alreadyInAccommodationGroup ? 'Déjà dans un autre groupe de logement' : ''}
                                                            >
                                                                {member.firstName} {member.lastName}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                {newAccommodationGroupName.trim() && selectedMembersForAccommodation.size > 0 && (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            type="button"
                                                            onClick={() => handleCreateAccommodationGroup(accommodation.id)}
                                                            size="sm"
                                                            className="flex-1 bg-purple-600 hover:bg-purple-700"
                                                        >
                                                            Créer le groupe
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            onClick={() => {
                                                                setCreatingGroupForAccommodation(null);
                                                                setNewAccommodationGroupName('');
                                                                setSelectedMembersForAccommodation(new Set());
                                                            }}
                                                            variant="outline"
                                                            size="sm"
                                                        >
                                                            Annuler
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </section>

                    {/* Section Restauration */}
                    <section className="rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-800/80 p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <UtensilsCrossed className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Restauration</h2>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Organisez les repas pendant l'événement (optionnel)</p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                onClick={addRestaurant}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Ajouter un restaurant
                            </Button>
                        </div>

                        {restaurants.length === 0 && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 italic text-center py-4">
                                Aucun restaurant ajouté. Cliquez sur "Ajouter un restaurant" pour commencer.
                            </p>
                        )}

                        {restaurants.map((restaurant, index) => (
                            <div key={restaurant.id} className="border-2 border-emerald-200 dark:border-emerald-800 rounded-xl p-6 space-y-4 bg-emerald-50/50 dark:bg-emerald-900/10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <UtensilsCrossed className="w-5 h-5 text-emerald-600" />
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                            Restaurant {index + 1}
                                        </h3>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={() => removeRestaurant(restaurant.id)}
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700 hover:border-red-600"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Supprimer
                                    </Button>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Nom du restaurant / lieu
                                    </label>
                                    <input
                                        type="text"
                                        value={restaurant.name}
                                        onChange={(e) => updateRestaurant(restaurant.id, { name: e.target.value })}
                                        placeholder="Ex: Restaurant Le Central"
                                        className="w-full rounded-xl border border-slate-300 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Repas proposés :</p>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={restaurant.breakfast}
                                            onChange={(e) => updateRestaurant(restaurant.id, { breakfast: e.target.checked })}
                                            className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500"
                                        />
                                        <label className="text-sm text-slate-700 dark:text-slate-300">
                                            Petit-déjeuner
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={restaurant.lunch}
                                            onChange={(e) => updateRestaurant(restaurant.id, { lunch: e.target.checked })}
                                            className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500"
                                        />
                                        <label className="text-sm text-slate-700 dark:text-slate-300">
                                            Déjeuner
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={restaurant.dinner}
                                            onChange={(e) => updateRestaurant(restaurant.id, { dinner: e.target.checked })}
                                            className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500"
                                        />
                                        <label className="text-sm text-slate-700 dark:text-slate-300">
                                            Dîner
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Prix par repas (€)
                                    </label>
                                    <input
                                        type="number"
                                        value={restaurant.price}
                                        onChange={(e) => updateRestaurant(restaurant.id, { price: e.target.value })}
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        className="w-full rounded-xl border border-slate-300 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Notes complémentaires
                                    </label>
                                    <textarea
                                        value={restaurant.notes}
                                        onChange={(e) => updateRestaurant(restaurant.id, { notes: e.target.value })}
                                        placeholder="Informations sur les repas (ex: menu, allergies, réservation nécessaire...)"
                                        rows={3}
                                        className="w-full rounded-xl border border-slate-300 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                            </div>
                        ))}
                    </section>

                    {/* Boutons d'action */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6 border-t border-slate-200 dark:border-slate-700">
                        <Link to={`/club/events/${eventId}`}>
                            <Button variant="outline" type="button" className="w-full sm:w-auto">
                                Annuler
                            </Button>
                        </Link>
                        <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                            {saving ? (
                                <>
                                    <span className="inline-block h-4 w-4 rounded-full border-b-2 border-white animate-spin mr-2" />
                                    Création en cours...
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4 mr-2" />
                                    Créer le voyage
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default CreateTripPage;

