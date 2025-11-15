import React from 'react';
import Layout from '../../components/layout/Layout';
import { Calendar, MapPin, Users } from 'lucide-react';

type Slot = {
    id: string;
    day: string;
    time: string;
    discipline: string;
    coach: string;
    location: string;
    city: string;
    level: 'Tous' | 'Débutant' | 'Intermédiaire' | 'Avancé';
};

const baseSlots: Slot[] = [
    { id: 'slot-1', day: 'Lundi', time: '12:30', discipline: 'Luta Livre', coach: 'Youssef', location: 'COSEC Marcel Pagnol', city: 'Villeurbanne', level: 'Intermédiaire' },
    { id: 'slot-2', day: 'Lundi', time: '14:30', discipline: 'Jiu-jitsu brésilien', coach: 'Youssef', location: 'COSEC Marcel Pagnol', city: 'Villeurbanne', level: 'Tous' },
    { id: 'slot-3', day: 'Lundi', time: '19:30', discipline: 'Jiu-jitsu brésilien', coach: 'Willy', location: 'COSEC Marcel Pagnol', city: 'Villeurbanne', level: 'Débutant' },
    { id: 'slot-4', day: 'Lundi', time: '21:30', discipline: 'Judo', coach: 'Youssef', location: 'COSEC Marcel Pagnol', city: 'Villeurbanne', level: 'Intermédiaire' },
    { id: 'slot-5', day: 'Mardi', time: '07:30', discipline: 'Conditioning No-Gi', coach: 'Hamza', location: 'Studio Croix-Rousse', city: 'Lyon', level: 'Tous' },
    { id: 'slot-6', day: 'Mardi', time: '19:00', discipline: 'Jiu-jitsu brésilien', coach: 'Fabrice', location: 'Dojo Villeurbanne', city: 'Villeurbanne', level: 'Avancé' },
    { id: 'slot-7', day: 'Mercredi', time: '12:00', discipline: 'Drills compétition', coach: 'Hamza', location: 'Studio Croix-Rousse', city: 'Lyon', level: 'Intermédiaire' },
    { id: 'slot-8', day: 'Mercredi', time: '20:30', discipline: 'No-Gi Grappling', coach: 'Youssef', location: 'COSEC Marcel Pagnol', city: 'Villeurbanne', level: 'Tous' },
    { id: 'slot-9', day: 'Jeudi', time: '18:00', discipline: 'Judo', coach: 'Fabrice', location: 'Dojo Villeurbanne', city: 'Villeurbanne', level: 'Débutant' },
    { id: 'slot-10', day: 'Jeudi', time: '20:00', discipline: 'Jiu-jitsu brésilien', coach: 'Willy', location: 'Dojo Villeurbanne', city: 'Villeurbanne', level: 'Intermédiaire' },
    { id: 'slot-11', day: 'Vendredi', time: '07:00', discipline: 'Open mat libre', coach: 'Hamza', location: 'Studio Croix-Rousse', city: 'Lyon', level: 'Tous' },
    { id: 'slot-12', day: 'Vendredi', time: '19:30', discipline: 'Sparring compétition', coach: 'Youssef', location: 'COSEC Marcel Pagnol', city: 'Villeurbanne', level: 'Avancé' },
    { id: 'slot-13', day: 'Samedi', time: '10:00', discipline: 'Stage technique', coach: 'Invité', location: 'COSEC Marcel Pagnol', city: 'Villeurbanne', level: 'Tous' },
    { id: 'slot-14', day: 'Dimanche', time: '11:00', discipline: 'Mobilité & récupération', coach: 'Willy', location: 'Studio Croix-Rousse', city: 'Lyon', level: 'Tous' },
];

const daysOrder = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const defaultClubInfo = {
    title: 'Planning complet',
    subtitle: 'Consultez tous les créneaux de la semaine et filtrez selon vos disponibilités.',
};

type ClubMetadata = {
    name?: string;
    subtitle?: string;
};

