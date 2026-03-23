import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Users, Bell, MapPin, Activity, Building2, UserPlus,
    BadgeCheck, Construction, ArrowRight
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import ComingSoon from '../components/shared/ComingSoon';
import { api } from '../lib/api';
import type { RoleType } from '../types';

type Organisation = {
    id: string;
    name: string;
    roleType: RoleType;
    roleName: string;
    type: 'club' | 'association' | 'independant';
};

const emptyStateActions = [
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
    },
    {
        id: 'discover-clubs',
        title: 'Découvrir des clubs proches',
        description: 'Parcourez les clubs et associations partenaires pour trouver de nouvelles salles.',
        ctaLabel: 'Explorer les clubs',
        to: '/discover',
        icon: MapPin,
        accent: 'bg-sky-50 text-sky-600'
    },
    {
        id: 'browse-coaches',
        title: 'Trouver un coach indépendant',
        description: 'Accédez aux profils coachs pour organiser des cours privés ou des ateliers.',
        ctaLabel: 'Voir les coachs',
        to: '/coach/independants/demo',
        icon: Activity,
        accent: 'bg-amber-50 text-amber-600',
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

const getRoleDashboardPath = (roleType: RoleType, orgId: string) => {
    if (roleType === 'club_owner' || roleType === 'club_manager' || roleType === 'treasurer') {
        return `/dashboard/${orgId}/overview`;
    }
    return `/club/members`;
};

const HomePage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [organisations, setOrganisations] = useState<Organisation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await api.get<Array<{
                    organisation: { id: string; name: string; type: 'club' | 'association' | null };
                    role: { name: string; type: RoleType };
                }>>('/organisations/my', {}, { useCache: true, cacheTTL: 60000 });

                setOrganisations(data.map(item => ({
                    id: item.organisation.id,
                    name: item.organisation.name,
                    type: item.organisation.type || 'club',
                    roleType: item.role.type,
                    roleName: item.role.name,
                })));
            } catch (err) {
                console.error('Error loading organisations:', err);
                setOrganisations([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleOrgSelect = (org: Organisation) => {
        localStorage.setItem('selectedOrganisation', JSON.stringify({ id: org.id, name: org.name, type: org.type }));
        window.dispatchEvent(new Event('organisation:updated'));
        navigate(getRoleDashboardPath(org.roleType, org.id));
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
                                <Button size="md" className="bg-indigo-50 text-indigo-900 hover:bg-white shadow-lg border border-white/60 px-5">
                                    <Users className="w-4 h-4 mr-2" />
                                    Choisir mon profil
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

                {/* My organisations */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                    </div>
                ) : organisations.length > 0 ? (
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Mes organisations</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {organisations.map(org => (
                                <button
                                    key={org.id}
                                    onClick={() => handleOrgSelect(org)}
                                    className="text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow p-6 group"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                            <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                    </div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{org.name}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{org.roleName}</p>
                                </button>
                            ))}
                        </div>
                    </section>
                ) : (
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Par où commencer ?</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">
                            Vous n'êtes encore membre d'aucune organisation. Choisissez une action pour démarrer.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {emptyStateActions.map(action => {
                                const Icon = action.icon;
                                return (
                                    <Link
                                        key={action.id}
                                        to={action.to}
                                        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow p-6 group block"
                                    >
                                        <div className={`w-10 h-10 rounded-xl ${action.accent} flex items-center justify-center mb-4`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{action.title}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{action.description}</p>
                                        <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 group-hover:underline">
                                            {action.ctaLabel} →
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Activité récente - coming soon */}
                <ComingSoon
                    icon={Construction}
                    title="Activité récente et planning à venir"
                    description="L'historique d'activité et le planning consolidé seront disponibles prochainement."
                />
            </div>
        </Layout>
    );
};

export default HomePage;
