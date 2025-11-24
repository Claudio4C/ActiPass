import React from 'react';
import Layout from '../../components/layout/Layout';
import { Link } from 'react-router-dom';

type DayName = 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi' | 'Dimanche';

const dayNames: DayName[] = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const getTodayDayName = (): DayName => dayNames[new Date().getDay()];

// Utilitaire simple pour générer des images aléatoires Unsplash avec un "seed"
const unsplash = (w: number, h: number, query: string, seed: number | string) =>
    `https://source.unsplash.com/random/${w}x${h}/?${encodeURIComponent(query)}&sig=${seed}`;

// Composant image avec fallback (Unsplash -> Picsum)
const ImgWithFallback: React.FC<{
    src: string;
    alt: string;
    className?: string;
    width: number;
    height: number;
    seed: string | number;
}> = ({ src, alt, className, width, height, seed }) => {
    const [imgSrc, setImgSrc] = React.useState(src);
    return (
        <img
            src={imgSrc}
            alt={alt}
            className={className}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgSrc(`https://picsum.photos/${width}/${height}?random=${seed}`)}
        />
    );
};

type Slot = {
    time: string;
    discipline: string;
    coach: string;
    location: string;
    day: DayName;
    city: string;
};

const mockSchedule: Slot[] = [
    { time: '07:30', discipline: 'Conditioning No-Gi', coach: 'Hamza', location: 'Studio Croix-Rousse', day: 'Lundi', city: 'Lyon' },
    { time: '12:30', discipline: 'Luta Livre', coach: 'Youssef', location: 'COSEC Marcel Pagnol', day: 'Lundi', city: 'Villeurbanne' },
    { time: '19:30', discipline: 'Jiu-jitsu brésilien', coach: 'Willy', location: 'COSEC Marcel Pagnol', day: 'Lundi', city: 'Villeurbanne' },
    { time: '08:00', discipline: 'Drills compétition', coach: 'Hamza', location: 'Studio Croix-Rousse', day: 'Mardi', city: 'Lyon' },
    { time: '18:30', discipline: 'Jiu-jitsu brésilien', coach: 'Fabrice', location: 'Dojo Villeurbanne', day: 'Mardi', city: 'Villeurbanne' },
    { time: '07:00', discipline: 'Mobilité & récupération', coach: 'Willy', location: 'Studio Croix-Rousse', day: 'Mercredi', city: 'Lyon' },
    { time: '20:00', discipline: 'No-Gi Grappling', coach: 'Youssef', location: 'COSEC Marcel Pagnol', day: 'Mercredi', city: 'Villeurbanne' },
    { time: '12:15', discipline: 'Judo', coach: 'Youssef', location: 'COSEC Marcel Pagnol', day: 'Jeudi', city: 'Villeurbanne' },
    { time: '19:45', discipline: 'Sparring compétition', coach: 'Hamza', location: 'Dojo Villeurbanne', day: 'Jeudi', city: 'Villeurbanne' },
    { time: '18:00', discipline: 'Jiu-jitsu brésilien', coach: 'Willy', location: 'COSEC Marcel Pagnol', day: 'Vendredi', city: 'Villeurbanne' },
    { time: '20:30', discipline: 'Open mat libre', coach: 'Collectif', location: 'Studio Croix-Rousse', day: 'Vendredi', city: 'Lyon' },
    { time: '10:30', discipline: 'Stage technique', coach: 'Invité', location: 'COSEC Marcel Pagnol', day: 'Samedi', city: 'Villeurbanne' },
    { time: '11:00', discipline: 'Préparation physique', coach: 'Hamza', location: 'Studio Croix-Rousse', day: 'Dimanche', city: 'Lyon' },
];

const disciplines = [
    { name: 'Jiu-jitsu brésilien', query: 'brazilian jiu jitsu,bjj,grappling,rolling' },
    { name: 'Luta Livre', query: 'brazilian jiu jitsu,bjj,grappling,training' },
    { name: 'Judo', query: 'brazilian jiu jitsu,bjj,grappling,dojo' },
];

type Teacher = {
    name: string;
    roles: string;
    query: string;
    bio?: string;
    specialties?: string[];
    contact?: {
        email?: string;
        phone?: string;
        instagram?: string;
    };
};

