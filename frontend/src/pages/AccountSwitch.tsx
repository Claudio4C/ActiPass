import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Loader2, AlertCircle, Building2, UserPlus, BadgeCheck } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { api } from '../lib/api';
import type { RoleType } from '../types';
import Button from '../components/ui/Button';

type Organisation = {
    id: string;
    name: string;
    role: 'membre' | 'coach' | 'gestionnaire' | 'propriétaire' | 'trésorier';
    roleType: RoleType;
    roleName: string;
    type: 'club' | 'association' | 'independant';
    coverQuery: string;
    avatarQuery: string;
    subtitle?: string;
    description?: string;
    membershipStatus?: 'pending' | 'active' | 'banned';
};

const unsplash = (w: number, h: number, query: string, seed: string | number) =>
    `https://source.unsplash.com/random/${w}x${h}/?${encodeURIComponent(query)}&sig=${seed}`;

const ImgWithFallback: React.FC<{ src: string; alt: string; className?: string; w: number; h: number; seed: string | number }> = ({ src, alt, className, w, h, seed }) => {
    const [s, setS] = React.useState(src);
    return (
        <img
            src={s}
            alt={alt}
            className={className}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setS(`https://picsum.photos/${w}/${h}?random=${seed}`)}
        />
    );
};


const primarySection = 'bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-3xl border border-white/60 dark:border-slate-800 shadow-lg';
const secondarySection = 'bg-white/70 dark:bg-slate-900/70 backdrop-blur rounded-3xl border border-white/60 dark:border-slate-800 shadow-sm';
const roleFilterOptions: Array<'all' | Organisation['role']> = ['all', 'membre', 'coach', 'gestionnaire', 'independant'];
const typeFilterOptions: Array<'all' | Organisation['type']> = ['all', 'club', 'association', 'independant'];
type EmptyStateAction = {
    id: string;
    title: string;
    description: string;
    ctaLabel: string;
    to?: string;
    onClick?: () => void;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
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
        description: 'Recevez un lien d’invitation ou envoyez une demande d’accès à votre club existant.',
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
        id: 'demo-space',
        title: 'Activer un espace démo',
        description: 'Générez un faux club instantané pour explorer le tableau de bord membre sans attendre une invitation.',
        ctaLabel: 'Créer l’espace test',
        onClick: undefined, // défini dynamiquement plus bas
        icon: BadgeCheck,
        accent: 'bg-slate-50 text-slate-700'
    }
];
// Mapper les rôles de la BDD vers les rôles de l'UI
const mapRoleToUI = (roleType: RoleType): Organisation['role'] => {
    switch (roleType) {
        case 'club_owner':
            return 'propriétaire';
        case 'club_manager':
            return 'gestionnaire';
        case 'treasurer':
            return 'trésorier';
        case 'coach':
            return 'coach';
        case 'member':
        default:
            return 'membre';
    }
};

// Générer des queries Unsplash basées sur le nom de l'organisation
const generateQueries = (orgName: string): { cover: string; avatar: string } => {
    const lowerName = orgName.toLowerCase();
    let coverQuery = 'sports,club,association';
    let avatarQuery = 'logo,emblem';

    if (lowerName.includes('jiu') || lowerName.includes('bjj') || lowerName.includes('grappling')) {
        coverQuery = 'brazilian jiu jitsu,dojo,mats,training';
        avatarQuery = 'bjj logo,emblem';
    } else if (lowerName.includes('tennis')) {
        coverQuery = 'tennis,court,racket';
        avatarQuery = 'tennis logo';
    } else if (lowerName.includes('football') || lowerName.includes('soccer')) {
        coverQuery = 'football,soccer,field';
        avatarQuery = 'football logo';
    } else if (lowerName.includes('basket')) {
        coverQuery = 'basketball,court,hoop';
        avatarQuery = 'basketball logo';
    }

    return { cover: coverQuery, avatar: avatarQuery };
};

