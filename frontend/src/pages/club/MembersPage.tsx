import React from 'react';
import Layout from '../../components/layout/Layout';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { useCurrentOrganisation } from '../../hooks/useCurrentOrganisation';
import { newsArticles } from './NewsPage';

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

type UpcomingEvent = {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    type: 'stage' | 'competition' | 'decouverte';
    spotsLeft?: number;
};

const upcomingEvents: UpcomingEvent[] = [
    {
        id: 'evt-1',
        title: 'Stage compétition BJJ Adultes',
        date: 'Samedi 14 décembre',
        time: '14h00 - 17h30',
        location: 'Dojo Villeurbanne',
        type: 'stage',
        spotsLeft: 6,
    },
    {
        id: 'evt-2',
        title: 'Séance découverte “Premiers pas sur le tatami”',
        date: 'Mercredi 18 décembre',
        time: '18h30 - 20h00',
        location: 'Studio Croix-Rousse',
        type: 'decouverte',
        spotsLeft: 12,
    },
    {
        id: 'evt-3',
        title: 'Déplacement compétition régionale',
        date: 'Dimanche 5 janvier',
        time: 'Journée complète',
        location: 'Gymnase Gerland',
        type: 'competition',
    },
];

type Discipline = {
    name: string;
    query: string;
    description: string;
    benefits?: string[];
    schedule?: string;
    level?: string;
};