const PlanningPage: React.FC = () => {
    const [clubInfo, setClubInfo] = React.useState(() => {
        if (typeof window === 'undefined') return defaultClubInfo;
        try {
            const raw = window.localStorage.getItem('selectedOrganisation');
            if (!raw) return defaultClubInfo;
            const parsed = JSON.parse(raw) as ClubMetadata | null;
            if (!parsed) return defaultClubInfo;
            return {
                title: parsed.name ? `Planning – ${parsed.name}` : defaultClubInfo.title,
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
                    title: parsed.name ? `Planning – ${parsed.name}` : defaultClubInfo.title,
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

    const [disciplineFilter, setDisciplineFilter] = React.useState<'Toutes' | 'Jiu-jitsu brésilien' | 'Luta Livre' | 'Judo' | 'Conditioning No-Gi'>('Toutes');
    const [levelFilter, setLevelFilter] = React.useState<'Tous' | 'Débutant' | 'Intermédiaire' | 'Avancé'>('Tous');
    const [searchDay, setSearchDay] = React.useState<'Tous' | typeof daysOrder[number]>('Tous');

    const visibleDays = React.useMemo(() => {
        if (searchDay === 'Tous') return daysOrder;
        return daysOrder.filter((day) => day === searchDay);
    }, [searchDay]);

    const filteredSlots = React.useMemo(() => {
        return baseSlots.filter((slot) => {
            const matchesDiscipline = disciplineFilter === 'Toutes' || slot.discipline === disciplineFilter;
            const matchesLevel = levelFilter === 'Tous' || slot.level === levelFilter;
            return matchesDiscipline && matchesLevel;
        });
    }, [disciplineFilter, levelFilter]);

    const groupedSlots = React.useMemo(() => {
        return visibleDays.map((day) => ({
            day,
            slots: filteredSlots.filter((slot) => slot.day === day),
        }));
    }, [filteredSlots, visibleDays]);

    return (
        <Layout title={clubInfo.title} subtitle={clubInfo.subtitle ?? defaultClubInfo.subtitle} mode="club">
            <div className="space-y-8 text-slate-900 dark:text-slate-100">
                <section className="rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-100 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                            <Calendar className="h-5 w-5 text-indigo-500" />
                            Planning hebdomadaire synthétique
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 dark:bg-indigo-500/20 px-3 py-1 text-indigo-600 font-semibold">
                                {filteredSlots.length} créneaux
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-slate-600 dark:text-slate-300">
                                {disciplineFilter === 'Toutes' ? 'Toutes disciplines' : disciplineFilter}
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-slate-600 dark:text-slate-300">
                                {levelFilter === 'Tous' ? 'Tous niveaux' : `Niveau ${levelFilter}`}
                            </span>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-100 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-4 transition-colors">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Discipline & niveau</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {(['Toutes', 'Jiu-jitsu brésilien', 'Luta Livre', 'Judo', 'Conditioning No-Gi'] as const).map((disc) => (
                            <button
                                key={disc}
                                type="button"
                                onClick={() => setDisciplineFilter(disc)}
                                className={`rounded-full px-4 py-2 text-xs font-semibold transition shadow-sm border ${
                                    disciplineFilter === disc
                                        ? 'bg-indigo-500 text-white border-indigo-500'
                                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-200 hover:text-indigo-600'
                                }`}
                            >
                                {disc}
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {(['Tous', 'Débutant', 'Intermédiaire', 'Avancé'] as const).map((lvl) => (
                            <button
                                key={lvl}
                                type="button"
                                onClick={() => setLevelFilter(lvl)}
                                className={`rounded-full px-4 py-2 text-xs font-semibold transition shadow-sm border ${
                                    levelFilter === lvl
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:text-slate-900'
                                }`}
                            >
                                Niveau {lvl.toLowerCase()}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-100 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-4 transition-colors">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Jour</div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setSearchDay('Tous')}
                            className={`rounded-full px-4 py-2 text-xs font-semibold transition shadow-sm border ${
                                searchDay === 'Tous'
                                    ? 'bg-indigo-500 text-white border-indigo-500'
                                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-200 hover:text-indigo-600'
                            }`}
                        >
                            Tous
                        </button>
                        {daysOrder.map((day) => (
                            <button
                                key={day}
                                type="button"
                                onClick={() => setSearchDay(day)}
                                className={`rounded-full px-4 py-2 text-xs font-semibold transition shadow-sm border ${
                                    searchDay === day
                                        ? 'bg-indigo-500 text-white border-indigo-500'
                                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-200 hover:text-indigo-600'
                                }`}
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="space-y-6">
                    {groupedSlots.map(({ day, slots }) => (
                        <article key={day} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-sm transition-colors">
                            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-6 py-4">
                                <div className="text-lg font-semibold text-slate-900 dark:text-white">{day}</div>
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    <Users className="h-4 w-4 text-slate-400" />
                                    {slots.length} créneau{slots.length > 1 ? 'x' : ''}
                                </div>
                            </header>
                            {slots.length === 0 ? (
                                <div className="px-6 py-5 text-sm text-slate-500 dark:text-slate-400">Aucun cours prévu pour ce jour avec les filtres actuels.</div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {slots.map((slot) => (
                                        <div key={slot.id} className="px-6 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 font-semibold flex items-center justify-center text-sm">
                                                    {slot.time}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{slot.discipline}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Avec {slot.coach}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 text-xs text-slate-500 dark:text-slate-400">
                                                <span className="inline-flex items-center gap-1">
                                                    <MapPin className="h-4 w-4 text-rose-500" />
                                                    {slot.location}
                                                </span>
                                                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-slate-600 dark:text-slate-300 font-medium">
                                                    {slot.city}
                                                </span>
                                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-slate-600 dark:text-slate-300 font-medium">
                                                    Niveau {slot.level.toLowerCase()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button type="button" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
                                                    S’inscrire
                                                </button>
                                                <button type="button" className="text-xs text-slate-400 hover:text-indigo-500">
                                                    Ajouter au calendrier
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </article>
                    ))}
                </section>
            </div>
        </Layout>
    );
};

export default PlanningPage;