const AccountSwitch: React.FC = () => {
    const navigate = useNavigate();
    const [organisations, setOrganisations] = React.useState<Organisation[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [search, setSearch] = React.useState('');
    const [roleFilter, setRoleFilter] = React.useState<'all' | Organisation['role']>('all');
    const [typeFilter, setTypeFilter] = React.useState<'all' | Organisation['type']>('all');
    const [lastSelectedId, setLastSelectedId] = React.useState<string | null>(null);

    // Charger les organisations depuis l'API
    React.useEffect(() => {
        const loadOrganisations = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await api.get<Array<{
                    organisation: {
                        id: string;
                        name: string;
                        type: 'club' | 'association' | null;
                        description: string | null;
                    };
                    role: {
                        id: string;
                        name: string;
                        type: RoleType;
                        level: number;
                    };
                    joined_at: string;
                    status: 'pending' | 'active' | 'banned';
                }>>('/organisations/my', {}, { useCache: true, cacheTTL: 60000 });

                const mappedOrgs: Organisation[] = data.map((item) => {
                    const orgType = item.organisation.type || 'club';
                    const queries = generateQueries(item.organisation.name);
                    const uiRole = mapRoleToUI(item.role.type);

                    return {
                        id: item.organisation.id,
                        name: item.organisation.name,
                        role: uiRole,
                        roleType: item.role.type,
                        roleName: item.role.name,
                        type: orgType,
                        coverQuery: queries.cover,
                        avatarQuery: queries.avatar,
                        subtitle: item.organisation.description || undefined,
                        description: item.organisation.description || undefined,
                        membershipStatus: item.status || 'active', // Ajouter le statut du membership
                    };
                });

                setOrganisations(mappedOrgs);
            } catch (err: any) {
                console.error('Error loading organisations:', err);
                setError(err?.response?.data?.message || err?.message || 'Erreur lors du chargement des organisations');
            } finally {
                setLoading(false);
            }
        };

        loadOrganisations();
    }, []);

    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        const stored = window.localStorage.getItem('selectedOrganisation');
        if (!stored) return;
        try {
            const parsed = JSON.parse(stored);
            if (parsed?.id) {
                setLastSelectedId(parsed.id);
            }
        } catch (error) {
            console.error('Impossible de récupérer la dernière organisation sélectionnée', error);
        }
    }, []);

    const filteredOrgs = React.useMemo(() => {
        return organisations.filter((org) => {
            const matchesSearch =
                search.trim().length === 0 ||
                org.name.toLowerCase().includes(search.trim().toLowerCase()) ||
                org.role.toLowerCase().includes(search.trim().toLowerCase()) ||
                org.roleName.toLowerCase().includes(search.trim().toLowerCase());
            const matchesRole = roleFilter === 'all' || org.role === roleFilter;
            const matchesType = typeFilter === 'all' || org.type === typeFilter;
            return matchesSearch && matchesRole && matchesType;
        });
    }, [organisations, search, roleFilter, typeFilter]);

    const stats = React.useMemo(() => {
        const total = organisations.length;
        const clubs = organisations.filter((org) => org.type === 'club').length;
        const associations = organisations.filter((org) => org.type === 'association').length;
        const independants = organisations.filter((org) => org.type === 'independant').length;
        const coachRoles = organisations.filter((org) => org.role === 'coach').length;
        const freelanceRoles = organisations.filter((org) => org.role === 'independant').length;
        return { total, clubs, associations, independants, coachRoles, freelanceRoles };
    }, [organisations]);

    const handleDiscoverNearby = React.useCallback(() => {
        if (typeof window === 'undefined') return;
        if (!('geolocation' in navigator)) {
            const fallback = window.prompt('Entrez la ville ou le code postal pour rechercher une nouvelle association :');
            if (fallback && fallback.trim().length > 0) {
                const encoded = encodeURIComponent(`association sportive ${fallback.trim()}`);
                window.open(`https://www.google.com/maps/search/${encoded}`, '_blank', 'noopener');
            }
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const mapsUrl = `https://www.google.com/maps/search/club+association+sportive/@${latitude},${longitude},14z`;
                window.open(mapsUrl, '_blank', 'noopener');
            },
            () => {
                const fallback = window.prompt('Impossible de récupérer votre position. Entrez une ville pour chercher une association :');
                if (fallback && fallback.trim().length > 0) {
                    const encoded = encodeURIComponent(`association sportive ${fallback.trim()}`);
                    window.open(`https://www.google.com/maps/search/${encoded}`, '_blank', 'noopener');
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 8000,
                maximumAge: 0,
            }
        );
    }, []);

    const handleSelect = (org: Organisation) => {
        // Sauvegarder l'organisation avec les informations nécessaires
        const orgToSave = {
            id: org.id,
            name: org.name,
            type: org.type,
            role: org.role,
            roleType: org.roleType,
            roleName: org.roleName,
            membershipStatus: org.membershipStatus,
        };
        localStorage.setItem('selectedOrganisation', JSON.stringify(orgToSave));
        setLastSelectedId(org.id);
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('organisation:updated'));
        }
        // Redirige vers la page membres du club/association
        navigate('/club/members');
    };

    const handleCreateDemoSpace = React.useCallback(() => {
        const demoOrg: Organisation = {
            id: `demo-org-${Date.now()}`,
            name: 'Demo BJJ Club',
            role: 'membre',
            roleType: 'member',
            roleName: 'Membre (démo)',
            type: 'club',
            coverQuery: 'dojo training sparring',
            avatarQuery: 'club logo minimal',
            subtitle: 'Espace fictif pour tester vos parcours',
            description: 'Accès instantané aux sections membres, événements et messages.',
            membershipStatus: 'active'
        };

        setOrganisations((prev) => [demoOrg, ...prev]);
        setLastSelectedId(demoOrg.id);

        const orgToSave = {
            id: demoOrg.id,
            name: demoOrg.name,
            type: demoOrg.type,
            role: demoOrg.role,
            roleType: demoOrg.roleType,
            roleName: demoOrg.roleName,
            membershipStatus: demoOrg.membershipStatus
        };
        localStorage.setItem('selectedOrganisation', JSON.stringify(orgToSave));
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('organisation:updated'));
        }
        navigate('/club/members');
    }, [navigate]);

    const handleActionNavigate = React.useCallback((path?: string) => {
        if (!path) return;
        navigate(path);
    }, [navigate]);

    // Injecter le handler dynamique dans l'action démo (évite de recréer l'array à chaque rendu)
    const actionsWithHandlers = React.useMemo(() => {
        return emptyStateActions.map((action) =>
            action.id === 'demo-space'
                ? { ...action, onClick: handleCreateDemoSpace }
                : action
        );
    }, [handleCreateDemoSpace]);

    return (
        <Layout
            title="Changer d’organisation"
            subtitle="Retrouvez vos clubs, vérifiez vos rôles et reprenez la bonne équipe en un clin d’œil."
            mode="club"
        >
            <div className="space-y-10">
                <section className="bg-white/40 dark:bg-slate-900/60 backdrop-blur-sm border border-white/60 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Gestion multi-organisations</p>
                            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white mt-1">Choisir un compte</h1>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-xl">
                                Accédez rapidement à vos espaces clubs & associations. Filtrez vos organisations, vérifiez vos droits et reprenez votre activité en quelques secondes.
                            </p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 flex flex-col gap-3 min-w-[220px] transition-colors">
                            <div className="text-xs text-slate-500 dark:text-slate-300 font-medium uppercase tracking-wide">Résumé</div>
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <div className="text-2xl font-semibold text-slate-900 dark:text-white">{stats.total}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-300">Organisations</div>
                                </div>
                                <div className="flex-1">
                                    <div className="text-lg font-semibold text-indigo-600">{stats.coachRoles + stats.freelanceRoles}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-300">Rôles coach</div>
                                    <p className="text-[11px] text-slate-400">
                                        dont {stats.freelanceRoles} indép.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-300">
                                <span>
                                    Clubs: <span className="text-slate-900 dark:text-white font-medium">{stats.clubs}</span>
                                </span>
                                <span>
                                    Associations: <span className="text-slate-900 dark:text-white font-medium">{stats.associations}</span>
                                </span>
                                <span>
                                    Indépendants: <span className="text-slate-900 dark:text-white font-medium">{stats.independants}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className={primarySection + ' p-6 sm:p-8 transition-colors space-y-6'}>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="relative flex-1">
                            <label htmlFor="org-search" className="sr-only">
                                Rechercher une organisation
                            </label>
                            <input
                                id="org-search"
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Rechercher un club, une association ou un rôle…"
                                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-3 pl-12 pr-4 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40 shadow-sm transition"
                            />
                            <svg
                                aria-hidden="true"
                                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-indigo-500"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={1.8}
                                viewBox="0 0 24 24"
                            >
                                <circle cx="11" cy="11" r="7" />
                                <path d="m20 20-3.5-3.5" />
                            </svg>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {roleFilterOptions.map((roleKey) => (
                                <button
                                    key={roleKey}
                                    type="button"
                                    onClick={() => setRoleFilter(roleKey)}
                                    className={`rounded-full px-4 py-2 text-xs font-medium transition shadow-sm border ${
                                        roleFilter === roleKey
                                            ? 'bg-indigo-500 text-white border-indigo-500'
                                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-200 hover:text-indigo-600'
                                    }`}
                                >
                                    {roleKey === 'all' ? 'Tous les rôles' : formatRoleLabel(roleKey)}
                                </button>
                            ))}
                            {(['all', 'membre', 'coach', 'gestionnaire', 'propriétaire', 'trésorier'] as const).map((roleKey) => {
                                // Ne pas afficher les filtres qui n'ont pas d'organisations correspondantes
                                const hasOrgsWithRole = roleKey === 'all' || organisations.some(org => org.role === roleKey);
                                if (!hasOrgsWithRole) return null;

                                return (
                                    <button
                                        key={roleKey}
                                        type="button"
                                        onClick={() => setRoleFilter(roleKey)}
                                        className={`rounded-full px-4 py-2 text-xs font-medium transition shadow-sm border ${roleFilter === roleKey
                                            ? 'bg-indigo-500 text-white border-indigo-500'
                                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-200 hover:text-indigo-600'
                                            }`}
                                    >
                                        {roleKey === 'all' ? 'Tous les rôles' : roleKey === 'propriétaire' ? 'Propriétaire' : roleKey === 'trésorier' ? 'Trésorier' : `Rôle ${roleKey}`}
                                    </button>
                                );
                            })}
                            <span className="hidden sm:block h-5 w-px bg-slate-200" />
                            {typeFilterOptions.map((typeKey) => (
                                <button
                                    key={typeKey}
                                    type="button"
                                    onClick={() => setTypeFilter(typeKey)}
                                    className={`rounded-full px-4 py-2 text-xs font-medium transition shadow-sm border ${typeFilter === typeKey
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:text-slate-900'
                                        }`}
                                >
                                    {typeKey === 'all' ? 'Tous les types' : formatTypeLabel(typeKey)}
                                </button>
                            ))}
                        </div>
                    </div>
                    {lastSelectedId && (
                        <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-xs text-indigo-700 flex items-center gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-white text-xs font-semibold">◎</span>
                            <div>
                                <p className="font-medium">Dernière organisation ouverte</p>
                                <p className="text-indigo-600/70">
                                    Vous avez quitté la plateforme sur{' '}
                                    <span className="font-semibold">
                                        {organisations.find((org) => org.id === lastSelectedId)?.name ?? "une organisation qui n'est plus disponible"}
                                    </span>
                                </p>
                            </div>
                        </div>
                    )}
                    {error && (
                        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-medium">Erreur</p>
                                <p className="text-red-600/70 mt-1">{error}</p>
                            </div>
                        </div>
                    )}
                </section>

                <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full">
                            <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 py-12 text-center shadow-inner">
                                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Chargement des organisations...</h2>
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 max-w-sm">
                                    Récupération de vos clubs et associations.
                                </p>
                            </div>
                        </div>
                    ) : filteredOrgs.length === 0 ? (
                        <div className="col-span-full">
                            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 py-12 text-center shadow-inner">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 shadow-sm mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                        <path
                                            fillRule="evenodd"
                                            d="M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0ZM9 8a1 1 0 1 0 0 2h2a1 1 0 1 1 0 2H9a1 1 0 1 0 0 2h.5a1 1 0 0 1 .832.445l.884 1.326a.5.5 0 0 0 .832-.555L12 15h-1a1 1 0 0 1 0-2h2a1 1 0 1 0 0-2h-2a1 1 0 1 1 0-2h1a1 1 0 0 0 0-2H9Z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                    {organisations.length === 0 ? 'Aucune organisation' : 'Aucune organisation trouvée'}
                                </h2>
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 max-w-sm">
                                    {organisations.length === 0
                                        ? "Vous n'êtes membre d'aucune organisation pour le moment."
                                        : 'Ajustez vos filtres ou relancez une recherche plus large pour retrouver vos clubs et associations.'}
                                </p>
                                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
                                    {actionsWithHandlers.map((action) => {
                                        const Icon = action.icon;
                                        return (
                                            <div
                                                key={action.id}
                                                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 text-left shadow-sm hover:shadow-md hover:border-indigo-200 transition-colors"
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
                                                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">{action.title}</h3>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{action.description}</p>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="w-full justify-center"
                                                    onClick={() => (action.onClick ? action.onClick() : handleActionNavigate(action.to))}
                                                    type="button"
                                                >
                                                    {action.ctaLabel}
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        filteredOrgs.map((org, idx) => (
                            <button
                                key={org.id}
                                type="button"
                                onClick={() => handleSelect(org)}
                                className={`relative group text-left rounded-3xl overflow-hidden border transition shadow-sm hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 ${lastSelectedId === org.id ? 'border-indigo-200 ring-1 ring-indigo-200' : 'border-white/60'
                                    }`}
                            >
                                <div className="relative">
                                    <ImgWithFallback
                                        src={unsplash(640, 320, org.coverQuery, `org-cover-${idx}`)}
                                        alt={org.name}
                                        className="w-full aspect-[16/8] object-cover"
                                        w={640}
                                        h={320}
                                        seed={`org-cover-${idx}`}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent transition opacity-90 group-hover:opacity-100" />
                                    <div className="absolute top-4 left-4 inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
                                        {formatTypeLabel(org.type)}
                                        <span className="h-1 w-1 rounded-full bg-slate-400" />
                                        {formatRoleLabel(org.role)}
                                        {org.role === 'propriétaire' ? 'Propriétaire' : org.role === 'trésorier' ? 'Trésorier' : org.role === 'gestionnaire' ? 'Gestionnaire' : org.role}
                                    </div>
                                </div>
                                <div className="p-5 bg-white dark:bg-slate-900">
                                    <div className="flex items-start gap-4">
                                        <ImgWithFallback
                                            src={unsplash(56, 56, org.avatarQuery, `org-avatar-${idx}`)}
                                            alt={`${org.name} avatar`}
                                            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white dark:ring-slate-800 shadow"
                                            w={56}
                                            h={56}
                                            seed={`org-avatar-${idx}`}
                                        />
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{org.name}</h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-300">{org.subtitle}</p>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{org.description}</p>
                                </div>
                            </button>
                        ))
                    )}
                    <div className="col-span-full">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300 mb-3">
                            <span className="inline-flex h-2 w-2 rounded-full bg-indigo-400" />
                            Autres options
                        </div>
                        <button
                            type="button"
                            onClick={handleDiscoverNearby}
                            className="group w-full text-left"
                        >
                            <div className="relative overflow-hidden rounded-3xl border border-indigo-200/80 dark:border-indigo-500/60 bg-white dark:bg-slate-900 px-6 py-7 shadow-lg transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300">
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-transparent to-sky-500/10 opacity-0 group-hover:opacity-100 transition" />
                                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-start gap-4">
                                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600">
                                            <MapPin className="h-6 w-6" />
                                        </span>
                                        <div className="space-y-2">
                                            <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                                                Nouvelle option
                                            </span>
                                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                                Je cherche un nouveau club dans les environs
                                            </h2>
                                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-5">
                                                Je rentre dans l’appli, je choisis mon club de jiu-jitsu ou mon club de tennis… ou je me laisse guider pour découvrir une nouvelle association près de moi.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 self-end sm:self-center text-sm font-semibold text-indigo-600 dark:text-indigo-300">
                                        Explorer
                                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white transition">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </button>
                    </div>
                </section>
            </div>
        </Layout>
    );
};

export default AccountSwitch;

const formatRoleLabel = (role: Organisation['role'] | 'all'): string => {
    if (role === 'all') return 'Tous les rôles';
    switch (role) {
        case 'membre':
            return 'Rôle membre';
        case 'coach':
            return 'Rôle coach';
        case 'gestionnaire':
            return 'Gestionnaire';
        case 'independant':
            return 'Coach indépendant';
        default:
            return role;
    }
};

const formatTypeLabel = (type: Organisation['type'] | 'all'): string => {
    if (type === 'all') return 'Tous les types';
    switch (type) {
        case 'club':
            return 'Club';
        case 'association':
            return 'Association';
        case 'independant':
            return 'Indépendant';
        default:
            return type;
    }
};