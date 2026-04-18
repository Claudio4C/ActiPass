import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Loader2, AlertCircle, Building2, UserPlus, BadgeCheck, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import type { RoleType } from '../types';

type Organisation = {
    id: string;
    name: string;
    role: 'membre' | 'coach' | 'gestionnaire' | 'propriétaire' | 'trésorier';
    roleType: RoleType;
    roleName: string;
    type: 'club' | 'association' | 'independant';
    description?: string;
    membershipStatus?: 'pending' | 'active' | 'banned';
};

const roleFilterOptions: Array<'all' | Organisation['role']> = ['all', 'membre', 'coach', 'gestionnaire'];
const typeFilterOptions: Array<'all' | Organisation['type']> = ['all', 'club', 'association', 'independant'];

const ROLE_COLORS: Record<string, string> = {
    'propriétaire': 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
    'gestionnaire': 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    'coach': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
    'trésorier': 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    'membre': 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300',
};

const TYPE_COLORS: Record<string, string> = {
    'club': 'from-indigo-500 to-blue-500',
    'association': 'from-emerald-500 to-teal-500',
    'independant': 'from-pink-500 to-rose-500',
};

const mapRoleToUI = (roleType: RoleType): Organisation['role'] => {
    switch (roleType) {
        case 'club_owner': return 'propriétaire';
        case 'club_manager': return 'gestionnaire';
        case 'treasurer': return 'trésorier';
        case 'coach': return 'coach';
        case 'member':
        default: return 'membre';
    }
};

const formatRoleLabel = (role: Organisation['role'] | 'all'): string => {
    if (role === 'all') return 'Tous les rôles';
    switch (role) {
        case 'membre': return 'Membre';
        case 'coach': return 'Coach';
        case 'gestionnaire': return 'Gestionnaire';
        case 'propriétaire': return 'Propriétaire';
        case 'trésorier': return 'Trésorier';
        default: return role;
    }
};

