import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import Layout from '../components/layout/Layout';

type Organisation = {
    id: string;
    name: string;
    role: 'membre' | 'coach' | 'gestionnaire';
    type: 'club' | 'association';
    coverQuery: string;
    avatarQuery: string;
    subtitle?: string;
    description?: string;
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

const mockOrgs: Organisation[] = [
    {
        id: 'org-1',
        name: 'Gracie Nova',
        role: 'membre',
        type: 'club',
        coverQuery: 'brazilian jiu jitsu,dojo,mats,training',
        avatarQuery: 'bjj logo,emblem',
        subtitle: "Espace membres officiel de l’académie Gracie Nova, quartier de la Croix-Rousse",
        description:
            'Club historique de Lyon spécialisé en jiu-jitsu brésilien, cours tous niveaux et préparation compétition.',
    },
    {
        id: 'org-2',
        name: 'Grappling Lyon',
        role: 'coach',
        type: 'association',
        coverQuery: 'brazilian jiu jitsu,gi training,grappling',
        avatarQuery: 'martial arts logo,minimal',
        subtitle: 'Association dédiée au grappling no-gi et à la lutte moderne dans le 7ᵉ arrondissement.',
        description:
            'Séances intensives en no-gi, ateliers lutte et conditionnement physique pour compétiteurs et passionnés.',
    },
    {
        id: 'org-3',
        name: 'No-Gi Academy',
        role: 'gestionnaire',
        type: 'club',
        coverQuery: 'no-gi grappling,training,dojo',
        avatarQuery: 'minimal logo,abstract',
        subtitle: 'Académie spécialisée dans les disciplines no-gi et le travail en mobilité.',
        description:
            'Coaching personnalisé, mobilité et fluidité au sol pour grapplers souhaitant progresser sans kimono.',
    },
];

const primarySection = 'bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-3xl border border-white/60 dark:border-slate-800 shadow-lg';
const secondarySection = 'bg-white/70 dark:bg-slate-900/70 backdrop-blur rounded-3xl border border-white/60 dark:border-slate-800 shadow-sm';

const AccountSwitch: React.FC = () => {
    const navigate = useNavigate();
    const [search, setSearch] = React.useState('');
    const [roleFilter, setRoleFilter] = React.useState<'all' | Organisation['role']>('all');
    const [typeFilter, setTypeFilter] = React.useState<'all' | Organisation['type']>('all');
    const [lastSelectedId, setLastSelectedId] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        const stored = window.localStorage.getItem('selectedOrganisation');
        if (!stored) return;
        try {
            const parsed: Organisation = JSON.parse(stored);
            setLastSelectedId(parsed.id);
        } catch (error) {
            console.error('Impossible de récupérer la dernière organisation sélectionnée', error);
        }
    }, []);

    const filteredOrgs = React.useMemo(() => {
        return mockOrgs.filter((org) => {
            const matchesSearch =
                search.trim().length === 0 ||
                org.name.toLowerCase().includes(search.trim().toLowerCase()) ||
                org.role.toLowerCase().includes(search.trim().toLowerCase());
            const matchesRole = roleFilter === 'all' || org.role === roleFilter;
            const matchesType = typeFilter === 'all' || org.type === typeFilter;
            return matchesSearch && matchesRole && matchesType;
        });
    }, [search, roleFilter, typeFilter]);

    const stats = React.useMemo(() => {
        const total = mockOrgs.length;
        const clubs = mockOrgs.filter((org) => org.type === 'club').length;
        const associations = total - clubs;
        const coachRoles = mockOrgs.filter((org) => org.role === 'coach').length;
        return { total, clubs, associations, coachRoles };
    }, []);

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
        localStorage.setItem('selectedOrganisation', JSON.stringify(org));
        setLastSelectedId(org.id);
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('organisation:updated'));
        }
        // Redirige vers l’espace club (modifiable ensuite selon logique)
        navigate('/club/members');
    };

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
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 flex flex-col gap-2 min-w-[220px] transition-colors">
                            <div className="text-xs text-slate-500 dark:text-slate-300 font-medium uppercase tracking-wide">Résumé</div>
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <div className="text-2xl font-semibold text-slate-900 dark:text-white">{stats.total}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-300">Organisations</div>
                                </div>
                                <div className="flex-1">
                                    <div className="text-lg font-semibold text-indigo-600">{stats.coachRoles}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-300">Rôles coach</div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-300">
                                <span>
                                    Clubs: <span className="text-slate-900 dark:text-white font-medium">{stats.clubs}</span>
                                </span>
                                <span>
                                    Associations: <span className="text-slate-900 dark:text-white font-medium">{stats.associations}</span>
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
                            {(['all', 'membre', 'coach', 'gestionnaire'] as const).map((roleKey) => (
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
                                    {roleKey === 'all' ? 'Tous les rôles' : `Rôle ${roleKey}`}
                                </button>
                            ))}
                            <span className="hidden sm:block h-5 w-px bg-slate-200" />
                            {(['all', 'club', 'association'] as const).map((typeKey) => (
                                <button
                                    key={typeKey}
                                    type="button"
                                    onClick={() => setTypeFilter(typeKey)}
                                    className={`rounded-full px-4 py-2 text-xs font-medium transition shadow-sm border ${
                                        typeFilter === typeKey
                                            ? 'bg-slate-900 text-white border-slate-900'
                                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:text-slate-900'
                                    }`}
                                >
                                    {typeKey === 'all' ? 'Tous les types' : typeKey === 'club' ? 'Clubs' : 'Associations'}
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
                                        {mockOrgs.find((org) => org.id === lastSelectedId)?.name ?? 'une organisation qui n’est plus disponible'}
                                    </span>
                                </p>
                            </div>
                        </div>
                    )}
                </section>

                <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredOrgs.length === 0 ? (
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
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Aucune organisation trouvée</h2>
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 max-w-sm">
                                    Ajustez vos filtres ou relancez une recherche plus large pour retrouver vos clubs et associations.
                                </p>
                            </div>
                        </div>
                    ) : (
                        filteredOrgs.map((org, idx) => (
                            <button
                                key={org.id}
                                type="button"
                                onClick={() => handleSelect(org)}
                                className={`relative group text-left rounded-3xl overflow-hidden border transition shadow-sm hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 ${
                                    lastSelectedId === org.id ? 'border-indigo-200 ring-1 ring-indigo-200' : 'border-white/60'
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
                                        {org.type === 'club' ? 'Club' : 'Association'}
                                        <span className="h-1 w-1 rounded-full bg-slate-400" />
                                        {org.role}
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