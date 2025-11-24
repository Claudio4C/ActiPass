import React, { useState } from 'react';
import { MapPin, Users, Calendar, Search, Send, CheckCircle, Clock, XCircle, Award, MessageSquare } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';

type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

interface ClubOffer {
    id: string;
    name: string;
    location: string;
    description: string;
    disciplines: string[];
    schedule: string;
    compensation: string;
    status?: ApplicationStatus;
    appliedAt?: string;
}

interface StageRequest {
    id: string;
    club: string;
    location: string;
    title: string;
    description: string;
    discipline: string;
    startDate: string;
    endDate: string;
    duration: string;
    compensation: string;
    status: 'pending' | 'accepted' | 'rejected';
    requestedAt: string;
}

const ApplicationsPage: React.FC = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
    const [showStageResponse, setShowStageResponse] = useState(false);
    const [selectedStage, setSelectedStage] = useState<StageRequest | null>(null);
    const [showApplicationModal, setShowApplicationModal] = useState(false);
    const [selectedOffer, setSelectedOffer] = useState<ClubOffer | null>(null);
    const [applicationForm, setApplicationForm] = useState({
        motivation: '',
        proposedRate: '',
        availability: '',
        additionalInfo: ''
    });

    // Demandes de stages
    const stageRequests: StageRequest[] = [
        {
            id: 'stage-1',
            club: 'Club de Tennis Paris',
            location: 'Paris 15ème',
            title: 'Stage de tennis intensif - Vacances de février',
            description: 'Recherche un coach pour animer un stage de tennis intensif d\'une semaine pendant les vacances de février. Groupe de 15 jeunes de 10-14 ans.',
            discipline: 'Tennis',
            startDate: '2025-02-17',
            endDate: '2025-02-21',
            duration: '5 jours',
            compensation: '800€ forfait',
            status: 'pending',
            requestedAt: '2025-01-12'
        },
        {
            id: 'stage-2',
            club: 'Club de Badminton Lyon',
            location: 'Lyon',
            title: 'Stage découverte badminton',
            description: 'Stage découverte pour débutants, 3 jours. Recherche coach expérimenté avec les enfants.',
            discipline: 'Badminton',
            startDate: '2025-03-10',
            endDate: '2025-03-12',
            duration: '3 jours',
            compensation: '450€ forfait',
            status: 'pending',
            requestedAt: '2025-01-08'
        }
    ];

    // Offres disponibles
    const availableOffers: ClubOffer[] = [
        {
            id: '1',
            name: 'Club de Tennis Paris 15',
            location: 'Paris 15ème',
            description: 'Recherche un coach de tennis pour cours collectifs et individuels. Expérience avec les jeunes appréciée.',
            disciplines: ['Tennis'],
            schedule: 'Mardi et Jeudi, 18h-20h',
            compensation: '30€/heure + bonus selon participants'
        },
        {
            id: '2',
            name: 'Club de Badminton Lyon',
            location: 'Lyon 3ème',
            description: 'Club dynamique recherche coach badminton pour adultes et adolescents.',
            disciplines: ['Badminton'],
            schedule: 'Mercredi 14h-16h, Samedi 10h-12h',
            compensation: '35€/heure'
        }
    ];

    // Candidatures envoyées
    const myApplications: ClubOffer[] = [
        {
            id: '3',
            name: 'Club de Tennis Paris 12',
            location: 'Paris 12ème',
            description: 'Recherche un coach de tennis expérimenté.',
            disciplines: ['Tennis'],
            schedule: 'Lundi et Mercredi, 19h-21h',
            compensation: '32€/heure',
            status: 'pending',
            appliedAt: '2025-01-10'
        },
        {
            id: '4',
            name: 'Club de Squash Marseille',
            location: 'Marseille',
            description: 'Recherche coach squash pour tous niveaux.',
            disciplines: ['Squash'],
            schedule: 'Vendredi 17h-19h',
            compensation: '28€/heure',
            status: 'accepted',
            appliedAt: '2025-01-05'
        }
    ];

    const allOffers = [...availableOffers, ...myApplications];
    const filteredOffers = allOffers.filter(offer => {
        const matchesSearch = offer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             offer.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDiscipline = selectedDiscipline === 'all' || offer.disciplines.includes(selectedDiscipline);
        return matchesSearch && matchesDiscipline;
    });

    const disciplines = Array.from(new Set(allOffers.flatMap(o => o.disciplines)));

    const handleApply = (offer: ClubOffer) => {
        setSelectedOffer(offer);
        setApplicationForm({
            motivation: '',
            proposedRate: '',
            availability: '',
            additionalInfo: ''
        });
        setShowApplicationModal(true);
    };

    const handleSubmitApplication = () => {
        if (!selectedOffer) return;
        
        // TODO: Implémenter l'envoi de la candidature via API
        console.log('Candidature envoyée pour:', selectedOffer.id, applicationForm);
        
        // Réinitialiser et fermer
        setShowApplicationModal(false);
        setSelectedOffer(null);
        setApplicationForm({
            motivation: '',
            proposedRate: '',
            availability: '',
            additionalInfo: ''
        });
    };

    return (
        <Layout
            title="Candidatures aux clubs"
            subtitle="Consultez les offres disponibles et postulez aux clubs qui vous intéressent"
            mode="club"
        >
            <div className="space-y-6">
                {/* Filtres de recherche */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Rechercher un club ou une ville..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <select
                            value={selectedDiscipline}
                            onChange={(e) => setSelectedDiscipline(e.target.value)}
                            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">Toutes les disciplines</option>
                            {disciplines.map((disc) => (
                                <option key={disc} value={disc}>{disc}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Mes candidatures */}
                {myApplications.length > 0 && (
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Mes candidatures</h2>
                        <div className="space-y-4">
                            {myApplications.map((application) => (
                                <div
                                    key={application.id}
                                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                                                    {application.name}
                                                </h3>
                                                {application.status === 'pending' && (
                                                    <span className="px-3 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 rounded-full text-xs font-medium flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        En attente
                                                    </span>
                                                )}
                                                {application.status === 'accepted' && (
                                                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-medium flex items-center gap-1">
                                                        <CheckCircle className="w-3 h-3" />
                                                        Acceptée
                                                    </span>
                                                )}
                                                {application.status === 'rejected' && (
                                                    <span className="px-3 py-1 bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300 rounded-full text-xs font-medium flex items-center gap-1">
                                                        <XCircle className="w-3 h-3" />
                                                        Refusée
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3">
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="w-4 h-4" />
                                                    {application.location}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {application.schedule}
                                                </div>
                                            </div>
                                            <p className="text-slate-700 dark:text-slate-300 mb-3">{application.description}</p>
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {application.disciplines.map((disc, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-2 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 rounded text-xs"
                                                    >
                                                        {disc}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="text-sm">
                                                <span className="font-medium text-slate-900 dark:text-white">Rémunération :</span>
                                                <span className="text-slate-600 dark:text-slate-400 ml-2">{application.compensation}</span>
                                            </div>
                                            {application.appliedAt && (
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                                    Candidature envoyée le {application.appliedAt}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Demandes de stages */}
                {stageRequests.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Award className="w-5 h-5 text-amber-500" />
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Demandes de stages</h2>
                            </div>
                            <span className="px-3 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 rounded-full text-xs font-medium">
                                {stageRequests.filter(s => s.status === 'pending').length} nouvelle{stageRequests.filter(s => s.status === 'pending').length > 1 ? 's' : ''}
                            </span>
                        </div>
                        <div className="space-y-4">
                            {stageRequests.map((stage) => (
                                <div
                                    key={stage.id}
                                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                                                    {stage.title}
                                                </h3>
                                                {stage.status === 'pending' && (
                                                    <span className="px-3 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 rounded-full text-xs font-medium flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        En attente de réponse
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3">
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="w-4 h-4" />
                                                    {stage.club} - {stage.location}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {stage.startDate} au {stage.endDate}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Award className="w-4 h-4" />
                                                    {stage.discipline}
                                                </div>
                                            </div>
                                            <p className="text-slate-700 dark:text-slate-300 mb-3">{stage.description}</p>
                                            <div className="flex items-center gap-4 text-sm mb-3">
                                                <div>
                                                    <span className="font-medium text-slate-900 dark:text-white">Durée :</span>
                                                    <span className="text-slate-600 dark:text-slate-400 ml-2">{stage.duration}</span>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-900 dark:text-white">Rémunération :</span>
                                                    <span className="text-slate-600 dark:text-slate-400 ml-2">{stage.compensation}</span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Demande reçue le {stage.requestedAt}
                                            </p>
                                        </div>
                                    </div>
                                    {stage.status === 'pending' && (
                                        <div className="flex items-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                                            <Button
                                                size="sm"
                                                mode="club"
                                                onClick={() => {
                                                    setSelectedStage(stage);
                                                    setShowStageResponse(true);
                                                }}
                                            >
                                                <MessageSquare className="w-4 h-4 mr-2" />
                                                Répondre à la demande
                                            </Button>
                                            <Button variant="outline" size="sm" mode="club">
                                                Voir les détails
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Offres disponibles */}
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Offres disponibles</h2>
                    <div className="space-y-4">
                        {filteredOffers
                            .filter(offer => !myApplications.find(app => app.id === offer.id))
                            .map((offer) => (
                                <div
                                    key={offer.id}
                                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                                {offer.name}
                                            </h3>
                                            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3">
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="w-4 h-4" />
                                                    {offer.location}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {offer.schedule}
                                                </div>
                                            </div>
                                            <p className="text-slate-700 dark:text-slate-300 mb-3">{offer.description}</p>
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {offer.disciplines.map((disc, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-2 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 rounded text-xs"
                                                    >
                                                        {disc}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="text-sm">
                                                <span className="font-medium text-slate-900 dark:text-white">Rémunération :</span>
                                                <span className="text-slate-600 dark:text-slate-400 ml-2">{offer.compensation}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            mode="club"
                                            onClick={() => handleApply(offer)}
                                        >
                                            <Send className="w-4 h-4 mr-2" />
                                            Postuler
                                        </Button>
                                        <Button variant="outline" size="sm" mode="club">
                                            Voir les détails
                                        </Button>
                                    </div>
                                </div>
                            ))}
                    </div>
                    {filteredOffers.filter(offer => !myApplications.find(app => app.id === offer.id)).length === 0 && (
                        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                            Aucune offre disponible pour le moment
                        </div>
                    )}
                </div>

                {/* Modal postuler à une offre */}
                {showApplicationModal && selectedOffer && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowApplicationModal(false)}>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                                        Candidature spontanée
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                        Postuler à l'offre du club
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowApplicationModal(false)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Informations de l'offre */}
                            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                                    {selectedOffer.name}
                                </h4>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3">
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        {selectedOffer.location}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {selectedOffer.schedule}
                                    </div>
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                                    {selectedOffer.description}
                                </p>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {selectedOffer.disciplines.map((disc, index) => (
                                        <span
                                            key={index}
                                            className="px-2 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 rounded text-xs"
                                        >
                                            {disc}
                                        </span>
                                    ))}
                                </div>
                                <div className="text-sm">
                                    <span className="font-medium text-slate-900 dark:text-white">Rémunération proposée :</span>
                                    <span className="text-slate-600 dark:text-slate-400 ml-2">{selectedOffer.compensation}</span>
                                </div>
                            </div>

                            {/* Formulaire de candidature */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Message de motivation <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        rows={5}
                                        value={applicationForm.motivation}
                                        onChange={(e) => setApplicationForm({ ...applicationForm, motivation: e.target.value })}
                                        placeholder="Présentez-vous, expliquez votre motivation et votre expérience en lien avec cette offre..."
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        Minimum 100 caractères
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Tarif proposé (optionnel)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={applicationForm.proposedRate}
                                                onChange={(e) => setApplicationForm({ ...applicationForm, proposedRate: e.target.value })}
                                                placeholder="Ex: 35"
                                                className="w-full px-3 py-2 pr-12 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400 text-sm">
                                                €/heure
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            Si différent de l'offre ({selectedOffer.compensation})
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Vos disponibilités
                                        </label>
                                        <input
                                            type="text"
                                            value={applicationForm.availability}
                                            onChange={(e) => setApplicationForm({ ...applicationForm, availability: e.target.value })}
                                            placeholder="Ex: Mardi et Jeudi 18h-20h"
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Informations complémentaires (optionnel)
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={applicationForm.additionalInfo}
                                        onChange={(e) => setApplicationForm({ ...applicationForm, additionalInfo: e.target.value })}
                                        placeholder="Ajoutez toute information pertinente (expérience spécifique, certifications, etc.)"
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                {/* Documents */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Documents (optionnel)
                                    </label>
                                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                                                <Users className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                                    Glissez vos fichiers ici ou
                                                </p>
                                                <label className="text-sm text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline">
                                                    parcourez
                                                    <input
                                                        type="file"
                                                        multiple
                                                        accept=".pdf,.doc,.docx"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            // TODO: Gérer l'upload des fichiers
                                                            console.log('Fichiers sélectionnés:', e.target.files);
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                CV, diplômes, certificats (PDF, DOC, DOCX - max 5 Mo par fichier)
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Informations importantes */}
                                <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg">
                                    <p className="text-sm text-blue-800 dark:text-blue-200">
                                        <strong>Note :</strong> Votre candidature sera transmise au club. Vous recevrez une notification lorsque le club aura examiné votre candidature. Vous pouvez suivre l'état de vos candidatures dans la section "Mes candidatures".
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowApplicationModal(false);
                                            setSelectedOffer(null);
                                            setApplicationForm({
                                                motivation: '',
                                                proposedRate: '',
                                                availability: '',
                                                additionalInfo: ''
                                            });
                                        }}
                                        mode="club"
                                    >
                                        Annuler
                                    </Button>
                                    <Button
                                        onClick={handleSubmitApplication}
                                        mode="club"
                                        disabled={!applicationForm.motivation || applicationForm.motivation.length < 100}
                                    >
                                        <Send className="w-4 h-4 mr-2" />
                                        Envoyer la candidature
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal répondre à une demande de stage */}
                {showStageResponse && selectedStage && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowStageResponse(false)}>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
                            <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
                                Répondre à la demande de stage
                            </h3>
                            <div className="space-y-4">
                                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                                        {selectedStage.title}
                                    </p>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                        {selectedStage.club} • {selectedStage.startDate} au {selectedStage.endDate}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Votre réponse
                                    </label>
                                    <div className="flex items-center gap-4 mb-3">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="stageResponse"
                                                value="accept"
                                                defaultChecked
                                                className="w-4 h-4 text-emerald-600"
                                            />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">Accepter</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="stageResponse"
                                                value="decline"
                                                className="w-4 h-4 text-red-600"
                                            />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">Décliner</span>
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Message (optionnel)
                                    </label>
                                    <textarea
                                        rows={4}
                                        placeholder="Ajoutez un message pour le club..."
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div className="flex items-center justify-end gap-2 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowStageResponse(false);
                                            setSelectedStage(null);
                                        }}
                                        mode="club"
                                    >
                                        Annuler
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            // TODO: Implémenter l'envoi de réponse
                                            setShowStageResponse(false);
                                            setSelectedStage(null);
                                        }}
                                        mode="club"
                                    >
                                        <Send className="w-4 h-4 mr-2" />
                                        Envoyer la réponse
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

export default ApplicationsPage;