const disciplines: Discipline[] = [
    {
        name: 'Jiu-jitsu brésilien',
        query: 'brazilian jiu jitsu,bjj,grappling,rolling',
        description: 'Art martial brésilien axé sur le combat au sol et les techniques de soumission. Le Jiu-jitsu brésilien développe la technique, la stratégie et la confiance en soi.',
        benefits: ['Défense personnelle efficace', 'Amélioration de la condition physique', 'Développement mental et stratégique', 'Communauté bienveillante'],
        schedule: 'Lundi, Mercredi, Vendredi - 19h30',
        level: 'Tous niveaux',
    },
    {
        name: 'Luta Livre',
        query: 'brazilian jiu jitsu,bjj,grappling,training',
        description: 'Discipline de grappling sans kimono, privilégiant la vitesse et la fluidité. Idéale pour le combat libre et la préparation physique.',
        benefits: ['Techniques adaptées au combat libre', 'Conditionnement physique intense', 'Adaptabilité et réactivité', 'Préparation compétition'],
        schedule: 'Mardi, Jeudi - 20h00',
        level: 'Intermédiaire à avancé',
    },
    {
        name: 'Judo',
        query: 'brazilian jiu jitsu,bjj,grappling,dojo',
        description: 'Art martial japonais mettant l\'accent sur les projections et le contrôle au sol. Le Judo développe la discipline, le respect et la maîtrise technique.',
        benefits: ['Projections et techniques debout', 'Développement de la discipline', 'Amélioration de la coordination', 'Valeurs traditionnelles'],
        schedule: 'Jeudi - 12h15',
        level: 'Tous niveaux',
    },
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

const clubGalleryShots = [
    { id: 'shot-1', caption: 'Stage compétition', date: '8 mars', query: 'bjj competition training team photo' },
    { id: 'shot-2', caption: 'Session kids & parents', date: '2 mars', query: 'family sport dojo kids training' },
    { id: 'shot-3', caption: 'Open mat nocturne', date: '28 fév.', query: 'night training gym lights' },
    { id: 'shot-4', caption: 'Cours mobilité', date: '27 fév.', query: 'mobility training stretching class' },
    { id: 'shot-5', caption: 'Atelier no-gi', date: '25 fév.', query: 'nogi grappling training mat' },
    { id: 'shot-6', caption: 'Vie du dojo', date: '24 fév.', query: 'dojo lifestyle team photo' }
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

const MembersPage: React.FC = () => {
    const { metadata: clubMetadata, role: accountRole } = useCurrentOrganisation();
    const navigate = useNavigate();
    const [selectedTeacher, setSelectedTeacher] = React.useState<Teacher | null>(null);
    const [selectedSlot, setSelectedSlot] = React.useState<Slot | null>(null);
    const [selectedDiscipline, setSelectedDiscipline] = React.useState<Discipline | null>(null);
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
    const getTeacherByName = (name: string): Teacher | undefined =>
        teachers.find((t) => t.name.toLowerCase() === name.toLowerCase());

    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSelectedTeacher(null);
                setSelectedSlot(null);
                setSelectedDiscipline(null);
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

    if (accountRole === 'coach') {
        return (
            <Layout
                title="Espace coach"
                subtitle="Gérez vos créneaux, coachings privés et interactions avec les clubs."
                mode="club"
            >
                <CoachExperienceView metadata={clubMetadata} />
            </Layout>
        );
    }

    if (accountRole === 'freelance') {
        return (
            <Layout
                title="Studio indépendant"
                subtitle="Partagez vos disponibilités privées et faites grandir votre clientèle."
                mode="club"
            >
                <FreelanceExperienceView metadata={clubMetadata} />
            </Layout>
        );
    }

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
                        <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedDiscipline(d)}
                            className="group relative rounded-xl overflow-hidden shadow-md cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        >
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
                        </button>
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

            {/* Événements à venir */}
            <section className="mb-12">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Événements à venir</h3>
                    <Link to="/club/events" className="text-sm text-blue-600 hover:text-blue-700 transition-colors">
                        Voir tous les événements
                    </Link>
                </div>
                {upcomingEvents.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 dark:bg-slate-900/70 py-6 px-6 text-center text-sm text-slate-600 dark:text-slate-300">
                        Aucun événement n’est encore programmé. Revenez bientôt pour découvrir les prochains stages, compétitions et soirées du club.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {upcomingEvents.map((event) => (
                            <article
                                key={event.id}
                                className="relative rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur ring-1 ring-slate-200/70 dark:ring-slate-700 shadow-sm p-5 flex flex-col gap-3"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">
                                            {event.type === 'stage'
                                                ? 'Stage'
                                                : event.type === 'competition'
                                                ? 'Compétition'
                                                : 'Découverte'}
                                        </p>
                                        <h4 className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            {event.title}
                                        </h4>
                                    </div>
                                </div>
                                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                                    <div>{event.date}</div>
                                    <div>{event.time}</div>
                                    <div className="text-slate-500">{event.location}</div>
                                </div>
                                {typeof event.spotsLeft === 'number' && (
                                    <div className="mt-1 text-[11px] font-medium text-emerald-600">
                                        {event.spotsLeft} places restantes
                                    </div>
                                )}
                                <div className="mt-4 flex items-center justify-between">
                                    <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200">
                                        Proposé par votre club
                                    </span>
                                    <Link
                                        to="/club/events"
                                        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                                    >
                                        Détails
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {/* Galerie photos */}
            <section className="mb-12">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Photos récentes</h3>
                    <Link to="/club/galerie" className="text-sm text-blue-600 hover:text-blue-700 transition-colors">Ouvrir la galerie</Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {clubGalleryShots.map((shot, idx) => (
                        <figure key={shot.id} className="relative overflow-hidden rounded-3xl shadow-md border border-white/40 bg-white/40 dark:bg-slate-900/40 backdrop-blur">
                            <ImgWithFallback
                                src={unsplash(900, 600, shot.query, `gallery-${idx}`)}
                                alt={shot.caption}
                                className="w-full aspect-[4/3] object-cover"
                                width={900}
                                height={600}
                                seed={`gallery-${idx}`}
                            />
                            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 text-white">
                                <div className="text-xs uppercase tracking-[0.3em] text-white/70">{shot.date}</div>
                                <div className="text-sm font-semibold">{shot.caption}</div>
                            </figcaption>
                        </figure>
                    ))}
                </div>
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
                    <Link to="/club/actualites" className="text-sm text-blue-600 hover:text-blue-700 transition-colors">Voir tout</Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {newsArticles.slice(0, 4).map((article) => (
                        <article
                            key={article.id}
                            onClick={() => navigate(`/club/actualites/${article.id}`)}
                            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-xl ring-1 ring-gray-200/60 shadow-sm overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-blue-300/60 cursor-pointer"
                        >
                            <ImgWithFallback
                                src={unsplash(600, 350, article.imageQuery, article.id)}
                                alt={article.title}
                                className="w-full aspect-video object-cover"
                                width={600}
                                height={350}
                                seed={article.id}
                            />
                            <div className="p-5">
                                <div className="text-xs text-gray-500 dark:text-slate-400 mb-2">{article.date}</div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
                                    {article.title}
                                </h4>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
            {/* Modal Discipline */}
            <DisciplineModal
                open={!!selectedDiscipline}
                discipline={selectedDiscipline}
                onClose={() => setSelectedDiscipline(null)}
            />
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

const DisciplineModal: React.FC<{
    open: boolean;
    discipline: Discipline | null;
    onClose: () => void;
}> = ({ open, discipline, onClose }) => {
    if (!open || !discipline) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
            <div className="absolute inset-0" onClick={onClose} role="presentation" />
            <div className="relative max-w-2xl w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden ring-1 ring-slate-100 dark:ring-slate-800">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center text-sm font-semibold hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                    ✕
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                    <div className="relative">
                        <ImgWithFallback
                            src={unsplash(900, 900, discipline.query, `discipline-modal-${discipline.name}`)}
                            alt={discipline.name}
                            className="w-full h-full object-cover md:rounded-l-3xl"
                            width={900}
                            height={900}
                            seed={`discipline-modal-${discipline.name}`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-5 left-5 right-5 text-white">
                            <p className="text-xs uppercase tracking-[0.3em] text-white/70 mb-1">{discipline.level ?? 'Tous niveaux'}</p>
                            <h3 className="text-2xl font-semibold">{discipline.name}</h3>
                            <p className="text-sm text-white/80 mt-2">{discipline.schedule}</p>
                        </div>
                    </div>
                    <div className="p-6 space-y-4 flex flex-col">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 font-semibold">À propos</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                                {discipline.description}
                            </p>
                        </div>
                        {discipline.benefits?.length ? (
                            <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 font-semibold mb-2">Pourquoi essayer</p>
                                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                                    {discipline.benefits.map((benefit) => (
                                        <li key={benefit} className="flex items-start gap-2">
                                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                            <span>{benefit}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}
                        <div className="mt-auto">
                            <Link
                                to={{
                                    pathname: '/club/planning',
                                    search: discipline?.name ? `?discipline=${encodeURIComponent(discipline.name)}` : ''
                                }}
                                state={discipline?.name ? { filterDiscipline: discipline.name } : undefined}
                                onClick={onClose}
                            >
                                <Button className="w-full justify-center">
                                    Voir le planning {discipline?.name ? `(${discipline.name})` : ''}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CoachExperienceView: React.FC<{ metadata: { title: string; subtitle: string; heroTitle: string; heroDescription: string } }> = ({ metadata }) => {
    const coachStats = [
        { label: 'Créneaux cette semaine', value: '18', subLabel: '+3 vs sem. dernière' },
        { label: 'Cours privés à venir', value: '6', subLabel: '2 en ligne' },
        { label: 'Nouveaux messages', value: '4', subLabel: 'Clubs & élèves' },
        { label: 'Note moyenne', value: '4.8', subLabel: '42 avis' },
    ];

    const upcomingSlots = [
        {
            id: 'slot-1',
            club: 'Gracie Nova Paris',
            date: 'Mercredi 15 janvier',
            time: '18:00 - 19:30',
            type: 'collectif',
            status: 'confirmé',
            participants: 14,
        },
        {
            id: 'slot-2',
            club: 'Cours privé - Sophie',
            date: 'Jeudi 16 janvier',
            time: '12:30 - 13:30',
            type: 'privé',
            status: 'confirmé',
            location: 'À domicile - Paris 11e',
        },
        {
            id: 'slot-3',
            club: 'Stage découverte - Club Lyon Est',
            date: 'Samedi 18 janvier',
            time: '09:00 - 12:00',
            type: 'stage',
            status: 'en attente',
            actionRequired: true,
        },
    ];

    return (
        <div className="space-y-10">
            <section className="rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white shadow-xl p-8 relative overflow-hidden">
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,_#fff1,_transparent_70%)]" />
                <div className="relative flex flex-col gap-6">
                    <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-white/70 font-semibold">Mode Coach actif</p>
                        <h1 className="mt-3 text-3xl sm:text-4xl font-semibold leading-tight">
                            {metadata.heroTitle}
                        </h1>
                        <p className="mt-3 text-sm sm:text-base text-white/85 max-w-3xl">
                            {metadata.heroDescription}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {coachStats.map((stat) => (
                            <div
                                key={stat.label}
                                className="rounded-2xl bg-white/10 backdrop-blur p-4 border border-white/10 shadow-sm"
                            >
                                <p className="text-xs uppercase tracking-wide text-white/70">{stat.label}</p>
                                <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
                                <p className="text-[11px] text-white/80">{stat.subLabel}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-semibold">À propos du club</p>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{metadata.title}</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{metadata.subtitle}</p>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-3">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Discipline phare</p>
                            <p className="font-semibold text-slate-900 dark:text-white">Jiu-jitsu & Grappling</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-3">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Contact référent</p>
                            <p className="font-semibold text-slate-900 dark:text-white">Yuki Tanaka</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-semibold">Infos pratiques</p>
                    <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
                        <li>📍 Adresse : 42 rue des Arts Martiaux, 69004 Lyon</li>
                        <li>🕒 Accès salle : 07:00 - 23:00</li>
                        <li>💌 Contact : contact@club-gracie.fr</li>
                        <li>📱 Numéro d’urgence : 06 70 90 12 34</li>
                    </ul>
                </div>
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-semibold">À suivre</p>
                    <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                        <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-200">
                            Stage compétition - Dimanche 26 Janvier • réponse attendue
                        </div>
                        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-200">
                            Nouveau créneau privé validé - Mardi 14h, visio
                        </div>
                        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-200">
                            Club en congés du 21 au 24 février
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Prochains créneaux</h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Confirmez vos créneaux en attente et visualisez vos cours privés.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link to="/coach/planning">
                                <Button size="sm" mode="club">Voir mon planning</Button>
                            </Link>
                            <Link to="/coach/planning">
                                <Button variant="outline" size="sm" mode="club">Créer un créneau privé</Button>
                            </Link>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {upcomingSlots.map((slot) => (
                            <div
                                key={slot.id}
                                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap gap-4 items-center justify-between"
                            >
                                <div className="flex-1 min-w-[220px]">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{slot.club}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {slot.date} • {slot.time}
                                    </p>
                                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 text-indigo-600 px-2 py-0.5">
                                            {slot.type}
                                        </span>
                                        {slot.participants ? (
                                            <span>{slot.participants} participants</span>
                                        ) : null}
                                        {slot.location ? <span>{slot.location}</span> : null}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {slot.status === 'en attente' && slot.actionRequired ? (
                                        <>
                                            <Button variant="outline" size="sm" mode="club">
                                                Accepter
                                            </Button>
                                            <Button variant="outline" size="sm" mode="club" className="text-red-600 border-red-200 hover:bg-red-50">
                                                Refuser
                                            </Button>
                                        </>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-600 px-3 py-1 text-xs font-semibold">
                                            Confirmé
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Actions rapides</h3>
                    <div className="space-y-3">
                        <QuickCoachAction
                            title="Mettre à jour mon profil public"
                            description="Photo, bio, tarifs, disponibilités"
                            to="/coach/profile"
                        />
                        <QuickCoachAction
                            title="Répondre aux clubs"
                            description="Demandes de stages, offres en attente"
                            to="/coach/applications"
                        />
                        <QuickCoachAction
                            title="Suivre mes rémunérations"
                            description="Revenus, paiements, factures"
                            to="/coach/billing"
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

const FreelanceExperienceView: React.FC<{ metadata: { title: string; subtitle: string; heroTitle: string; heroDescription: string } }> = ({ metadata }) => {
    const freelanceStats = [
        { label: 'Revenus prévisionnels', value: '1 460 €', detail: '+12% vs mois dernier', tone: 'emerald' },
        { label: 'Demandes actives', value: '5', detail: '3 clients + 2 clubs', tone: 'sky' },
        { label: 'Note moyenne', value: '4.9 / 5', detail: '86 avis vérifiés', tone: 'amber' },
    ];

    const privateRequests = [
        {
            id: 'req-1',
            client: 'Sophie L.',
            format: 'Visio 60 min',
            need: 'Préparation concours sécurité',
            date: 'Vendredi 17 janv. • 19h30',
            budget: '75 €',
            status: 'new',
        },
        {
            id: 'req-2',
            client: 'Club Gym Nice',
            format: 'Stage 1/2 journée',
            need: 'Initiation mobilité & stretching',
            date: 'Dimanche 26 janv.',
            budget: '350 €',
            status: 'club',
        },
        {
            id: 'req-3',
            client: 'Marc & Léa',
            format: 'Coaching duo à domicile',
            need: 'Pilates & respiration',
            date: 'Samedi 18 janv. • 10h',
            budget: '120 €',
            status: 'pending',
        },
    ];

    const publishedAvailabilities = [
        { id: 'av-1', label: 'Visio express', window: 'Tous les jours • 07h30', visibility: 'Public IKIVIO' },
        { id: 'av-2', label: 'Créneau à domicile', window: 'Mercredi & Vendredi • 20h', visibility: 'Clients validés' },
        { id: 'av-3', label: 'Format entreprise', window: 'Sur demande • 90 min', visibility: 'Clubs/entreprises' },
    ];

    const upcomingPrivates = [
        { id: 'next-1', title: 'Cours visio - Elsa', info: 'Jeudi 16 janv. • 12h', location: 'Zoom', status: 'confirmé' },
        { id: 'next-2', title: 'Coaching mobilité - Maison Mireille', info: 'Vendredi 17 janv. • 18h', location: 'À domicile • Lyon 3e', status: 'confirmé' },
        { id: 'next-3', title: 'Stage cardio doux', info: 'Samedi 18 janv. • 09h', location: 'Studio Flow & Co', status: 'à confirmer' },
    ];

    const toolkitLinks = [
        { title: 'Mettre à jour mon profil public', description: 'Photo, disciplines, tarifs packs', to: '/coach/profile' },
        { title: 'Publier un nouveau créneau', description: 'Visio, à domicile, mini stage', to: '/coach/planning' },
        { title: 'Répondre aux messages', description: 'Clubs, élèves, suivis automatiques', to: '/coach/messages' },
    ];

    const testimonials = [
        {
            id: 'avis-1',
            author: 'Lucile & Amaury',
            content: '“Séances visio hyper structurées, nous avons enfin un rythme d’entretien qui tient dans notre agenda chargé.”',
            rating: 5,
        },
        {
            id: 'avis-2',
            author: 'Studio Move Lyon',
            content: '“Stage mobilité très apprécié par nos adhérents. Facile à planifier et paiement automatisé.”',
            rating: 5,
        },
    ];

    return (
        <div className="space-y-10">
            <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-sky-50 p-8 shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_70%)] pointer-events-none" />
                <div className="relative space-y-6">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-sky-500 font-semibold">Coach indépendant</p>
                        <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-slate-900">{metadata.heroTitle}</h1>
                        <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-3xl">{metadata.heroDescription}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {freelanceStats.map((stat) => (
                            <div
                                key={stat.label}
                                className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur px-4 py-5 shadow-sm"
                            >
                                <p className="text-xs uppercase tracking-wide text-slate-500">{stat.label}</p>
                                <p className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</p>
                                <p className={`text-xs ${stat.tone === 'emerald' ? 'text-emerald-600' : stat.tone === 'sky' ? 'text-sky-600' : 'text-amber-600'}`}>
                                    {stat.detail}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Demandes privées</p>
                            <h2 className="text-lg font-semibold text-slate-900">Clients et clubs intéressés</h2>
                        </div>
                        <Link to="/coach/messages">
                            <Button size="sm" mode="club">
                                Répondre maintenant
                            </Button>
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {privateRequests.map((request) => (
                            <div
                                key={request.id}
                                className="rounded-2xl border border-slate-100 bg-slate-50 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">{request.client}</p>
                                    <p className="text-xs text-slate-500">{request.format} • {request.date}</p>
                                    <p className="mt-2 text-sm text-slate-600">{request.need}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-700 bg-white rounded-full px-3 py-1 border border-slate-200">{request.budget}</span>
                                    <Button size="sm" variant="outline" mode="club">
                                        Accepter
                                    </Button>
                                    <Button size="sm" variant="outline" mode="club" className="text-slate-500 border-slate-200">
                                        Voir
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Disponibilités publiées</p>
                    <div className="space-y-3">
                        {publishedAvailabilities.map((availability) => (
                            <div key={availability.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                <p className="text-sm font-semibold text-slate-900">{availability.label}</p>
                                <p className="text-xs text-slate-500">{availability.window}</p>
                                <p className="mt-2 text-[11px] uppercase tracking-wide text-slate-500">{availability.visibility}</p>
                            </div>
                        ))}
                    </div>
                    <Link to="/coach/planning">
                        <Button mode="club" className="w-full">
                            Publier un créneau
                        </Button>
                    </Link>
                </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">Prochains coachings privés</h3>
                        <Link to="/coach/planning" className="text-sm text-indigo-600 font-semibold">
                            Ouvrir le planning
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {upcomingPrivates.map((slot) => (
                            <div key={slot.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">{slot.title}</p>
                                    <p className="text-xs text-slate-500">{slot.info}</p>
                                    <p className="text-xs text-slate-500">{slot.location}</p>
                                </div>
                                <span className={`text-xs font-semibold rounded-full px-3 py-1 ${slot.status === 'confirmé' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {slot.status === 'confirmé' ? 'Confirmé' : 'À confirmer'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900">Boîte à outils</h3>
                    <div className="space-y-3">
                        {toolkitLinks.map((tool) => (
                            <Link
                                key={tool.title}
                                to={tool.to}
                                className="block rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:border-indigo-200 transition"
                            >
                                <p className="text-sm font-semibold text-slate-900">{tool.title}</p>
                                <p className="text-xs text-slate-500 mt-1">{tool.description}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Avis clients</p>
                        <h3 className="text-lg font-semibold text-slate-900">Ce que disent vos élèves</h3>
                    </div>
                    <Link to="/coach/profile" className="text-sm font-semibold text-indigo-600">
                        Voir mon profil public
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {testimonials.map((testimonial) => (
                        <div key={testimonial.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-5 shadow-sm">
                            <p className="text-sm text-slate-600 italic">“{testimonial.content}”</p>
                            <div className="mt-4 flex items-center justify-between">
                                <span className="text-sm font-semibold text-slate-900">{testimonial.author}</span>
                                <span className="text-xs font-semibold text-amber-500">{'★'.repeat(testimonial.rating)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

const QuickCoachAction: React.FC<{ title: string; description: string; to: string }> = ({ title, description, to }) => (
    <Link
        to={to}
        className="block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-indigo-200 hover:shadow-sm transition-colors"
    >
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</p>
    </Link>
);

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

