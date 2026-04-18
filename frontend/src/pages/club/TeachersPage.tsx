import React from 'react';

const unsplash = (w: number, h: number, query: string, seed: string | number) =>
    `https://source.unsplash.com/random/${w}x${h}/?${encodeURIComponent(query)}&sig=${seed}`;

const ImgWithFallback: React.FC<{
    src: string;
    alt: string;
    className?: string;
    width: number;
    height: number;
    seed: string | number;
}> = ({ src, alt, className, width, height, seed }) => {
    const [source, setSource] = React.useState(src);
    return (
        <img
            src={source}
            alt={alt}
            className={className}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setSource(`https://picsum.photos/${width}/${height}?random=${seed}`)}
        />
    );
};

type Teacher = {
    name: string;
    roles: string;
    query: string;
    bio?: string;
    specialties?: string[];
};

const teachers: Teacher[] = [
    {
        name: 'Youssef',
        roles: 'Jiu-jitsu brésilien & Luta Livre',
        query: 'bjj coach,portrait,gi,no-gi',
        bio: 'Coach principal depuis 8 ans, Youssef accompagne aussi bien les loisirs que les compétiteurs.',
        specialties: ['No-Gi Grappling', 'Préparation physique', 'Passage de garde'],
    },
    {
        name: 'Willy',
        roles: 'Jiu-jitsu brésilien',
        query: 'bjj coach,portrait,athlete',
        bio: 'Pédagogue et patient, Willy est la référence pour les fondamentaux et l’initiation.',
        specialties: ['Fondamentaux BJJ', 'Défense depuis la garde', 'Drills techniques'],
    },
    {
        name: 'Hamza',
        roles: 'Jiu-jitsu brésilien & Luta Livre',
        query: 'bjj coach,portrait,athlete',
        bio: 'Hamza met l’accent sur le timing, la fluidité et la compréhension du no-gi.',
        specialties: ['Transitions', 'Soumissions en chaîne', 'Contrôle dynamique'],
    },
    {
        name: 'Fabrice',
        roles: 'Jiu-jitsu brésilien',
        query: 'bjj coach,portrait,athlete',
        bio: 'Fabrice est connu pour sa maîtrise du jeu half-guard et la stratégie en sparring.',
        specialties: ['Half-Guard', 'Contrôle du rythme', 'Analyse de combat'],
    },
];

const defaultClubInfo = {
    title: 'Professeurs du club',
    subtitle: 'Découvrez l’équipe pédagogique et leurs expertises techniques.',
};

type ClubMetadata = {
    name?: string;
    subtitle?: string;
};

const TeachersPage: React.FC = () => {
    const [clubInfo, setClubInfo] = React.useState(() => {
        if (typeof window === 'undefined') return defaultClubInfo;
        try {
            const raw = window.localStorage.getItem('selectedOrganisation');
            if (!raw) return defaultClubInfo;
            const parsed = JSON.parse(raw) as ClubMetadata | null;
            if (!parsed) return defaultClubInfo;
            return {
                title: parsed.name ? `Équipe pédagogique – ${parsed.name}` : defaultClubInfo.title,
                subtitle: parsed.subtitle ?? defaultClubInfo.subtitle,
            };
        } catch (error) {
            console.error('Impossible de charger les informations du club actif', error);
            return defaultClubInfo;
        }
    });

    React.useEffect(() => {
        const handler = () => {
            try {
                const raw = window.localStorage.getItem('selectedOrganisation');
                if (!raw) {
                    setClubInfo(defaultClubInfo);
                    return;
                }
                const parsed = JSON.parse(raw) as ClubMetadata | null;
                if (!parsed) {
                    setClubInfo(defaultClubInfo);
                    return;
                }
                setClubInfo({
                    title: parsed.name ? `Équipe pédagogique – ${parsed.name}` : defaultClubInfo.title,
                    subtitle: parsed.subtitle ?? defaultClubInfo.subtitle,
                });
            } catch (error) {
                console.error('Impossible de mettre à jour les informations du club actif', error);
                setClubInfo(defaultClubInfo);
            }
        };

        handler();
        window.addEventListener('storage', handler);
        window.addEventListener('organisation:updated', handler);
        return () => {
            window.removeEventListener('storage', handler);
            window.removeEventListener('organisation:updated', handler);
        };
    }, []);

    const [search, setSearch] = React.useState('');

    const filteredTeachers = React.useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return teachers;
        return teachers.filter((teacher) =>
            teacher.name.toLowerCase().includes(term) || teacher.roles.toLowerCase().includes(term)
        );
    }, [search]);

    return (
        <>
            <div className="space-y-8">
                <section className="rounded-3xl bg-white/90 backdrop-blur border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="relative w-full lg:max-w-sm">
                            <label htmlFor="teacher-search" className="sr-only">
                                Rechercher un professeur
                            </label>
                            <input
                                id="teacher-search"
                                type="text"
                                placeholder="Rechercher par nom ou spécialité"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40 shadow-sm"
                            />
                            <svg
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
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-indigo-600 font-semibold">
                                {filteredTeachers.length} coachs
                            </span>
                            <span className="hidden sm:inline">•</span>
                            <span className="text-slate-400">Cliquez sur un profil pour obtenir la fiche détaillée depuis la page principale.</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                        {filteredTeachers.map((teacher, idx) => (
                            <article key={teacher.name} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                <ImgWithFallback
                                    src={unsplash(240, 240, teacher.query, `teacher-page-${idx}`)}
                                    alt={teacher.name}
                                    className="w-24 h-24 rounded-3xl object-cover mx-auto"
                                    width={240}
                                    height={240}
                                    seed={`teacher-page-${idx}`}
                                />
                                <div className="mt-4 space-y-3 text-center">
                                    <h2 className="text-sm font-semibold text-slate-900">{teacher.name}</h2>
                                    <p className="text-xs text-slate-500">{teacher.roles}</p>
                                    {teacher.bio ? <p className="text-xs text-slate-600 leading-relaxed">{teacher.bio}</p> : null}
                                    {teacher.specialties?.length ? (
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {teacher.specialties.map((spec) => (
                                                <span key={spec} className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-600">
                                                    {spec}
                                                </span>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            </div>
        </>
    );
};

export default TeachersPage;
