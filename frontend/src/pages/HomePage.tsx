import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Users, Calendar, MessageSquare, Award,
    Bell, Clock, ArrowRight, MapPin, Activity,
    Settings, BarChart3, Building2, UserPlus,
    BadgeCheck, ChevronLeft, ChevronRight
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';

const unsplash = (w: number, h: number, query: string, seed: string | number) =>
    `https://source.unsplash.com/random/${w}x${h}/?${encodeURIComponent(query)}&sig=${seed}`;

// Données mockées - à remplacer par des appels API
const mockOrganizations = [
    {
        id: 'org-1',
        name: 'Gracie Nova',
        role: 'membre',
        type: 'club',
        stats: { members: 156, events: 12, messages: 3 },
        nextEvent: { title: 'Entraînement Jiu-jitsu', date: 'Aujourd\'hui 18:00' },
        coverQuery: 'brazilian jiu jitsu training lifestyle studio',
        highlight: 'Spécialité no-gi et compétiteurs nationaux',
        location: 'Paris 11e'
    },
    {
        id: 'org-2',
        name: 'Grappling Lyon',
        role: 'coach',
        type: 'association',
        stats: { slots: 9, privateLessons: 4, requests: 3 },
        nextEvent: { title: 'Cours collectif', date: 'Demain 19:30' },
        coverQuery: 'coach training session gym',
        highlight: 'Planning privé rempli à 70 %',
        location: 'Lyon Croix-Rousse'
    },
    {
        id: 'org-3',
        name: 'No-Gi Academy',
        role: 'gestionnaire',
        type: 'club',
        stats: { pendingMemberships: 7, attendance: '82%', alerts: 2 },
        nextEvent: { title: 'Réunion équipe', date: 'Vendredi 14:00' },
        coverQuery: 'modern gym interior dark mood',
        highlight: '82 % de taux de présence cette semaine',
        location: 'Marseille Prado'
    }
];

const recentActivities = [
    {
        id: 'act-1',
        title: 'Nouvelle demande d’adhésion',
        description: 'Emma Lefèvre a demandé à rejoindre Gracie Nova',
        time: 'Il y a 12 min',
        context: 'Adhésion',
        status: 'En attente'
    },
    {
        id: 'act-2',
        title: 'Créneau privé confirmé',
        description: 'Cours particulier “Competition prep” confirmé avec Nathan',
        time: 'Il y a 1 h',
        context: 'Planning coach',
        status: 'Confirmé'
    },
    {
        id: 'act-3',
        title: 'Feedback laissé',
        description: 'Mention “Excellent accueil !” sur No-Gi Academy',
        time: 'Il y a 3 h',
        context: 'Avis',
        status: 'Publié'
    }
];

type EmptyStateAction = {
    id: string;
    title: string;
    description: string;
    ctaLabel: string;
    to: string;
    icon: LucideIcon;
    accent: string;
    badge?: string;
};

const emptyStateActions: EmptyStateAction[] = [
    {
        id: 'create-organisation',
        title: 'Créer une organisation',
        description: 'Déclarez votre association ou votre club pour activer toutes les fonctionnalités IKIVIO.',
        ctaLabel: 'Créer mon espace',
        to: '/accounts?intent=create-organisation',
        icon: Building2,
        accent: 'bg-indigo-50 text-indigo-600'
    },
    {
        id: 'join-organisation',
        title: 'Rejoindre une organisation',
        description: "Recevez un lien d'invitation ou envoyez une demande d'accès à votre club existant.",
        ctaLabel: 'Rejoindre un club',
        to: '/accounts?intent=join-organisation',
        icon: UserPlus,
        accent: 'bg-emerald-50 text-emerald-600'
    },
    {
        id: 'coach-independant',
        title: 'Créer mon profil coach',
        description: 'Créez un studio indépendant pour vendre vos créneaux privés et gérer vos clients.',
        ctaLabel: 'Lancer mon studio',
        to: '/coach/profile?mode=independant',
        icon: BadgeCheck,
        accent: 'bg-pink-50 text-pink-600',
        badge: 'Freelance'
    },
    {
        id: 'discover-clubs',
        title: 'Découvrir des clubs proches',
        description: 'Parcourez les clubs et associations partenaires pour trouver de nouvelles salles où vous entraîner.',
        ctaLabel: 'Explorer les clubs',
        to: '/discover',
        icon: MapPin,
        accent: 'bg-sky-50 text-sky-600'
    },
    {
        id: 'browse-coaches',
        title: 'Trouver un coach indépendant',
        description: 'Accédez aux profils coachs pour organiser des cours privés ou des ateliers dans votre club.',
        ctaLabel: 'Voir les coachs',
        to: '/coach/independants/demo',
        icon: Activity,
        accent: 'bg-amber-50 text-amber-600',
        badge: 'Nouveau'
    },
    {
        id: 'setup-notifications',
        title: 'Configurer mes notifications',
        description: 'Choisissez comment vous souhaitez être prévenu des nouvelles demandes, inscriptions et paiements.',
        ctaLabel: 'Ajuster les alertes',
        to: '/club/notifications',
        icon: Bell,
        accent: 'bg-slate-50 text-slate-700'
    }
];

