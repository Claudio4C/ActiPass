import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Users, Calendar, Award, Bell, ArrowRight,
    MapPin, Settings, BarChart3, Building2,
    UserPlus, BadgeCheck, Shield,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import { api } from '../lib/api';
import type { RoleType } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

type UserOrganisation = {
    id: string;
    name: string;
    roleType: RoleType;
    role: 'membre' | 'coach' | 'gestionnaire' | 'propriétaire' | 'trésorier';
};

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mapRoleToUI = (roleType: RoleType): UserOrganisation['role'] => {
    switch (roleType) {
        case 'club_owner': return 'propriétaire';
        case 'club_manager': return 'gestionnaire';
        case 'treasurer': return 'trésorier';
        case 'coach': return 'coach';
        default: return 'membre';
    }
};

const capitalizeFirst = (str: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : str;

const getRoleBadgeColor = (role: string) => {
    if (role === 'coach') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300';
    if (role === 'gestionnaire' || role === 'propriétaire') return 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300';
    if (role === 'trésorier') return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300';
    return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300';
};

const emptyStateActions: EmptyStateAction[] = [
    {
        id: 'create-organisation',
        title: 'Créer une organisation',
        description: 'Déclarez votre association ou votre club pour activer toutes les fonctionnalités IKIVIO.',
        ctaLabel: 'Créer mon espace',
        to: '/accounts?intent=create-organisation',
        icon: Building2,
        accent: 'bg-indigo-50 text-indigo-600',
    },
    {
        id: 'join-organisation',
        title: 'Rejoindre une organisation',
        description: "Recevez un lien d'invitation ou envoyez une demande d'accès à votre club existant.",
        ctaLabel: 'Rejoindre un club',
        to: '/accounts?intent=join-organisation',
        icon: UserPlus,
        accent: 'bg-emerald-50 text-emerald-600',
    },
    {
        id: 'coach-independant',
        title: 'Créer mon profil coach',
        description: 'Créez un studio indépendant pour vendre vos créneaux privés et gérer vos clients.',
        ctaLabel: 'Lancer mon studio',
        to: '/coach/profile?mode=independant',
        icon: BadgeCheck,
        accent: 'bg-pink-50 text-pink-600',
        badge: 'Freelance',
    },
    {
        id: 'discover-clubs',
        title: 'Découvrir des clubs proches',
        description: 'Parcourez les clubs et associations partenaires pour trouver de nouvelles salles où vous entraîner.',
        ctaLabel: 'Explorer les clubs',
        to: '/discover',
        icon: MapPin,
        accent: 'bg-sky-50 text-sky-600',
    },
];

// ─── Page principale ──────────────────────────────────────────────────────────

const HomePage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [userOrganisations, setUserOrganisations] = useState<UserOrganisation[]>([]);
    const [loadingOrgs, setLoadingOrgs] = useState(true);
    const [hasActiveOrganisation, setHasActiveOrganisation] = useState(() => {
        if (typeof window === 'undefined') return false;
        return Boolean(window.localStorage.getItem('selectedOrganisation'));
    });
    const [activeOrganisationData, setActiveOrganisationData] = useState<{
        id: string;
        role: string;
    } | null>(() => {
        if (typeof window === 'undefined') return null;
        try {
            const raw = window.localStorage.getItem('selectedOrganisation');
            if (!raw) return null;
            const parsed = JSON.parse(raw) as { id?: string; role?: string; roleType?: RoleType } | null;
            if (!parsed?.id) return null;
            return {
                id: parsed.id,
                role: parsed.role || (parsed.roleType ? mapRoleToUI(parsed.roleType) : 'membre'),
            };
        } catch {
            return null;
        }
    });

    // Charger les organisations réelles depuis l'API
    useEffect(() => {
        const loadUserOrganisations = async () => {
            if (!user?.id) {
                setLoadingOrgs(false);
                return;
            }
            try {
                setLoadingOrgs(true);
                const data = await api.get<Array<{
                    organisation: { id: string; name: string; type: 'club' | 'association' | null };
                    role: { id: string; name: string; type: RoleType; level: number };
                }>>('/organisations/my', {}, { useCache: true, cacheTTL: 60000 });

                setUserOrganisations(
                    data.map(item => ({
                        id: item.organisation.id,
                        name: item.organisation.name,
                        roleType: item.role.type,
                        role: mapRoleToUI(item.role.type),
                    }))
                );
            } catch (err) {
                console.error('Error loading user organisations:', err);
                setUserOrganisations([]);
            } finally {
                setLoadingOrgs(false);
            }
        };

        void loadUserOrganisations();
    }, [user?.id]);

    // Écouter les changements d'organisation active
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
                const parsed = JSON.parse(raw) as { id?: string; role?: string; roleType?: RoleType } | null;
                if (!parsed?.id) {
                    setActiveOrganisationData(null);
                    return;
                }
                setActiveOrganisationData({
                    id: parsed.id,
                    role: parsed.role || (parsed.roleType ? mapRoleToUI(parsed.roleType) : 'membre'),
                });
            } catch {
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

    // Dérive depuis les vraies données
    const hasAdminAccess = useMemo(() => {
        const adminRoles: RoleType[] = ['club_owner', 'club_manager', 'coach'];
        return userOrganisations.some(org => adminRoles.includes(org.roleType));
    }, [userOrganisations]);

    const adminOrganisation = useMemo(() => {
        if (activeOrganisationData) {
            const adminRoles = ['gestionnaire', 'propriétaire', 'coach'];
            if (adminRoles.includes(activeOrganisationData.role)) {
                return { id: activeOrganisationData.id };
            }
        }
        const adminRoleTypes: RoleType[] = ['club_owner', 'club_manager', 'coach'];
        const found = userOrganisations.find(org => adminRoleTypes.includes(org.roleType));
        return found ? { id: found.id } : null;
    }, [activeOrganisationData, userOrganisations]);

    const currentActiveOrg = useMemo(
        () => (activeOrganisationData
            ? userOrganisations.find(org => org.id === activeOrganisationData.id) ?? null
            : null),
        [activeOrganisationData, userOrganisations]
    );

    const coachOrgsCount = useMemo(
        () => userOrganisations.filter(o => o.roleType === 'coach').length,
        [userOrganisations]
    );

    const handleSelectOrganisation = (org: UserOrganisation) => {
        const orgData = {
            id: org.id,
            name: org.name,
            role: org.role,
            roleType: org.roleType,
        };
        localStorage.setItem('selectedOrganisation', JSON.stringify(orgData));
        window.dispatchEvent(new Event('organisation:updated'));
        setHasActiveOrganisation(true);
        setActiveOrganisationData({ id: org.id, role: org.role });
        navigate('/club/members');
    };

    return (
        <Layout
            title="Tableau de bord"
            subtitle="Vue d'ensemble de tous vos espaces et activités"
            mode="club"
        >
            <div className="space-y-8">
                {/* Hero */}
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
                            Gérez tous vos clubs, associations et activités depuis un seul endroit.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link to="/accounts">
                                <Button
                                    size="md"
                                    className="relative overflow-hidden bg-indigo-50 text-indigo-900 hover:bg-white shadow-lg shadow-black/20 border border-white/60 px-5"
                                >
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

                {/* Organisation active */}
                {hasActiveOrganisation && currentActiveOrg && (
                    <section>
                        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg overflow-hidden flex flex-col lg:flex-row">
                            <div className="flex-1 p-6 sm:p-8 grid gap-6">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-[0.2em]">
                                            Dernière organisation utilisée
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                                            {currentActiveOrg.name}
                                        </p>
                                        <span className={`inline-flex mt-2 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getRoleBadgeColor(currentActiveOrg.role)}`}>
                                            {capitalizeFirst(currentActiveOrg.role)}
                                        </span>
                                    </div>
                                    <Link to="/club/members">
                                        <Button className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">
                                            Ouvrir l'espace
                                        </Button>
                                    </Link>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1">
                                            Organisations
                                        </p>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            {loadingOrgs ? '…' : userOrganisations.length}
                                        </p>
                                        <p className="text-xs text-slate-500">Total disponibles</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1">
                                            Notifications
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
                )}

                {/* Portail admin */}
                {hasAdminAccess && (
                    <section>
                        <div className="rounded-3xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 shadow-sm px-6 py-5">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-indigo-600 uppercase tracking-[0.2em] mb-1">
                                        Accès administrateur
                                    </p>
                                    <h2 className="text-lg font-bold text-slate-900">Portail Admin</h2>
                                    <p className="text-sm text-slate-600">
                                        Accédez au tableau de bord administrateur pour gérer votre organisation.
                                    </p>
                                </div>
                                {adminOrganisation && (
                                    <Link
                                        to={`/dashboard/${adminOrganisation.id}/overview`}
                                        className="flex-shrink-0"
                                    >
                                        <Button
                                            size="md"
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 border border-indigo-500/40"
                                        >
                                            <Shield className="w-4 h-4 mr-2 text-white" />
                                            Accéder au portail
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                {/* État vide — pas d'org active */}
                {!hasActiveOrganisation && (
                    <section>
                        <div className="rounded-3xl border border-indigo-200 bg-white shadow-sm px-6 py-5 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-indigo-600 uppercase tracking-[0.2em] mb-1">
                                        Étape suivante
                                    </p>
                                    <h2 className="text-lg font-bold text-slate-900">
                                        Sélectionnez un profil pour activer vos accès
                                    </h2>
                                    <p className="text-sm text-slate-600">
                                        Choisissez l'un de vos clubs, associations ou comptes coach pour ouvrir l'espace correspondant.
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {emptyStateActions.map(action => {
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
                                                    {action.badge && (
                                                        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500 font-semibold">
                                                            {action.badge}
                                                        </p>
                                                    )}
                                                    <h3 className="text-base font-semibold text-slate-900">{action.title}</h3>
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-600 mb-4">{action.description}</p>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="w-full justify-center"
                                                onClick={() => navigate(action.to)}
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
                )}

                {/* Statistiques globales */}
                <section>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <StatCard
                            icon={<Users className="w-5 h-5" />}
                            label="Organisations"
                            value={loadingOrgs ? '…' : userOrganisations.length.toString()}
                            subLabel="Comptes actifs"
                            color="indigo"
                        />
                        <StatCard
                            icon={<Calendar className="w-5 h-5" />}
                            label="Événements"
                            value="—"
                            subLabel="Disponible Phase 1"
                            color="purple"
                        />
                        <StatCard
                            icon={<Award className="w-5 h-5" />}
                            label="Rôles coach"
                            value={loadingOrgs ? '…' : coachOrgsCount.toString()}
                            subLabel="Espaces actifs"
                            color="emerald"
                        />
                    </div>
                </section>

                {/* Vos organisations */}
                {!loadingOrgs && userOrganisations.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Vos organisations</h2>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                    Sélectionnez un espace pour accéder à ses fonctionnalités
                                </p>
                            </div>
                            <Link to="/accounts">
                                <Button variant="outline" size="sm" mode="club">
                                    Gérer
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {userOrganisations.map(org => (
                                <OrganisationCard
                                    key={org.id}
                                    org={org}
                                    isActive={activeOrganisationData?.id === org.id}
                                    onSelect={() => handleSelectOrganisation(org)}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Actions rapides */}
                <section>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Actions rapides</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <QuickActionCard
                            icon={<Calendar className="w-6 h-6" />}
                            title="Événements du club"
                            description="Voir et s'inscrire aux événements"
                            to="/club/events"
                            color="blue"
                        />
                        <QuickActionCard
                            icon={<Users className="w-6 h-6" />}
                            title="Membres"
                            description="Gérer les membres du club"
                            to="/club/members"
                            color="indigo"
                        />
                        <QuickActionCard
                            icon={<BarChart3 className="w-6 h-6" />}
                            title="Tableau de bord admin"
                            description="Statistiques et gestion"
                            to="/accounts"
                            color="purple"
                        />
                        <QuickActionCard
                            icon={<Settings className="w-6 h-6" />}
                            title="Mon profil"
                            description="Paramètres et informations"
                            to="/club/profile"
                            color="slate"
                        />
                    </div>
                </section>
            </div>
        </Layout>
    );
};

// ─── Composants secondaires ───────────────────────────────────────────────────

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
        emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center mb-4`}>
                {icon}
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{value}</div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{label}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{subLabel}</div>
        </div>
    );
};

const OrganisationCard: React.FC<{
    org: UserOrganisation;
    isActive: boolean;
    onSelect: () => void;
}> = ({ org, isActive, onSelect }) => (
    <div
        onClick={onSelect}
        className={`bg-white dark:bg-slate-900 rounded-2xl border-2 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer ${
            isActive
                ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
        }`}
    >
        <div className="flex items-start justify-between mb-4">
            <div>
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(org.role)}`}>
                    {capitalizeFirst(org.role)}
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-2">{org.name}</h3>
            </div>
            {isActive && (
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-full px-2 py-1">
                    Actif
                </span>
            )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Cliquer pour activer cet espace</p>
    </div>
);

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
        slate: 'bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400',
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
