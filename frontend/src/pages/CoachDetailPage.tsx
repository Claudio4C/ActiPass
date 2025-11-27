import React from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';

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

type CoachDetail = {
    id: string;
    name: string;
    speciality: string;
    description: string;
    location: string;
    serviceArea: string;
    rating: number;
    reviewsCount: number;
    pricing: { single: number; pack5?: number; pack10?: number };
    availabilities: string[];
    tags: string[];
    phone: string;
    email: string;
    imageQuery: string;
    reviews: Array<{
        id: string;
        author: string;
        note: number;
        content: string;
        date: string;
    }>;
};

const coachDetails: CoachDetail[] = [
    {
        id: 'coach-hugo',
        name: 'Hugo Fernandes',
        speciality: 'Préparateur physique endurance & sports outdoor',
        description: 'Ancien athlète semi-pro, Hugo conçoit des plans individualisés pour préparer trails, courses longues et renforcer l’endurance générale.',
        location: 'Paris 11e',
        serviceArea: 'Paris intra-muros + Bois de Vincennes',
        rating: 4.9,
        reviewsCount: 48,
        pricing: { single: 60, pack5: 280, pack10: 520 },
        availabilities: ['Lundi 7h-10h', 'Mercredi 18h-21h', 'Samedi 9h-12h'],
        tags: ['Endurance', 'Prépa trail', 'Renfo cardiaque'],
        phone: '06 11 22 33 44',
        email: 'hugo.endurance@example.com',
        imageQuery: 'endurance coach portrait',
        reviews: [
            {
                id: 'rev-1',
                author: 'Lucie',
                note: 5,
                content: 'Plan d’entraînement clair, disponibilité au top et beaucoup de pédagogie.',
                date: 'mars 2024'
            },
            {
                id: 'rev-2',
                author: 'Mickaël',
                note: 4.8,
                content: 'Très bon suivi pour ma préparation au semi-marathon.',
                date: 'février 2024'
            }
        ]
    },
    {
        id: 'coach-lea',
        name: 'Léa Marchal',
        speciality: 'Pilates & mobilité fonctionnelle',
        description: 'Léa accompagne sportifs et actifs sur la posture, la prévention des blessures et la mobilité quotidienne.',
        location: 'Lyon Presqu’île',
        serviceArea: 'Lyon centre + cours en visio',
        rating: 4.8,
        reviewsCount: 65,
        pricing: { single: 50, pack5: 230, pack10: 420 },
        availabilities: ['Mardi 9h-14h', 'Jeudi 17h-21h', 'Dimanche 10h-12h'],
        tags: ['Pilates', 'Mobility', 'Pré & post-natal'],
        phone: '06 55 66 77 88',
        email: 'lea.marchal@example.com',
        imageQuery: 'pilates coach female studio',
        reviews: [
            {
                id: 'rev-3',
                author: 'Sarah',
                note: 4.9,
                content: 'Amélioration nette de ma posture et disparition des douleurs lombaires.',
                date: 'avril 2024'
            },
            {
                id: 'rev-4',
                author: 'Julien',
                note: 4.7,
                content: 'Très pro, séances variées et adaptées à mon emploi du temps.',
                date: 'janvier 2024'
            }
        ]
    }
];

const CoachDetailPage: React.FC = () => {
    const { coachId } = useParams<{ coachId: string }>();
    const coach = React.useMemo(() => coachDetails.find((c) => c.id === coachId), [coachId]);

    if (!coach) {
        return (
            <Layout title="Coach introuvable" subtitle="Vérifiez le lien ou explorez les autres coachs disponibles." mode="club">
                <div className="text-center py-12 space-y-4">
                    <p className="text-slate-600 dark:text-slate-300">Ce coach n’existe pas ou n’est plus disponible.</p>
                    <Link to="/club/coaches">
                        <Button>Retour à l’annuaire des coachs</Button>
                    </Link>
                </div>
            </Layout>
        );
    }

    return (
        <Layout
            title={coach.name}
            subtitle={coach.speciality}
            mode="club"
        >
            <div className="space-y-10">
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                        <div className="relative h-48 sm:h-64">
                            <ImgWithFallback
                                src={unsplash(1200, 400, coach.imageQuery, `hero-${coach.id}`)}
                                alt={coach.name}
                                className="w-full h-full object-cover"
                                width={1200}
                                height={400}
                                seed={`hero-${coach.id}`}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-6">
                                <div className="flex items-start gap-4">
                                    <ImgWithFallback
                                        src={unsplash(120, 120, coach.imageQuery, `avatar-${coach.id}`)}
                                        alt={coach.name}
                                        className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white dark:ring-slate-900"
                                        width={120}
                                        height={120}
                                        seed={`avatar-${coach.id}`}
                                    />
                                    <div className="flex-1 text-white">
                                        <h1 className="text-2xl font-bold mb-1">{coach.name}</h1>
                                        <p className="text-sm text-white/90 mb-2">{coach.speciality}</p>
                                        <div className="flex items-center gap-3 text-sm">
                                            <span className="inline-flex items-center gap-1 font-semibold">
                                                {coach.rating.toFixed(1)} ★
                                            </span>
                                            <span className="text-white/80">({coach.reviewsCount} avis)</span>
                                            <span className="text-white/60">•</span>
                                            <span className="text-white/80">{coach.location}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20">
                                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">5+</p>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Années d'expérience</p>
                                </div>
                                <div className="text-center p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20">
                                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{coach.reviewsCount}+</p>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Clients satisfaits</p>
                                </div>
                                <div className="text-center p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20">
                                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{coach.availabilities.length}</p>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Créneaux/semaine</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{coach.description}</p>
                                <div className="flex flex-wrap gap-2">
                                    {coach.tags.map((tag) => (
                                        <span key={tag} className="text-xs rounded-full bg-indigo-50 text-indigo-600 px-3 py-1">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Zone d'intervention</p>
                                <p className="text-sm text-slate-700 dark:text-slate-300">{coach.serviceArea}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold">Contact</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">{coach.phone}</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{coach.email}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold">Tarifs</p>
                            <ul className="text-sm text-slate-700 dark:text-slate-300 mt-2 space-y-1">
                                <li>Séance solo : {coach.pricing.single} €</li>
                                {coach.pricing.pack5 ? <li>Pack 5 séances : {coach.pricing.pack5} €</li> : null}
                                {coach.pricing.pack10 ? <li>Pack 10 séances : {coach.pricing.pack10} €</li> : null}
                            </ul>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold">Disponibilités</p>
                            <ul className="text-sm text-slate-700 dark:text-slate-300 mt-2 space-y-1">
                                {coach.availabilities.map((slot) => (
                                    <li key={slot}>{slot}</li>
                                ))}
                            </ul>
                        </div>
                        <Button className="w-full justify-center">Contacter {coach.name.split(' ')[0]}</Button>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Avis élèves</h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                {coach.rating.toFixed(1)} / 5 • {coach.reviewsCount} avis validés
                            </p>
                        </div>
                        <Link to="/club/coaches" className="text-sm text-indigo-600 hover:text-indigo-500 font-semibold">
                            Voir d’autres coachs
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {coach.reviews.map((review) => (
                            <article key={review.id} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{review.author}</p>
                                        <p className="text-xs text-slate-500">{review.date}</p>
                                    </div>
                                    <span className="text-sm font-semibold text-amber-600">{review.note.toFixed(1)} ★</span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-300">{review.content}</p>
                            </article>
                        ))}
                    </div>
                </section>
            </div>
        </Layout>
    );
};

export default CoachDetailPage;