type ScheduleSlot = {
    id: string;
    organisationId: string;
    organisationName: string;
    day: string;
    time: string;
    discipline: string;
    coach: string;
    location: string;
};

const allScheduleSlots: ScheduleSlot[] = [
    { id: 'slot-1', organisationId: 'org-1', organisationName: 'Gracie Nova', day: 'Lundi', time: '07:30', discipline: 'Conditioning No-Gi', coach: 'Hamza', location: 'Studio Croix-Rousse' },
    { id: 'slot-2', organisationId: 'org-1', organisationName: 'Gracie Nova', day: 'Lundi', time: '19:30', discipline: 'Jiu-jitsu brésilien', coach: 'Willy', location: 'COSEC Marcel Pagnol' },
    { id: 'slot-3', organisationId: 'org-2', organisationName: 'Grappling Lyon', day: 'Lundi', time: '12:30', discipline: 'Luta Livre', coach: 'Youssef', location: 'COSEC Marcel Pagnol' },
    { id: 'slot-4', organisationId: 'org-2', organisationName: 'Grappling Lyon', day: 'Mardi', time: '18:30', discipline: 'Jiu-jitsu brésilien', coach: 'Fabrice', location: 'Dojo Villeurbanne' },
    { id: 'slot-5', organisationId: 'org-1', organisationName: 'Gracie Nova', day: 'Mardi', time: '08:00', discipline: 'Drills compétition', coach: 'Hamza', location: 'Studio Croix-Rousse' },
    { id: 'slot-6', organisationId: 'org-3', organisationName: 'No-Gi Academy', day: 'Mercredi', time: '07:00', discipline: 'Mobilité & récupération', coach: 'Willy', location: 'Studio Croix-Rousse' },
    { id: 'slot-7', organisationId: 'org-2', organisationName: 'Grappling Lyon', day: 'Mercredi', time: '20:00', discipline: 'No-Gi Grappling', coach: 'Youssef', location: 'COSEC Marcel Pagnol' },
    { id: 'slot-8', organisationId: 'org-1', organisationName: 'Gracie Nova', day: 'Jeudi', time: '19:45', discipline: 'Sparring compétition', coach: 'Hamza', location: 'Dojo Villeurbanne' },
    { id: 'slot-9', organisationId: 'org-3', organisationName: 'No-Gi Academy', day: 'Jeudi', time: '12:15', discipline: 'Judo', coach: 'Youssef', location: 'COSEC Marcel Pagnol' },
    { id: 'slot-10', organisationId: 'org-1', organisationName: 'Gracie Nova', day: 'Vendredi', time: '18:00', discipline: 'Jiu-jitsu brésilien', coach: 'Willy', location: 'COSEC Marcel Pagnol' },
    { id: 'slot-11', organisationId: 'org-3', organisationName: 'No-Gi Academy', day: 'Vendredi', time: '20:30', discipline: 'Open mat libre', coach: 'Collectif', location: 'Studio Croix-Rousse' },
    { id: 'slot-12', organisationId: 'org-2', organisationName: 'Grappling Lyon', day: 'Samedi', time: '10:30', discipline: 'Stage technique', coach: 'Invité', location: 'COSEC Marcel Pagnol' },
    { id: 'slot-13', organisationId: 'org-1', organisationName: 'Gracie Nova', day: 'Dimanche', time: '11:00', discipline: 'Préparation physique', coach: 'Hamza', location: 'Studio Croix-Rousse' },
];

