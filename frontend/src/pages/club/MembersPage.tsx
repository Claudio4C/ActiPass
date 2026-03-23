import React from 'react';
import Layout from '../../components/layout/Layout';
import { Link } from 'react-router-dom';
import { useCurrentOrganisation } from '../../hooks/useCurrentOrganisation';
import { api } from '../../lib/api';
import type { Event } from '../../types';
import ComingSoon from '../../components/shared/ComingSoon';

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

const MembersPage: React.FC = () => {
    const { metadata: clubMetadata, role: accountRole } = useCurrentOrganisation();
const [organisationId, setOrganisationId] = React.useState<string | null>(null);
    const [upcomingEvents, setUpcomingEvents] = React.useState<Event[]>([]);

    React.useEffect(() => {
        const loadOrganisation = () => {
            try {
                const raw = window.localStorage.getItem('selectedOrganisation');
                if (raw) {
                    const org = JSON.parse(raw) as { id?: string };
                    if (org?.id) {
                        setOrganisationId(org.id);
                    }
                }
            } catch (err) {
                console.error('Error loading organisation:', err);
            }
        };

        loadOrganisation();
        window.addEventListener('storage', loadOrganisation);
        window.addEventListener('organisation:updated', loadOrganisation);

        return () => {
            window.removeEventListener('storage', loadOrganisation);
            window.removeEventListener('organisation:updated', loadOrganisation);
        };
    }, []);

    React.useEffect(() => {
        if (!organisationId) return;

        const loadEvents = async () => {
            try {
                const data = await api.get<Event[]>(
                    `/organisations/${organisationId}/events`,
                    { status: 'published' },
                    { useCache: true, cacheTTL: 30000 }
                );
                setUpcomingEvents(data);
            } catch (err) {
                console.error('Impossible de charger les événements', err);
            }
        };

        void loadEvents();
    }, [organisationId]);

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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className={`lg:col-span-2 rounded-3xl ${themeCard} p-6`}>
                        <p className="text-xs uppercase tracking-[0.2em] text-blue-500 dark:text-blue-300 font-semibold">Vue d'ensemble</p>
                        <h3 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">Un club vivant & inclusif</h3>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-6">
                            Consultez vos créneaux, retrouvez vos coachs et découvrez les prochaines actualités du club. Utilisez les filtres pour accéder rapidement à l'information qui vous intéresse.
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
                    <div className={`rounded-3xl ${themeCard} p-6`}>
                        <div className="text-xs uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-300 font-semibold">Prochains événements</div>
                        <div className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{upcomingEvents.length}</div>
                        <p className="text-sm text-slate-600 dark:text-slate-300">Événements publiés</p>
                        <div className="mt-4">
                            <Link
                                to="/club/events"
                                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                            >
                                Voir tous les événements →
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Appel à l'action */}
            <section className="mt-12 mb-10">
                <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 bg-gradient-to-tr from-blue-600 via-indigo-600 to-fuchsia-600 text-white">
                    <div className="absolute -inset-1 opacity-20 pointer-events-none bg-[radial-gradient(60%_60%_at_100%_0%,white,transparent)]" />
                    <div className="relative">
                        <h3 className="text-2xl font-semibold">Rejoindre l'association</h3>
                        <p className="mt-2 text-white/90 text-sm max-w-2xl">
                            Découvrez nos cours, nos professeurs et notre communauté. Première séance d'essai gratuite.
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

            {/* Disciplines */}
            <section className="mb-12">
                <ComingSoon feature="Les disciplines du club" phase="Phase 2" backTo="/accounts" />
            </section>

            {/* Professeurs */}
            <section className="mb-12">
                <ComingSoon feature="L'annuaire des professeurs" phase="Phase 2" backTo="/accounts" />
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
                        Aucun événement n'est encore programmé. Revenez bientôt pour découvrir les prochains stages, compétitions et soirées du club.
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
                                            {event.event_type === 'training'
                                                ? 'Entraînement'
                                                : event.event_type === 'match'
                                                    ? 'Compétition'
                                                    : event.event_type === 'workshop'
                                                        ? 'Stage'
                                                        : event.event_type === 'meeting'
                                                            ? 'Réunion'
                                                            : 'Autre'}
                                        </p>
                                        <h4 className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            {event.title}
                                        </h4>
                                    </div>
                                </div>
                                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                                    <div>
                                        {new Date(event.start_time).toLocaleDateString('fr-FR', {
                                            weekday: 'long',
                                            day: 'numeric',
                                            month: 'long',
                                        })}
                                    </div>
                                    <div>
                                        {new Date(event.start_time).toLocaleTimeString('fr-FR', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                        {' - '}
                                        {new Date(event.end_time).toLocaleTimeString('fr-FR', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </div>
                                    {event.location && (
                                        <div className="text-slate-500">{event.location}</div>
                                    )}
                                </div>
                                {typeof event.capacity === 'number' && event.capacity > 0 && (
                                    <div className="mt-1 text-[11px] font-medium text-emerald-600">
                                        Capacité : {event.capacity} places
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

            {/* Photos récentes */}
            <section className="mb-12">
                <ComingSoon feature="La galerie photos" phase="Phase 3" backTo="/accounts" />
            </section>

            {/* Cours vidéo */}
            <section className="mb-12">
                <ComingSoon feature="Les cours vidéo" phase="Phase 3" backTo="/accounts" />
            </section>

            {/* Actualités */}
            <section className="mb-12">
                <ComingSoon feature="Les actualités du club" phase="Phase 2" backTo="/accounts" />
            </section>
        </Layout>
    );
};

export default MembersPage;

const themeCard = 'bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-100 dark:border-slate-800 shadow-sm';

const CoachExperienceView: React.FC<{ metadata: { title: string; subtitle: string; heroTitle: string; heroDescription: string } }> = () => (
    <ComingSoon feature="L'espace coach" phase="Phase 5" backTo="/accounts" />
);

const FreelanceExperienceView: React.FC<{ metadata: { title: string; subtitle: string; heroTitle: string; heroDescription: string } }> = () => (
    <ComingSoon feature="L'espace coach indépendant" phase="Phase 5" backTo="/accounts" />
);
