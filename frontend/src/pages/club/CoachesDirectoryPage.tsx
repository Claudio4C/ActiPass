import React, { useState } from 'react';
import { Search, MapPin, Star, DollarSign, Calendar, Award, MessageSquare, Filter, X, Users, Video } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';

interface Coach {
    id: string;
    firstName: string;
    lastName: string;
    photo?: string;
    disciplines: string[];
    location: string;
    zoneIntervention: string;
    rating: number;
    totalReviews: number;
    pricing: {
        singleSession: number;
        pack5: number;
        pack10: number;
    };
    qualifications: string[];
    availabilityPublic: boolean;
    isOnline: boolean;
    description: string;
}

const CoachesDirectoryPage: React.FC = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
    const [selectedLocation, setSelectedLocation] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
    const [contactMessage, setContactMessage] = useState('');
    const [contactType, setContactType] = useState<'offer' | 'stage' | 'general'>('offer');

    // Données mockées - à remplacer par des appels API
    const coaches: Coach[] = [
        {
            id: '1',
            firstName: 'Jean',
            lastName: 'Martin',
            disciplines: ['Tennis', 'Badminton'],
            location: 'Paris',
            zoneIntervention: 'Paris et région parisienne',
            rating: 4.8,
            totalReviews: 42,
            pricing: {
                singleSession: 50,
                pack5: 225,
                pack10: 400
            },
            qualifications: ['Diplôme d\'État Tennis', 'Certificat FFT'],
            availabilityPublic: true,
            isOnline: true,
            description: 'Coach de tennis expérimenté avec plus de 10 ans d\'expérience. Spécialisé dans l\'entraînement des jeunes et des adultes.'
        },
        {
            id: '2',
            firstName: 'Marie',
            lastName: 'Dubois',
            disciplines: ['Yoga', 'Pilates'],
            location: 'Lyon',
            zoneIntervention: 'Lyon et environs',
            rating: 4.9,
            totalReviews: 67,
            pricing: {
                singleSession: 45,
                pack5: 200,
                pack10: 360
            },
            qualifications: ['Diplôme de professeur de Yoga', 'Formation Pilates'],
            availabilityPublic: true,
            isOnline: true,
            description: 'Professeure de yoga et pilates certifiée, spécialisée dans le bien-être et la récupération.'
        },
        {
            id: '3',
            firstName: 'Pierre',
            lastName: 'Bernard',
            disciplines: ['Natation'],
            location: 'Marseille',
            zoneIntervention: 'Marseille et côte d\'Azur',
            rating: 4.7,
            totalReviews: 28,
            pricing: {
                singleSession: 55,
                pack5: 250,
                pack10: 450
            },
            qualifications: ['Brevet d\'État natation', 'Sauveteur secouriste'],
            availabilityPublic: false,
            isOnline: false,
            description: 'Maître-nageur expérimenté, spécialisé dans l\'apprentissage de la natation pour tous les âges.'
        }
    ];

    const disciplines = Array.from(new Set(coaches.flatMap(c => c.disciplines)));
    const locations = Array.from(new Set(coaches.map(c => c.location)));

    const filteredCoaches = coaches.filter(coach => {
        const matchesSearch = 
            `${coach.firstName} ${coach.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            coach.disciplines.some(d => d.toLowerCase().includes(searchTerm.toLowerCase())) ||
            coach.location.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesDiscipline = selectedDiscipline === 'all' || coach.disciplines.includes(selectedDiscipline);
        const matchesLocation = selectedLocation === 'all' || coach.location === selectedLocation;

        return matchesSearch && matchesDiscipline && matchesLocation;
    });

    const handleContactCoach = (coach: Coach) => {
        setSelectedCoach(coach);
        setContactMessage('');
        setContactType('offer');
        setShowContactModal(true);
    };

    const handleSendMessage = () => {
        if (!selectedCoach) return;
        
        // TODO: Implémenter l'envoi de message via API
        console.log('Message envoyé à:', selectedCoach.id, {
            type: contactType,
            message: contactMessage
        });
        
        setShowContactModal(false);
        setSelectedCoach(null);
        setContactMessage('');
    };

    const totalCoaches = coaches.length;
    const onlineCoaches = coaches.filter(c => c.isOnline).length;
    const averageRating = coaches.reduce((sum, c) => sum + c.rating, 0) / coaches.length;

    // Fonction pour générer une image de bannière basée sur les disciplines
    const getBannerImage = (disciplines: string[]) => {
        const query = disciplines.join(',').toLowerCase().replace(/\s+/g, '+');
        return `https://source.unsplash.com/random/640x240/?${query},sports,training&sig=${disciplines.join('')}`;
    };

    return (
        <Layout
            title="Annuaire des coachs"
            subtitle="Recherchez et contactez des coachs indépendants pour votre club"
            mode="club"
        >
            <div className="space-y-6">
                {/* Bannière principale style Discord */}
                <div className="relative w-full h-64 sm:h-80 lg:h-96 overflow-hidden rounded-2xl shadow-xl">
                    {/* Image de fond avec gradient */}
                    <div 
                        className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"
                        style={{
                            backgroundImage: 'url(https://source.unsplash.com/random/1920x1080/?fitness,training,sports,coaching)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/70 via-black/40 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
                    
                    {/* Contenu de la bannière */}
                    <div className="relative h-full flex flex-col justify-end p-6 sm:p-8 lg:p-12">
                        <div className="max-w-4xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-4">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-xs font-semibold text-white uppercase tracking-wider">
                                    Annuaire actif
                                </span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-3 drop-shadow-lg">
                                Coachs indépendants
                            </h1>
                            <p className="text-base sm:text-lg text-white/90 max-w-2xl mb-6 drop-shadow">
                                Découvrez des coachs certifiés prêts à rejoindre votre club. Trouvez le talent parfait pour vos équipes.
                            </p>
                            
                            {/* Statistiques */}
                            <div className="flex flex-wrap gap-4 sm:gap-6">
                                <div className="flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/30 backdrop-blur-sm flex items-center justify-center">
                                        <Users className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-white">{totalCoaches}</div>
                                        <div className="text-xs text-white/80 font-medium">Coachs disponibles</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/30 backdrop-blur-sm flex items-center justify-center">
                                        <Video className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-white">{onlineCoaches}</div>
                                        <div className="text-xs text-white/80 font-medium">Cours en ligne</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/30 backdrop-blur-sm flex items-center justify-center">
                                        <Star className="w-5 h-5 text-white fill-white" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-white">{averageRating.toFixed(1)}</div>
                                        <div className="text-xs text-white/80 font-medium">Note moyenne</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Barre de recherche et filtres */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex flex-col gap-4">
                        {/* Recherche */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Rechercher un coach, une discipline ou une ville..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Filtres rapides */}
                        <div className="flex flex-wrap items-center gap-3">
                            <select
                                value={selectedDiscipline}
                                onChange={(e) => setSelectedDiscipline(e.target.value)}
                                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            >
                                <option value="all">Toutes les disciplines</option>
                                {disciplines.map((disc) => (
                                    <option key={disc} value={disc}>{disc}</option>
                                ))}
                            </select>

                            <select
                                value={selectedLocation}
                                onChange={(e) => setSelectedLocation(e.target.value)}
                                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            >
                                <option value="all">Toutes les villes</option>
                                {locations.map((loc) => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>

                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                    showFilters
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                                }`}
                            >
                                <Filter className="w-4 h-4" />
                                Plus de filtres
                            </button>

                            {(selectedDiscipline !== 'all' || selectedLocation !== 'all' || searchTerm) && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedDiscipline('all');
                                        setSelectedLocation('all');
                                    }}
                                    className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    Réinitialiser
                                </button>
                            )}
                        </div>

                        {/* Filtres avancés */}
                        {showFilters && (
                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Note minimum
                                        </label>
                                        <select className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm">
                                            <option value="0">Toutes les notes</option>
                                            <option value="4">4 étoiles et plus</option>
                                            <option value="4.5">4.5 étoiles et plus</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Disponibilités publiques
                                        </label>
                                        <select className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm">
                                            <option value="all">Tous</option>
                                            <option value="yes">Avec calendrier public</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Cours en ligne
                                        </label>
                                        <select className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm">
                                            <option value="all">Tous</option>
                                            <option value="yes">Propose des cours en ligne</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Résultats */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {filteredCoaches.length} coach{filteredCoaches.length > 1 ? 's' : ''} trouvé{filteredCoaches.length > 1 ? 's' : ''}
                        </h2>
                    </div>

                    {filteredCoaches.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                            <p className="text-slate-600 dark:text-slate-400">
                                Aucun coach ne correspond à vos critères de recherche
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {filteredCoaches.map((coach) => (
                                <div
                                    key={coach.id}
                                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-200"
                                >
                                    {/* Bannière de la carte style Discord */}
                                    <div className="relative w-full h-32 sm:h-40 overflow-visible">
                                        <div className="absolute inset-0 overflow-hidden rounded-t-2xl">
                                            <img
                                                src={getBannerImage(coach.disciplines)}
                                                alt={`Bannière ${coach.firstName} ${coach.lastName}`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = `https://picsum.photos/640/240?random=${coach.id}`;
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
                                        </div>
                                        
                                        {/* Avatar positionné sur la bannière */}
                                        <div className="absolute bottom-0 left-6 transform translate-y-1/2 z-10">
                                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white dark:ring-slate-900 shadow-lg">
                                                {coach.firstName.charAt(0)}{coach.lastName.charAt(0)}
                                            </div>
                                        </div>

                                        {/* Badge en ligne sur la bannière */}
                                        {coach.isOnline && (
                                            <div className="absolute top-3 right-3 z-10">
                                                <span className="px-2.5 py-1 bg-emerald-500/90 backdrop-blur-sm text-white rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                    En ligne
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Contenu de la carte */}
                                    <div className="pt-12 pb-6 px-6">
                                        {/* En-tête du profil */}
                                        <div className="mb-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
                                                        {coach.firstName} {coach.lastName}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="flex items-center gap-1">
                                                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                                                {coach.rating}
                                                            </span>
                                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                ({coach.totalReviews} avis)
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                        <MapPin className="w-4 h-4" />
                                                        {coach.location} • {coach.zoneIntervention}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                    {/* Disciplines */}
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {coach.disciplines.map((disc, index) => (
                                            <span
                                                key={index}
                                                className="px-2 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 rounded text-xs font-medium"
                                            >
                                                {disc}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Description */}
                                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 line-clamp-2">
                                        {coach.description}
                                    </p>

                                    {/* Qualifications */}
                                    {coach.qualifications.length > 0 && (
                                        <div className="mb-4">
                                            <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 mb-1">
                                                <Award className="w-3 h-3" />
                                                Qualifications
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {coach.qualifications.slice(0, 2).map((qual, index) => (
                                                    <span
                                                        key={index}
                                                        className="text-xs text-slate-500 dark:text-slate-400"
                                                    >
                                                        {qual}
                                                        {index < coach.qualifications.slice(0, 2).length - 1 && ', '}
                                                    </span>
                                                ))}
                                                {coach.qualifications.length > 2 && (
                                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                                        +{coach.qualifications.length - 2} autre{coach.qualifications.length - 2 > 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Tarifs */}
                                    <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                        <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 mb-2">
                                            <DollarSign className="w-3 h-3" />
                                            Tarifs
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                            <div>
                                                <div className="text-slate-500 dark:text-slate-400">Séance</div>
                                                <div className="font-semibold text-slate-900 dark:text-white">
                                                    {coach.pricing.singleSession}€
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-slate-500 dark:text-slate-400">Pack 5</div>
                                                <div className="font-semibold text-slate-900 dark:text-white">
                                                    {coach.pricing.pack5}€
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-slate-500 dark:text-slate-400">Pack 10</div>
                                                <div className="font-semibold text-slate-900 dark:text-white">
                                                    {coach.pricing.pack10}€
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Disponibilités */}
                                    {coach.availabilityPublic && (
                                        <div className="mb-4 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                                            <Calendar className="w-3 h-3" />
                                            Calendrier de disponibilités public
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <Button
                                            size="sm"
                                            mode="club"
                                            onClick={() => handleContactCoach(coach)}
                                            className="flex-1"
                                        >
                                            <MessageSquare className="w-4 h-4 mr-2" />
                                            Contacter
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            mode="club"
                                        >
                                            Voir le profil
                                        </Button>
                                    </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Modal de contact */}
                {showContactModal && selectedCoach && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowContactModal(false)}>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                                        Contacter {selectedCoach.firstName} {selectedCoach.lastName}
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                        Envoyez un message pour proposer une collaboration
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowContactModal(false)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Type de contact */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Type de demande
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            onClick={() => setContactType('offer')}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                contactType === 'offer'
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                            }`}
                                        >
                                            Offre
                                        </button>
                                        <button
                                            onClick={() => setContactType('stage')}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                contactType === 'stage'
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                            }`}
                                        >
                                            Stage
                                        </button>
                                        <button
                                            onClick={() => setContactType('general')}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                contactType === 'general'
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                            }`}
                                        >
                                            Autre
                                        </button>
                                    </div>
                                </div>

                                {/* Message */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Message <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        rows={6}
                                        value={contactMessage}
                                        onChange={(e) => setContactMessage(e.target.value)}
                                        placeholder={
                                            contactType === 'offer'
                                                ? 'Décrivez votre offre d\'emploi, les horaires, la rémunération proposée...'
                                                : contactType === 'stage'
                                                ? 'Décrivez le stage que vous souhaitez organiser (dates, durée, nombre de participants, rémunération)...'
                                                : 'Votre message...'
                                        }
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                </div>

                                {/* Informations du club */}
                                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                                        Le coach recevra votre message avec les informations de votre club
                                    </p>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                                        {user?.organizationName || 'Votre club'}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowContactModal(false);
                                            setSelectedCoach(null);
                                            setContactMessage('');
                                        }}
                                        mode="club"
                                    >
                                        Annuler
                                    </Button>
                                    <Button
                                        onClick={handleSendMessage}
                                        mode="club"
                                        disabled={!contactMessage.trim()}
                                    >
                                        <MessageSquare className="w-4 h-4 mr-2" />
                                        Envoyer
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default CoachesDirectoryPage;