const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

// Fonction utilitaire pour mettre la première lettre en majuscule
const capitalizeFirst = (str: string): string => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
};

const HomePage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
    const [hasActiveOrganisation, setHasActiveOrganisation] = useState(() => {
        if (typeof window === 'undefined') return false;
        return Boolean(window.localStorage.getItem('selectedOrganisation'));
    });
    const [activeOrganisationData, setActiveOrganisationData] = useState<(typeof mockOrganizations)[0] | null>(() => {
        if (typeof window === 'undefined') return null;
        try {
            const raw = window.localStorage.getItem('selectedOrganisation');
            if (!raw) return null;
            const parsed = JSON.parse(raw) as { id?: string } | null;
            if (!parsed?.id) return null;
            return mockOrganizations.find((org) => org.id === parsed.id) ?? null;
        } catch {
            return null;
        }
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleOrganisationUpdate = () => {
            const raw = window.localStorage.getItem('selectedOrganisation');
            setHasActiveOrganisation(Boolean(raw));
            if (!raw) {
                setActiveOrganisationData(null);
                return;
            }
            try {
                const parsed = JSON.parse(raw) as { id?: string } | null;
                if (!parsed?.id) {
                    setActiveOrganisationData(null);
                    return;
                }
                const matchingOrg = mockOrganizations.find((org) => org.id === parsed.id) ?? null;
                setActiveOrganisationData(matchingOrg);
            } catch (error) {
                console.error('Impossible de parser selectedOrganisation', error);
                setActiveOrganisationData(null);
            }
        };

        handleOrganisationUpdate();
        window.addEventListener('organisation:updated', handleOrganisationUpdate);
        window.addEventListener('storage', handleOrganisationUpdate);
        return () => {
            window.removeEventListener('organisation:updated', handleOrganisationUpdate);
            window.removeEventListener('storage', handleOrganisationUpdate);
        };
    }, []);

    // Calcul des statistiques globales
    const globalStats = useMemo(() => {
        const totalOrgs = mockOrganizations.length;
        const totalMessages = mockOrganizations.reduce((sum, org) => sum + (org.stats.messages || 0), 0);
        const totalEvents = mockOrganizations.reduce((sum, org) => sum + (org.stats.events || 0), 0);
        const coachOrgs = mockOrganizations.filter(org => org.role === 'coach').length;
        
        return {
            totalOrgs,
            totalMessages,
            totalEvents,
            coachOrgs
        };
    }, []);

    const handleSelectOrganization = (orgId: string) => {
        const org = mockOrganizations.find(o => o.id === orgId);
        if (!org) return;
        setSelectedOrg(orgId);
        
        // Simuler la sélection d'organisation
        const orgData = {
            id: org.id,
            name: org.name,
            role: org.role,
            type: org.type
        };
        
        localStorage.setItem('selectedOrganisation', JSON.stringify(orgData));
        window.dispatchEvent(new Event('organisation:updated'));
        
        // Rediriger vers l'espace approprié
        setHasActiveOrganisation(true);
        setActiveOrganisationData(org);
        navigate('/club/members');
    };

    const handleActionNavigate = (path: string) => {
        navigate(path);
    };

    return (
        <Layout
            title="Tableau de bord"
            subtitle="Vue d'ensemble de tous vos espaces et activités"
            mode="club"
        >
            <div className="space-y-8">
                {/* Hero Section */}
                <section className="relative rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white p-8 sm:p-12 overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://source.unsplash.com/random/1920x1080/?sports,fitness')] opacity-20 bg-cover bg-center" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-black/40 to-transparent" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-sm font-semibold text-white/90 uppercase tracking-wider">
                                {user ? `Bienvenue, ${user.firstName || 'Utilisateur'}` : 'Bienvenue sur IKIVIO'}
                            </span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 drop-shadow-lg">
                            Vos espaces en un coup d'œil
                        </h1>
                        <p className="text-lg text-white/90 max-w-2xl mb-6 drop-shadow">
                            Gérez tous vos clubs, associations et activités depuis un seul endroit. Accédez rapidement à vos informations importantes.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link to="/accounts">
                                <Button
                                    size="md"
                                    className="relative overflow-hidden bg-indigo-50 text-indigo-900 hover:bg-white shadow-lg shadow-black/20 border border-white/60 px-5"
                                >
                                    <span className="absolute inset-0 bg-gradient-to-r from-indigo-100/70 to-white/50 opacity-80 blur-2xl" />
                                    <span className="relative inline-flex items-center">
                                        <Users className="w-4 h-4 mr-2 text-indigo-900" />
                                        Choisir mon profil
                                    </span>
                                </Button>
                            </Link>
                            <Link to="/club/notifications">
                                <Button variant="outline" size="md" className="border-white/30 text-white hover:bg-white/10">
                                    <Bell className="w-4 h-4 mr-2" />
                                    Voir les notifications
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>

                {hasActiveOrganisation && activeOrganisationData ? (
                    <section>
                        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg overflow-hidden flex flex-col lg:flex-row">
                            <div className="relative lg:w-1/3 min-h-[220px]">
                                <img
                                    src={unsplash(600, 400, activeOrganisationData.coverQuery, `cover-${activeOrganisationData.id}`)}
                                    alt={activeOrganisationData.name}
                                    className="absolute inset-0 h-full w-full object-cover"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-black/20 to-transparent" />
                                <div className="relative z-10 p-6 text-white space-y-2">
                                    <p className="text-xs uppercase tracking-[0.3em] text-white/70">
                                        Dernière organisation utilisée
                                    </p>
                                    <h3 className="text-2xl font-bold">{activeOrganisationData.name}</h3>
                                    <p className="text-sm text-white/80 mt-2 flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        {activeOrganisationData.location}
                                    </p>
                                </div>
                            </div>
                            <div className="flex-1 p-6 sm:p-8 grid gap-6">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-[0.2em]">
                                            {activeOrganisationData.role === 'coach' ? 'Espace coach' : 'Espace membre'}
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                                            {activeOrganisationData.highlight}
                                        </p>
                                    </div>
                                    <Link to="/club/members">
                                        <Button className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">
                                            Ouvrir l’espace
                                        </Button>
                                    </Link>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1">
                                            Prochain focus
                                        </p>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            {activeOrganisationData.nextEvent.title}
                                        </p>
                                        <p className="text-xs text-slate-500">{activeOrganisationData.nextEvent.date}</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1">
                                            Interactions
                                        </p>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            {(activeOrganisationData.stats.members ?? activeOrganisationData.stats.slots ?? 0).toString()}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {activeOrganisationData.stats.events
                                                ? `${activeOrganisationData.stats.events} événements cette semaine`
                                                : 'Suivi en temps réel'}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1">
                                            Raccourci
                                        </p>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                                            Notifications récentes
                                        </p>
                                        <Link
                                            to="/club/notifications"
                                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                                        >
                                            Ouvrir &rarr;
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                ) : null}

                {!hasActiveOrganisation ? (
                    <section>
                        <div className="rounded-3xl border border-indigo-200 bg-white shadow-sm px-6 py-5 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-indigo-600 uppercase tracking-[0.2em] mb-1">
                                        Étape suivante
                                    </p>
                                    <h2 className="text-lg font-bold text-slate-900">Sélectionnez un profil pour activer vos accès</h2>
                                    <p className="text-sm text-slate-600">
                                        Choisissez l’un de vos clubs, associations ou comptes coach pour ouvrir l’espace correspondant.
                                    </p>
                                </div>
                                <Link to="/accounts" className="flex-shrink-0">
                                    <Button
                                        size="md"
                                        className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-400 text-white shadow-lg shadow-indigo-500/30 border border-indigo-500/40"
                                    >
                                        <Users className="w-4 h-4 mr-2 text-white" />
                                        Choisir mon profil
                                    </Button>
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {emptyStateActions.map((action) => {
                                    const Icon = action.icon;
                                    return (
                                        <div
                                            key={action.id}
                                            className="rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-colors bg-slate-50/30"
                                        >
                                            <div className="flex items-start gap-3 mb-3">
                                                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${action.accent}`}>
                                                    <Icon className="w-5 h-5" />
                                                </span>
                                                <div>
                                                    {action.badge ? (
                                                        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500 font-semibold">
                                                            {action.badge}
                                                        </p>
                                                    ) : null}
                                                    <h3 className="text-base font-semibold text-slate-900">{action.title}</h3>
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-600 mb-4">{action.description}</p>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="w-full justify-center"
                                                onClick={() => handleActionNavigate(action.to)}
                                                type="button"
                                            >
                                                {action.ctaLabel}
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                ) : null}

                {/* Statistiques globales */}
                <section>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            icon={<Users className="w-5 h-5" />}
                            label="Organisations"
                            value={globalStats.totalOrgs.toString()}
                            subLabel="Comptes actifs"
                            color="indigo"
                        />
                        <StatCard
                            icon={<MessageSquare className="w-5 h-5" />}
                            label="Messages"
                            value={globalStats.totalMessages.toString()}
                            subLabel="Non lus"
                            color="blue"
                        />
                        <StatCard
                            icon={<Calendar className="w-5 h-5" />}
                            label="Événements"
                            value={globalStats.totalEvents.toString()}
                            subLabel="Ce mois"
                            color="purple"
                        />
                        <StatCard
                            icon={<Award className="w-5 h-5" />}
                            label="Rôles coach"
                            value={globalStats.coachOrgs.toString()}
                            subLabel="Espaces actifs"
                            color="emerald"
                        />
                    </div>
                </section>

                {/* Calendrier des créneaux */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Calendrier des créneaux
                            </h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                Tous les créneaux de vos organisations pour la semaine
                            </p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700">
                            {daysOfWeek.map((day) => {
                                const daySlots = allScheduleSlots.filter((slot) => slot.day === day);
                                return (
                                    <div key={day} className="bg-white dark:bg-slate-900">
                                        <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide text-center">
                                                {day.substring(0, 3)}
                                            </p>
                                        </div>
                                        <div className="p-2 space-y-2 min-h-[200px]">
                                            {daySlots.map((slot) => {
                                                const org = mockOrganizations.find((o) => o.id === slot.organisationId);
                                                const orgColor = org?.role === 'coach'
                                                    ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
                                                    : org?.role === 'gestionnaire'
                                                    ? 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800'
                                                    : 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
                                                return (
                                                    <div
                                                        key={slot.id}
                                                        className={`p-2 rounded-lg border text-xs ${orgColor} cursor-pointer hover:shadow-sm transition-shadow`}
                                                        onClick={() => handleSelectOrganization(slot.organisationId)}
                                                    >
                                                        <p className="font-semibold text-slate-900 dark:text-white mb-1">
                                                            {slot.time}
                                                        </p>
                                                        <p className="text-slate-700 dark:text-slate-300 truncate">
                                                            {slot.discipline}
                                                        </p>
                                                        <p className="text-slate-600 dark:text-slate-400 text-[10px] mt-1 truncate">
                                                            {slot.organisationName}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                            {daySlots.length === 0 && (
                                                <p className="text-xs text-slate-400 dark:text-slate-500 text-center pt-4">
                                                    Aucun créneau
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Organisations */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Vos organisations
                            </h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                Sélectionnez un espace pour accéder à ses fonctionnalités
                            </p>
                        </div>
                        <Link to="/accounts">
                            <Button variant="outline" size="sm" mode="club">
                                Voir tout
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {mockOrganizations.map((org) => (
                            <OrganizationCard
                                key={org.id}
                                organization={org}
                                onSelect={() => handleSelectOrganization(org.id)}
                                isSelected={selectedOrg === org.id}
                            />
                        ))}
                    </div>
                </section>

                {/* Actions rapides */}
                <section>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                        Actions rapides
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <QuickActionCard
                            icon={<Calendar className="w-6 h-6" />}
                            title="Mon planning"
                            description="Voir tous vos créneaux"
                            to="/coach/planning"
                            color="blue"
                        />
                        <QuickActionCard
                            icon={<MessageSquare className="w-6 h-6" />}
                            title="Messages"
                            description="Consulter vos conversations"
                            to="/coach/messages"
                            color="indigo"
                        />
                        <QuickActionCard
                            icon={<BarChart3 className="w-6 h-6" />}
                            title="Statistiques"
                            description="Analyser vos performances"
                            to="/club/members"
                            color="purple"
                        />
                        <QuickActionCard
                            icon={<Settings className="w-6 h-6" />}
                            title="Paramètres"
                            description="Gérer votre compte"
                            to="/account/profile"
                            color="slate"
                        />
                    </div>
                </section>

                {/* Prochains événements consolidés */}
                <section>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                        Prochains événements
                    </h2>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="divide-y divide-slate-200 dark:divide-slate-700">
                            {mockOrganizations.map((org) => (
                                <div
                                    key={org.id}
                                    className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                                    onClick={() => handleSelectOrganization(org.id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                    org.role === 'coach'
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                                                        : org.role === 'gestionnaire'
                                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300'
                                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                                                }`}>
                                                    {capitalizeFirst(org.role)}
                                                </span>
                                                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {org.name}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                                                {org.nextEvent.title}
                                            </h3>
                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                <Clock className="w-4 h-4" />
                                                {org.nextEvent.date}
                                            </div>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Activités récentes */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Activités récentes
                            </h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                Les dernières interactions qui vous concernent.
                            </p>
                        </div>
                        <Link to="/club/notifications">
                            <Button variant="outline" size="sm" mode="club">
                                Voir tout
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {recentActivities.map((activity) => (
                            <div
                                key={activity.id}
                                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-[0.2em]">
                                        <Activity className="w-4 h-4" />
                                        {activity.context}
                                    </span>
                                    <span className="text-xs text-slate-500">{activity.time}</span>
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                    {activity.title}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                    {activity.description}
                                </p>
                                <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                                    {activity.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </Layout>
    );
};

// Composant de carte statistique
const StatCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string;
    subLabel: string;
    color: 'indigo' | 'blue' | 'purple' | 'emerald';
}> = ({ icon, label, value, subLabel, color }) => {
    const colorClasses = {
        indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
        purple: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
        emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center`}>
                    {icon}
                </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{value}</div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{label}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{subLabel}</div>
        </div>
    );
};

// Composant de carte d'organisation
const OrganizationCard: React.FC<{
    organization: typeof mockOrganizations[0];
    onSelect: () => void;
    isSelected: boolean;
}> = ({ organization, onSelect, isSelected }) => {
    const getRoleBadgeColor = (role: string) => {
        if (role === 'coach') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300';
        if (role === 'gestionnaire') return 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300';
        return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300';
    };

    return (
        <div
            onClick={onSelect}
            className={`bg-white dark:bg-slate-900 rounded-2xl border-2 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
            }`}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(organization.role)}`}>
                            {capitalizeFirst(organization.role)}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{capitalizeFirst(organization.type)}</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                        {organization.name}
                    </h3>
                </div>
            </div>

            <div className="space-y-3 mb-4">
                {Object.entries(organization.stats).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">{value}</span>
                    </div>
                ))}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">{organization.nextEvent.title}</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {organization.nextEvent.date}
                </div>
            </div>
        </div>
    );
};

// Composant d'action rapide
const QuickActionCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    to: string;
    color: 'blue' | 'indigo' | 'purple' | 'slate';
}> = ({ icon, title, description, to, color }) => {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
        indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
        purple: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
        slate: 'bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400'
    };

    return (
        <Link to={to}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer">
                <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center mb-4`}>
                    {icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
            </div>
        </Link>
    );
};

export default HomePage;