const teachers: Teacher[] = [
    {
        name: 'Youssef',
        roles: 'Jiu-jitsu brésilien & Luta Livre',
        query: 'bjj coach,portrait,gi,no-gi',
        bio: 'Passionné par le grappling, Youssef enseigne depuis 8 ans et accompagne les compétiteurs comme les loisirs.',
        specialties: ['No-Gi Grappling', 'Préparation physique', 'Tactiques de passage de garde'],
        contact: { instagram: '@youssef_bjj' },
    },
    {
        name: 'Willy',
        roles: 'Jiu-jitsu brésilien',
        query: 'bjj coach,portrait,athlete',
        bio: 'Pédagogue et patient, Willy accompagne les débutants dans leurs premiers pas.',
        specialties: ['Défense depuis la garde', 'Fondamentaux BJJ', 'Drills techniques'],
    },
    {
        name: 'Hamza',
        roles: 'Jiu-jitsu brésilien & Luta Livre',
        query: 'bjj coach,portrait,athlete',
        bio: 'Entraîneur dynamique, Hamza met l’accent sur la fluidité et le timing.',
        specialties: ['Transitions', 'Soumissions en chaîne', 'Positionnement'],
    },
    {
        name: 'Fabrice',
        roles: 'Jiu-jitsu brésilien',
        query: 'bjj coach,portrait,athlete',
        bio: 'Spécialiste du jeu en half-guard, Fabrice aime les détails techniques.',
        specialties: ['Half-Guard', 'Contrôles', 'Stratégie en sparring'],
    },
];

const videoLessons = [
    {
        id: 'lesson-1',
        title: 'Passage de garde X-pass',
        teacher: 'Youssef',
        discipline: 'Jiu-jitsu brésilien',
        duration: '08:42',
        videoUrl: 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4',
        posterQuery: 'bjj technique drill',
        description: 'Séquence détaillée pour travailler le X-pass avec des variations debout et au sol.',
    },
    {
        id: 'lesson-2',
        title: 'Contrôle des hanches en Luta Livre',
        teacher: 'Hamza',
        discipline: 'Luta Livre',
        duration: '12:18',
        videoUrl: 'https://samplelib.com/lib/preview/mp4/sample-10s.mp4',
        posterQuery: 'grappling nogi training',
        description: 'Clés pour garder la pression lors des transitions no-gi depuis le demi-garde.',
    },
    {
        id: 'lesson-3',
        title: 'Uchi mata dynamique',
        teacher: 'Fabrice',
        discipline: 'Judo',
        duration: '06:57',
        videoUrl: 'https://filesamples.com/samples/video/mp4/sample_640x360.mp4',
        posterQuery: 'judo throw training dojo',
        description: 'Approche progressive de l’uchi mata avec variations en déplacement.',
    },
];

type RatingSummary = {
    average: number;
    count: number;
    userRating?: number;
};

const baseTeacherRatings: Record<string, { average: number; count: number }> = {
    Youssef: { average: 4.8, count: 126 },
    Willy: { average: 4.6, count: 98 },
    Hamza: { average: 4.7, count: 74 },
    Fabrice: { average: 4.5, count: 51 },
};
const news = [
    { title: "This Day That Year: Sandeep Lamichhane's IPL signing, Paras Khadka...", date: '31 January, 2023' },
    { title: 'Six central members leave CAN meeting demanding President Chand’s Resign...', date: '1 February, 2023' },
    { title: 'Adil Ansari confesses the spot fixing accusation over him', date: '13 January, 2023' },
    { title: 'Biratnagar Super Kings defeats Janakpur Royals to book a place in finals', date: '23 January, 2023' },
];

const defaultClub = {
    title: 'Mon espace club',
    subtitle: 'Espace membres officiel de votre organisation sportive.',
    heroTitle: "Bienvenue dans votre espace club",
    heroDescription:
        "Retrouvez l’ensemble de vos informations : planning d’entraînement, professeurs, actualités et services réservés aux membres.",
};