const formatTypeLabel = (type: Organisation['type'] | 'all'): string => {
    if (type === 'all') return 'Tous les types';
    switch (type) {
        case 'club': return 'Club';
        case 'association': return 'Association';
        case 'independant': return 'Indépendant';
        default: return type;
    }
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

                const mappedOrgs: Organisation[] = data.map((item) => ({
                    id: item.organisation.id,
                    name: item.organisation.name,
                    role: mapRoleToUI(item.role.type),
                    roleType: item.role.type,
                    roleName: item.role.name,
                    type: item.organisation.type || 'club',
                    description: item.organisation.description || undefined,
                    membershipStatus: item.status || 'active',
                }));

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
            if (parsed?.id) setLastSelectedId(parsed.id);
        } catch { /* ignore */ }
    }, []);

    const filteredOrgs = React.useMemo(() => {
        return organisations.filter((org) => {
            const matchesSearch =
                search.trim().length === 0 ||
                org.name.toLowerCase().includes(search.trim().toLowerCase()) ||
                org.roleName.toLowerCase().includes(search.trim().toLowerCase());
            const matchesRole = roleFilter === 'all' || org.role === roleFilter;
            const matchesType = typeFilter === 'all' || org.type === typeFilter;
            return matchesSearch && matchesRole && matchesType;
        });
    }, [organisations, search, roleFilter, typeFilter]);

    const handleSelect = (org: Organisation) => {
        localStorage.setItem('selectedOrganisation', JSON.stringify({
            id: org.id,
            name: org.name,
            type: org.type,
            role: org.role,
            roleType: org.roleType,
            roleName: org.roleName,
            membershipStatus: org.membershipStatus,
        }));
        setLastSelectedId(org.id);
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('organisation:updated'));
        }
        navigate('/club/members');
    };

    const getInitials = (name: string) => {
        return name
            .split(/\s+/)
            .slice(0, 2)
            .map(w => w[0])
            .join('')
            .toUpperCase();
    };

    return (
        <div className="space-y-6">
            {/* Page title */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Choisir un espace</h1>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                    Selectionnez une organisation pour acceder a votre espace.
                </p>
            </div>
                {/* Search + Filters */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="relative flex-1">
                        <svg
                            aria-hidden="true"
                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                        >
                            <circle cx="11" cy="11" r="7" />
                            <path d="m20 20-3.5-3.5" />
                        </svg>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher une organisation..."
                            className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {roleFilterOptions.map((key) => (
                            <button
                                key={key}
                                onClick={() => setRoleFilter(key)}
                                className={`rounded-full px-3 py-1.5 text-xs font-medium transition border ${
                                    roleFilter === key
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-indigo-300'
                                }`}
                            >
                                {formatRoleLabel(key)}
                            </button>
                        ))}
                        <span className="hidden sm:block h-4 w-px bg-gray-200 dark:bg-slate-700" />
                        {typeFilterOptions.map((key) => (
                            <button
                                key={key}
                                onClick={() => setTypeFilter(key)}
                                className={`rounded-full px-3 py-1.5 text-xs font-medium transition border ${
                                    typeFilter === key
                                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                                        : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-gray-400'
                                }`}
                            >
                                {formatTypeLabel(key)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Org Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
                        <p className="text-sm text-gray-500 dark:text-slate-400">Chargement des organisations...</p>
                    </div>
                ) : filteredOrgs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                            <Building2 className="h-6 w-6 text-gray-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {organisations.length === 0 ? 'Aucune organisation' : 'Aucun resultat'}
                        </h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400 max-w-sm">
                            {organisations.length === 0
                                ? "Vous n'etes membre d'aucune organisation."
                                : 'Ajustez vos filtres pour retrouver vos organisations.'}
                        </p>
                        {organisations.length === 0 && (
                            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
                                <ActionCard
                                    icon={Building2}
                                    title="Creer une organisation"
                                    description="Declarez votre club ou association."
                                    accent="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"
                                    onClick={() => navigate('/accounts?intent=create-organisation')}
                                />
                                <ActionCard
                                    icon={UserPlus}
                                    title="Rejoindre un club"
                                    description="Via un lien d'invitation."
                                    accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                                    onClick={() => navigate('/accounts?intent=join-organisation')}
                                />
                                <ActionCard
                                    icon={BadgeCheck}
                                    title="Profil coach"
                                    description="Creez votre studio independant."
                                    accent="bg-pink-50 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400"
                                    onClick={() => navigate('/coach/profile?mode=independant')}
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredOrgs.map((org) => (
                            <button
                                key={org.id}
                                onClick={() => handleSelect(org)}
                                className={`group text-left rounded-xl border p-4 transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                                    lastSelectedId === org.id
                                        ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10'
                                        : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-gray-300 dark:hover:border-slate-700'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${TYPE_COLORS[org.type] || 'from-gray-400 to-gray-500'} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                                        {getInitials(org.name)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{org.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${ROLE_COLORS[org.role] || ROLE_COLORS['membre']}`}>
                                                {formatRoleLabel(org.role)}
                                            </span>
                                            <span className="text-[11px] text-gray-400 dark:text-slate-500">
                                                {formatTypeLabel(org.type)}
                                            </span>
                                        </div>
                                        {org.description && (
                                            <p className="mt-1.5 text-xs text-gray-500 dark:text-slate-400 line-clamp-2">{org.description}</p>
                                        )}
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-gray-300 dark:text-slate-600 group-hover:text-indigo-500 transition mt-1 flex-shrink-0" />
                                </div>
                                {lastSelectedId === org.id && (
                                    <div className="mt-3 pt-3 border-t border-indigo-100 dark:border-indigo-800">
                                        <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">Derniere organisation ouverte</p>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {/* Discover nearby */}
                {!loading && (
                    <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                        <button
                            onClick={() => {
                                if (!('geolocation' in navigator)) return;
                                navigator.geolocation.getCurrentPosition(
                                    (pos) => {
                                        window.open(`https://www.google.com/maps/search/club+association+sportive/@${pos.coords.latitude},${pos.coords.longitude},14z`, '_blank', 'noopener');
                                    },
                                    () => {
                                        const city = window.prompt('Entrez une ville pour chercher un club :');
                                        if (city?.trim()) window.open(`https://www.google.com/maps/search/${encodeURIComponent(`association sportive ${city.trim()}`)}`, '_blank', 'noopener');
                                    }
                                );
                            }}
                            className="group flex items-center gap-3 text-sm text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                        >
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-slate-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition">
                                <MapPin className="h-4 w-4" />
                            </span>
                            Trouver un club a proximite
                            <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )}
            </div>
    );
};

const ActionCard: React.FC<{
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    accent: string;
    onClick: () => void;
}> = ({ icon: Icon, title, description, accent, onClick }) => (
    <button
        onClick={onClick}
        className="text-left rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:shadow-md hover:border-gray-300 dark:hover:border-slate-700 transition"
    >
        <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${accent} mb-3`}>
            <Icon className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{description}</p>
    </button>
);

export default AccountSwitch;