const MembersPage: React.FC = () => {
    const [selectedTeacher, setSelectedTeacher] = React.useState<Teacher | null>(null);
    const [selectedSlot, setSelectedSlot] = React.useState<Slot | null>(null);
    const [disciplineFilter, setDisciplineFilter] = React.useState<'all' | Slot['discipline']>('all');
    const [lastTeacherName, setLastTeacherName] = React.useState<string | null>(null);
    const [searchDiscipline, setSearchDiscipline] = React.useState('');
    const todayDay = React.useMemo<DayName>(() => getTodayDayName(), []);
    const [userRatings, setUserRatings] = React.useState<Record<string, number>>(() => {
        if (typeof window === 'undefined') return {};
        try {
            const stored = window.localStorage.getItem('club.teacherRatings');
            if (!stored) return {};
            const parsed = JSON.parse(stored) as Record<string, number>;
            return parsed;
        } catch (error) {
            console.error('Impossible de charger les notes enregistrées', error);
            return {};
        }
    });
    const [clubMetadata, setClubMetadata] = React.useState(() => {
        if (typeof window === 'undefined') return defaultClub;
        try {
            const raw = window.localStorage.getItem('selectedOrganisation');
            if (!raw) return defaultClub;
            const parsed = JSON.parse(raw) as { name?: string; subtitle?: string; description?: string } | null;
            if (!parsed) return defaultClub;
            return {
                title: parsed.name ?? defaultClub.title,
                subtitle: parsed.subtitle ?? defaultClub.subtitle,
                heroTitle: parsed.name ? `Bienvenue chez ${parsed.name}` : defaultClub.heroTitle,
                heroDescription: parsed.description ?? defaultClub.heroDescription,
            };
        } catch (error) {
            console.error('Impossible de charger les informations du club actif', error);
            return defaultClub;
        }
    });

    const getTeacherByName = (name: string): Teacher | undefined =>
        teachers.find((t) => t.name.toLowerCase() === name.toLowerCase());

    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSelectedTeacher(null);
                setSelectedSlot(null);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        const storedTeacher = window.localStorage.getItem('club.lastTeacher');
        if (storedTeacher) {
            setLastTeacherName(storedTeacher);
        }
    }, []);

    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            window.localStorage.setItem('club.teacherRatings', JSON.stringify(userRatings));
        } catch (error) {
            console.error('Impossible de sauvegarder les notes', error);
        }
    }, [userRatings]);

    React.useEffect(() => {
        const handleOrganisationChange = () => {
            if (typeof window === 'undefined') return;
            try {
                const raw = window.localStorage.getItem('selectedOrganisation');
                if (!raw) {
                    setClubMetadata(defaultClub);
                    return;
                }
                const parsed = JSON.parse(raw) as { name?: string; subtitle?: string; description?: string } | null;
                if (!parsed) {
                    setClubMetadata(defaultClub);
                    return;
                }
                setClubMetadata({
                    title: parsed.name ?? defaultClub.title,
                    subtitle: parsed.subtitle ?? defaultClub.subtitle,
                    heroTitle: parsed.name ? `Bienvenue chez ${parsed.name}` : defaultClub.heroTitle,
                    heroDescription: parsed.description ?? defaultClub.heroDescription,
                });
            } catch (error) {
                console.error('Impossible de mettre à jour les informations du club actif', error);
                setClubMetadata(defaultClub);
            }
        };

        handleOrganisationChange();
        window.addEventListener('storage', handleOrganisationChange);
        window.addEventListener('organisation:updated', handleOrganisationChange);
        return () => {
            window.removeEventListener('storage', handleOrganisationChange);
            window.removeEventListener('organisation:updated', handleOrganisationChange);
        };
    }, []);

    const filteredTodaySchedule = React.useMemo(() => {
        return mockSchedule.filter((slot) => {
            if (slot.day !== todayDay) return false;
            const matchDiscipline = disciplineFilter === 'all' || slot.discipline === disciplineFilter;
            const matchSearch =
                searchDiscipline.trim().length === 0 ||
                slot.discipline.toLowerCase().includes(searchDiscipline.trim().toLowerCase()) ||
                slot.coach.toLowerCase().includes(searchDiscipline.trim().toLowerCase());
            return matchDiscipline && matchSearch;
        });
    }, [disciplineFilter, searchDiscipline, todayDay]);

    const getRatingSummary = React.useCallback(
        (teacherName: string): RatingSummary => {
            const base = baseTeacherRatings[teacherName] ?? { average: 0, count: 0 };
            const userRating = userRatings[teacherName];
            if (!userRating) {
                return { average: base.average, count: base.count };
            }
            const total = base.average * base.count + userRating;
            const count = base.count + 1;
            return {
                average: count > 0 ? total / count : 0,
                count,
                userRating,
            };
        },
        [userRatings]
    );

    const handleRateTeacher = React.useCallback((teacherName: string, rating: number) => {
        setUserRatings((prev) => ({
            ...prev,
            [teacherName]: rating,
        }));
    }, []);

    const lastTeacher = React.useMemo(() => {
        if (!lastTeacherName) return null;
        return getTeacherByName(lastTeacherName);
    }, [lastTeacherName]);

    const handleSelectTeacher = (teacher: Teacher) => {
        setSelectedTeacher(teacher);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem('club.lastTeacher', teacher.name);
        }
        setLastTeacherName(teacher.name);
    };

    const scheduleDisciplines = React.useMemo(
        () =>
            Array.from(
                new Set(
                    mockSchedule
                        .filter((slot) => slot.day === todayDay)
                        .map((slot) => slot.discipline)
                )
            ),
        [todayDay]
    );

    return (
        <Layout title={clubMetadata.title} subtitle={clubMetadata.subtitle} mode="club">
            {/* Hero */}
            <section className="mb-10">
                <div className="relative w-full h-64 sm:h-80 lg:h-96 overflow-hidden rounded-2xl shadow-lg">
                    <ImgWithFallback
                        src={unsplash(1600, 900, 'brazilian jiu jitsu,bjj,grappling,training,dojo', 'hero')}
                        alt="Hero sport"
                        className="absolute inset-0 w-full h-full object-cover scale-[1.02]"
                        width={1600}
                        height={900}
                        seed="hero"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-black/20 to-transparent" />
                    <div className="absolute -inset-2 pointer-events-none rounded-[24px] bg-gradient-to-tr from-blue-500/10 via-transparent to-fuchsia-500/10 blur-2xl" />
                    <div className="absolute inset-0 flex items-center">
                        <div className="px-6 sm:px-8 lg:px-12 max-w-4xl">
                            <h2 className="text-white text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight drop-shadow">
                                {clubMetadata.heroTitle}
                            </h2>
                            <p className="mt-4 text-white/90 text-sm sm:text-base max-w-2xl leading-6 sm:leading-7">
                                {clubMetadata.heroDescription}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Résumé & actions */}
            <section className="mt-10">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className={`lg:col-span-2 rounded-3xl ${themeCard} p-6`}>
                        <p className="text-xs uppercase tracking-[0.2em] text-blue-500 dark:text-blue-300 font-semibold">Vue d’ensemble</p>
                        <h3 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">Un club vivant & inclusif</h3>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-6">
                            Consultez vos créneaux, retrouvez vos coachs et découvrez les prochaines actualités du club. Utilisez les filtres pour accéder rapidement à l’information qui vous intéresse.
                        </p>
                        <div className="mt-5 flex flex-wrap gap-3">
                            <Link
                                to="/club/events"
                                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400"
                            >
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
                                </span>
                                Voir les événements
                            </Link>
                            <Link
                                to="#"
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition hover:border-blue-200 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400/50"
                            >
                                Plan du dojo
                            </Link>
                            <Link
                                to="/club/loyalty"
                                className="inline-flex items-center gap-2 rounded-full border border-indigo-200 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-300 shadow-sm transition hover:bg-indigo-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400/70"
                            >
                                Programme de fidélité
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                    <div className="rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-indigo-900/40 dark:to-indigo-950/40 p-6 shadow-sm border border-blue-100/80 dark:border-indigo-800/60">
                        <div className="text-xs uppercase font-semibold tracking-[0.2em] text-slate-600 dark:text-slate-300">Aujourd’hui</div>
                        <div className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{filteredTodaySchedule.length}</div>
                        <p className="text-sm text-slate-600 dark:text-slate-300">Créneaux disponibles</p>
                        <div className="mt-4 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                            <div>
                                Jour : <span className="font-semibold text-slate-900 dark:text-white">{todayDay}</span>
                            </div>
                            <div>
                                Filtre discipline : <span className="font-semibold text-slate-900 dark:text-white">{disciplineFilter === 'all' ? 'Toutes' : disciplineFilter}</span>
                            </div>
                        </div>
                    </div>
                    <div className={`rounded-3xl ${themeCard} p-6 flex flex-col gap-4`}>
                        <div>
                            <div className="text-xs uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-300 font-semibold">Dernier coach consulté</div>
                            {lastTeacher ? (
                                <div className="mt-3 flex items-center gap-3">
                                    <ImgWithFallback
                                        src={unsplash(56, 56, lastTeacher.query, `last-teacher-${lastTeacher.name}`)}
                                        alt={lastTeacher.name}
                                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white dark:ring-slate-800 shadow"
                                        width={56}
                                        height={56}
                                        seed={`last-teacher-${lastTeacher.name}`}
                                    />
                                    <div>
                                        <div className="text-sm font-semibold text-slate-900 dark:text-white">{lastTeacher.name}</div>
                                        <div className="text-xs text-slate-600 dark:text-slate-400">{lastTeacher.roles}</div>
                                    </div>
                                </div>
                            ) : (
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Consultez un coach pour le retrouver ici plus tard.</p>
                            )}
                        </div>
                        <button
                            type="button"
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400"
                            onClick={() => {
                                if (lastTeacher) {
                                    setSelectedTeacher(lastTeacher);
                                } else if (teachers.length) {
                                    handleSelectTeacher(teachers[0]);
                                }
                            }}
                        >
                            Voir le profil coach
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </section>

            {/* À propos du club */}
            <section className="mt-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className={`lg:col-span-1 rounded-3xl ${themeCard} p-6`}>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">À propos du club</h3>
                        <p className="mt-2 text-gray-600 dark:text-slate-300 text-sm">
                            Notre association favorise la découverte, l’apprentissage et le partage autour des disciplines
                            de combat et des activités culturelles. Ouvert à tous, du débutant au confirmé.
                        </p>
                    </div>
                    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="rounded-xl ring-1 ring-gray-200/60 dark:ring-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur p-5 shadow-sm">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">300+</div>
                            <div className="text-sm text-gray-600 dark:text-slate-300">Adhérents</div>
                        </div>
                        <div className="rounded-xl ring-1 ring-gray-200/60 dark:ring-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur p-5 shadow-sm">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">25</div>
                            <div className="text-sm text-gray-600 dark:text-slate-300">Créneaux hebdo</div>
                        </div>
                        <div className="rounded-xl ring-1 ring-gray-200/60 dark:ring-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur p-5 shadow-sm">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">10+</div>
                            <div className="text-sm text-gray-600 dark:text-slate-300">Événements/an</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Partenaires */}
            <section className="mt-12">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Partenaires</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="h-14 rounded-xl ring-1 ring-gray-200/60 dark:ring-slate-700 bg-white/70 dark:bg-slate-900/70 backdrop-blur flex items-center justify-center">
                            <ImgWithFallback
                                src={unsplash(160, 56, 'logo,minimal,brand,monochrome', `partner-${i}`)}
                                alt={`Partenaire ${i + 1}`}
                                className="h-8 w-auto object-contain opacity-70"
                                width={160}
                                height={56}
                                seed={`partner-${i}`}
                            />
                        </div>
                    ))}
                </div>
            </section>

            {/* Appel à l’action */}
            <section className="mt-12 mb-10">
                <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 bg-gradient-to-tr from-blue-600 via-indigo-600 to-fuchsia-600 text-white">
                    <div className="absolute -inset-1 opacity-20 pointer-events-none bg-[radial-gradient(60%_60%_at_100%_0%,white,transparent)]" />
                    <div className="relative">
                        <h3 className="text-2xl font-semibold">Rejoindre l’association</h3>
                        <p className="mt-2 text-white/90 text-sm max-w-2xl">
                            Découvrez nos cours, nos professeurs et notre communauté. Première séance d’essai gratuite.
                        </p>
                        <div className="mt-4">
                            <Link to="#">
                                <span className="inline-flex items-center rounded-lg bg-white text-blue-700 px-4 py-2 text-sm font-semibold hover:bg-white/90 transition">
                                    Devenir membre
                                </span>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Planning du jour */}
            <section className={`${themeCard} rounded-3xl p-6 sm:p-8 shadow-lg border border-white/60 dark:border-slate-800 space-y-6`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Planning du jour</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-300">Affinez votre recherche via les filtres pour trouver rapidement votre créneau.</p>
                    </div>
                    <Link to="/club/planning" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors">
                        Voir tout
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 font-semibold">{todayDay.charAt(0)}</span>
                        Aujourd’hui : {todayDay}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setDisciplineFilter('all')}
                            className={`rounded-full px-4 py-2 text-xs font-medium transition shadow-sm border ${disciplineFilter === 'all'
                                ? 'bg-indigo-500 text-white border-indigo-500'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-200 hover:text-indigo-600'
                                }`}
                        >
                            Toutes les disciplines
                        </button>
                        {scheduleDisciplines.map((discipline) => (
                            <button
                                key={discipline}
                                type="button"
                                onClick={() => setDisciplineFilter(discipline)}
                                className={`rounded-full px-4 py-2 text-xs font-medium transition shadow-sm border ${disciplineFilter === discipline
                                    ? 'bg-slate-900 text-white border-slate-900'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
                                    }`}
                            >
                                {discipline}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="relative">
                    <label htmlFor="planning-search" className="sr-only">
                        Rechercher un créneau
                    </label>
                    <input
                        id="planning-search"
                        type="search"
                        value={searchDiscipline}
                        onChange={(event) => setSearchDiscipline(event.target.value)}
                        placeholder="Rechercher un créneau par coach, horaire ou discipline…"
                        className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40 shadow-sm transition"
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

                {filteredTodaySchedule.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 py-12 flex flex-col items-center justify-center text-center shadow-inner">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 shadow-sm mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM9 8a1 1 0 1 0 0 2h2a1 1 0 1 1 0 2H9a1 1 0 1 0 0 2h.5a1 1 0 0 1 .832.445l.884 1.326a.5.5 0 0 0 .832-.555L12 15h-1a1 1 0 0 1 0-2h2a1 1 0 1 0 0-2h-2a1 1 0 1 1 0-2h1a1 1 0 0 0 0-2H9Z" />
                            </svg>
                        </div>
                        <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Aucun créneau ne correspond à votre recherche</h4>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-sm">
                            Modifiez vos filtres ou élargissez votre recherche pour afficher d’autres résultats.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {filteredTodaySchedule.map((s, idx) => (
                            <button
                                type="button"
                                key={`${s.discipline}-${idx}`}
                                onClick={() => setSelectedSlot(s)}
                                className="text-left bg-white/80 backdrop-blur rounded-xl ring-1 ring-gray-200/60 shadow-sm p-5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:ring-blue-300/60 h-28 flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                            >
                                <div className="text-[11px] uppercase tracking-wide text-gray-500">{s.day}</div>
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center min-w-0">
                                        <div className="mr-3 shrink-0">
                                            <ImgWithFallback
                                                src={unsplash(40, 40, getTeacherByName(s.coach)?.query ?? 'bjj coach,portrait', `slot-${idx}-${s.coach}`)}
                                                alt={s.coach}
                                                className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200/80"
                                                width={40}
                                                height={40}
                                                seed={`slot-${idx}-${s.coach}`}
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">{s.discipline}</div>
                                            <div className="text-xs text-gray-600 truncate max-w-[160px]">{s.coach}</div>
                                        </div>
                                    </div>
                                    <div className="text-right min-w-0">
                                        <div className="text-sm font-semibold text-gray-900 whitespace-nowrap">{s.time}</div>
                                        <div className="text-xs text-gray-600 truncate max-w-[140px]">{s.location}</div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </section>

            {/* Disciplines */}
            <section className="mb-12">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Disciplines</h3>
                    <Link to="/club/disciplines" className="text-sm text-blue-600 hover:text-blue-700 transition-colors">Voir tout</Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {disciplines.map((d, idx) => (
                        <div key={idx} className="group relative rounded-xl overflow-hidden shadow-md">
                            <ImgWithFallback
                                src={unsplash(900, 600, d.query, `discipline-${idx}`)}
                                alt={d.name}
                                className="w-full aspect-[3/2] object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                width={900}
                                height={600}
                                seed={`discipline-${idx}`}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-90" />
                            <div className="absolute inset-0 flex items-end p-5">
                                <span className="text-white font-semibold drop-shadow">{d.name}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Professeurs */}
            <section className="mb-12">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Professeurs</h3>
                    <Link to="/club/professeurs" className="text-sm text-blue-600 hover:text-blue-700 transition-colors">Voir tout</Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    {teachers.map((t, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectTeacher(t)}
                            className="text-left flex flex-col items-center text-center bg-white/70 dark:bg-slate-900/70 backdrop-blur rounded-xl ring-1 ring-gray-200/60 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:ring-blue-300/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                        >
                            <ImgWithFallback
                                src={unsplash(160, 160, t.query, `teacher-${idx}`)}
                                alt={t.name}
                                className="w-20 h-20 rounded-full object-cover mb-3"
                                width={160}
                                height={160}
                                seed={`teacher-${idx}`}
                            />
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{t.name}</div>
                            <div className="text-xs text-gray-600 dark:text-slate-400">{t.roles}</div>
                        </button>
                    ))}
                </div>
                {lastTeacher && (
                    <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-5 py-4 text-xs text-indigo-700 flex items-center gap-3">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500 text-white text-xs font-semibold">◎</span>
                        <div>
                            <p className="font-medium text-indigo-900">Vous avez récemment consulté {lastTeacher.name}</p>
                            <p className="text-indigo-600/70">Utilisez les cartes pour accéder à la fiche détaillée de vos coachs préférés.</p>
                        </div>
                    </div>
                )}
            </section>

            {/* Cours vidéo */}
            <section className="mb-12">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Cours vidéo</h3>
                    <Link to="/club/cours-video" className="text-sm text-blue-600 hover:text-blue-700 transition-colors">Voir toutes les vidéos</Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {videoLessons.map((lesson) => (
                        <article key={lesson.id} className="rounded-3xl overflow-hidden border border-white/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-sm ring-1 ring-gray-200/60 dark:ring-slate-800/60">
                            <div className="relative">
                                <video
                                    controls
                                    preload="metadata"
                                    poster={unsplash(900, 600, lesson.posterQuery, `lesson-${lesson.id}`)}
                                    className="w-full aspect-video object-cover"
                                >
                                    <source src={lesson.videoUrl} type="video/mp4" />
                                    Votre navigateur ne permet pas la lecture de cette vidéo.
                                </video>
                                <span className="absolute top-3 left-3 inline-flex items-center rounded-full bg-black/60 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                                    {lesson.duration}
                                </span>
                            </div>
                            <div className="p-5 space-y-3">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-indigo-600 font-medium">
                                        {lesson.discipline}
                                    </span>
                                    <span>•</span>
                                    <span>{lesson.teacher}</span>
                                </div>
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{lesson.title}</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{lesson.description}</p>
                                <div className="flex items-center justify-between text-xs text-indigo-600 font-medium">
                                    <button type="button" className="inline-flex items-center gap-1 hover:text-indigo-700">
                                        Revoir la leçon
                                    </button>
                                    <button type="button" className="text-slate-400 hover:text-indigo-500">Ajouter aux favoris</button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            {/* Actualités */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Actualités</h3>
                    <Link to="#" className="text-sm text-blue-600 hover:text-blue-700 transition-colors">Voir tout</Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {news.map((n, idx) => (
                        <article key={idx} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-xl ring-1 ring-gray-200/60 shadow-sm overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-blue-300/60">
                            <ImgWithFallback
                                src={unsplash(600, 350, 'brazilian jiu jitsu,bjj,competition,dojo,mats', `news-${idx}`)}
                                alt={n.title}
                                className="w-full aspect-video object-cover"
                                width={600}
                                height={350}
                                seed={`news-${idx}`}
                            />
                            <div className="p-5">
                                <div className="text-xs text-gray-500 dark:text-slate-400 mb-2">{n.date}</div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {n.title}
                                </h4>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
            {/* Modal Professeur */}
            <TeacherModal
                open={!!selectedTeacher}
                onClose={() => setSelectedTeacher(null)}
                teacher={selectedTeacher}
                getRatingSummary={getRatingSummary}
                onRate={handleRateTeacher}
            />
            {/* Modal Créneau */}
            <SlotModal
                open={!!selectedSlot}
                onClose={() => setSelectedSlot(null)}
                slot={selectedSlot}
                getTeacherByName={getTeacherByName}
                getRatingSummary={getRatingSummary}
            />
        </Layout>
    );
};

export default MembersPage;

const themeCard = 'bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-100 dark:border-slate-800 shadow-sm';
const themeAccentCard = 'bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-white/60 dark:border-slate-800 shadow-lg';
const themeMutebg = 'bg-white/70 dark:bg-slate-900/70';

const RatingStars: React.FC<{
    value: number;
    onSelect?: (rating: number) => void;
    interactive?: boolean;
    size?: 'sm' | 'md';
}> = ({ value, onSelect, interactive = false, size = 'md' }) => {
    const [hoverValue, setHoverValue] = React.useState<number | null>(null);
    const safeValue = Number.isFinite(value) ? Math.max(0, Math.min(5, value)) : 0;
    const displayValue = interactive && hoverValue !== null ? hoverValue : safeValue;
    const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

    const renderStar = (index: number) => {
        const fill = Math.max(0, Math.min(1, displayValue - index));
        const fillPercent = `${fill * 100}%`;
        const baseStar = (
            <span className="relative inline-flex text-gray-300">
                <svg
                    className={sizeClass}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M12 4.5 14.6 9l4.9.7-3.5 3.5.8 5-4.8-2.6L7.1 18l.8-5L4.4 9.7 9.3 9 12 4.5Z" />
                </svg>
                <span
                    className="absolute inset-0 overflow-hidden text-amber-400"
                    style={{ width: fillPercent }}
                    aria-hidden
                >
                    <svg className={sizeClass} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 4.5 14.6 9l4.9.7-3.5 3.5.8 5-4.8-2.6L7.1 18l.8-5L4.4 9.7 9.3 9 12 4.5Z" />
                    </svg>
                </span>
            </span>
        );

        if (!interactive) {
            return (
                <span key={index} className="inline-flex items-center">
                    {baseStar}
                </span>
            );
        }

        const ratingValue = index + 1;

        return (
            <button
                key={index}
                type="button"
                onClick={() => onSelect?.(ratingValue)}
                onMouseEnter={() => setHoverValue(ratingValue)}
                onFocus={() => setHoverValue(ratingValue)}
                className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-full"
                aria-label={`Attribuer ${ratingValue} étoile${ratingValue > 1 ? 's' : ''}`}
            >
                {baseStar}
            </button>
        );
    };

    return (
        <div
            className={`flex items-center gap-1 ${interactive ? 'cursor-pointer' : ''}`}
            onMouseLeave={() => setHoverValue(null)}
            onBlur={() => setHoverValue(null)}
        >
            {Array.from({ length: 5 }, (_, idx) => renderStar(idx))}
        </div>
    );
};


// Modal d’information professeur
const TeacherModal: React.FC<{
    open: boolean;
    onClose: () => void;
    teacher: Teacher | null;
    getRatingSummary: (name: string) => RatingSummary;
    onRate: (name: string, rating: number) => void;
}> = ({ open, onClose, teacher, getRatingSummary, onRate }) => {
    if (!open || !teacher) return null;
    const summary = getRatingSummary(teacher.name);
    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            {/* Dialog */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
                {/* Gradient border wrapper for a modern look */}
                <div className="w-full max-w-4xl p-[1px] rounded-3xl bg-gradient-to-tr from-blue-500/40 via-fuchsia-500/40 to-amber-400/40 shadow-2xl">
                    <div className="rounded-3xl bg-white/95 backdrop-blur-xl ring-1 ring-gray-200/50 overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-5">
                            {/* Visual side */}
                            <div className="relative md:col-span-2">
                                <ImgWithFallback
                                    src={unsplash(800, 800, teacher.query, `teacher-modal-${teacher.name}`)}
                                    alt={teacher.name}
                                    className="w-full h-56 md:h-full object-cover"
                                    width={800}
                                    height={800}
                                    seed={`teacher-modal-${teacher.name}`}
                                />
                                <div className="absolute inset-x-0 bottom-0 p-4">
                                    <span className="inline-flex items-center rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white ring-1 ring-white/20 backdrop-blur">
                                        Coach
                                    </span>
                                </div>
                            </div>
                            {/* Content side */}
                            <div className="md:col-span-3 p-6 md:p-8">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">{teacher.name}</h3>
                                        <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">{teacher.roles}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="ml-4 inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 transition"
                                        aria-label="Fermer"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-gray-500">
                                            <path fillRule="evenodd" d="M5.97 5.97a.75.75 0 0 1 1.06 0L12 10.94l4.97-4.97a.75.75 0 1 1 1.06 1.06L13.06 12l4.97 4.97a.75.75 0 1 1-1.06 1.06L12 13.06l-4.97 4.97a.75.75 0 0 1-1.06-1.06L10.94 12 5.97 7.03a.75.75 0 0 1 0-1.06z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                                {teacher.bio && <p className="mt-4 text-[15px] leading-6 text-gray-700 dark:text-slate-300">{teacher.bio}</p>}
                                <div className="mt-6 space-y-4">
                                    <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Note moyenne</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {summary.average.toFixed(1)} / 5 • {summary.count} avis
                                            </p>
                                        </div>
                                        <RatingStars value={summary.average} size="sm" />
                                    </div>
                                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-4">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Votre avis</p>
                                        <div className="mt-2 flex flex-wrap items-center gap-3">
                                            <RatingStars
                                                value={summary.userRating ?? 0}
                                                interactive
                                                size="md"
                                                onSelect={(rating) => onRate(teacher.name, rating)}
                                            />
                                            <span className="text-xs text-indigo-600/80">
                                                {summary.userRating
                                                    ? `Merci pour votre note (${summary.userRating}/5)`
                                                    : 'Cliquez pour attribuer une note à ce coach.'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {teacher.specialties?.length ? (
                                    <div className="mt-6">
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Spécialités</h4>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {teacher.specialties.map((s) => (
                                                <span key={s} className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200">
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                                {teacher.contact ? (
                                    <div className="mt-6 text-sm text-gray-600 dark:text-slate-300 space-y-1">
                                        {teacher.contact.email ? <div>Email: {teacher.contact.email}</div> : null}
                                        {teacher.contact.phone ? <div>Téléphone: {teacher.contact.phone}</div> : null}
                                        {teacher.contact.instagram ? <div>Instagram: {teacher.contact.instagram}</div> : null}
                                    </div>
                                ) : null}
                                <div className="mt-8 flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                    >
                                        Contacter
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
                                        onClick={onClose}
                                    >
                                        Fermer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Modal d’information créneau
const SlotModal: React.FC<{
    open: boolean;
    onClose: () => void;
    slot: Slot | null;
    getTeacherByName: (name: string) => Teacher | undefined;
    getRatingSummary: (name: string) => RatingSummary;
}> = ({ open, onClose, slot, getTeacherByName, getRatingSummary }) => {
    if (!open || !slot) return null;
    const teacher = getTeacherByName(slot.coach);
    const summary = getRatingSummary(slot.coach);
    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-xl p-[1px] rounded-2xl bg-gradient-to-tr from-blue-500/40 via-fuchsia-500/40 to-amber-400/40 shadow-2xl">
                    <div className="rounded-2xl bg-white/95 backdrop-blur-xl ring-1 ring-gray-200/50 overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-start justify-between">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Détail du créneau</h3>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="ml-4 inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 transition"
                                    aria-label="Fermer"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-gray-500">
                                        <path fillRule="evenodd" d="M5.97 5.97a.75.75 0 0 1 1.06 0L12 10.94l4.97-4.97a.75.75 0 1 1 1.06 1.06L13.06 12l4.97 4.97a.75.75 0 1 1-1.06 1.06L12 13.06l-4.97 4.97a.75.75 0 0 1-1.06-1.06L10.94 12 5.97 7.03a.75.75 0 0 1 0-1.06z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                            <div className="mt-4 flex items-start gap-4">
                                <ImgWithFallback
                                    src={unsplash(80, 80, teacher?.query ?? 'bjj coach,portrait', `slot-modal-${slot.coach}`)}
                                    alt={slot.coach}
                                    className="w-16 h-16 rounded-full object-cover ring-1 ring-gray-200/80"
                                    width={80}
                                    height={80}
                                    seed={`slot-modal-${slot.coach}`}
                                />
                                <div className="min-w-0">
                                    <div className="text-sm text-gray-600 dark:text-slate-300">{slot.day}</div>
                                    <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{slot.discipline}</div>
                                    <div className="text-sm text-gray-700 dark:text-slate-300">Avec {slot.coach}</div>
                                    <div className="mt-2 text-sm text-gray-500 dark:text-slate-400">
                                        Heure: <span className="font-medium text-gray-800 dark:text-white">{slot.time}</span>
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-slate-400">
                                        Lieu: <span className="font-medium text-gray-800 dark:text-white">{slot.location}</span>
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-slate-400">
                                        Ville: <span className="font-medium text-gray-800 dark:text-white">{slot.city}</span>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                                        <RatingStars value={summary.average} size="sm" />
                                        <span>
                                            {summary.average.toFixed(1)} ({summary.count} avis)
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex flex-wrap gap-3 justify-end">
                                <button
                                    type="button"
                                    className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
                                    onClick={onClose}
                                >
                                    Fermer
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                >
                                    S'inscrire
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

