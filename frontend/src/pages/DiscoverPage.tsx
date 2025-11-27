import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';

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

type NearbyClub = {
    id: string;
    name: string;
    distance: string;
    city: string;
    address: string;
    phone: string;
    disciplines: string[];
    nextSession: string;
    imageQuery: string;
};

type NearbyCoach = {
    id: string;
    name: string;
    speciality: string;
    rating: number;
    distance: string;
    price: string;
    imageQuery: string;
    phone: string;
    email: string;
};

const mockClubs: NearbyClub[] = [
    {
        id: 'club-paris',
        name: 'Club Paris Centre',
        distance: '1,2 km',
        city: 'Paris 11e',
        address: '42 rue Oberkampf, 75011 Paris',
        phone: '01 86 95 12 34',
        disciplines: ['Fitness', 'Pilates', 'Boxe'],
        nextSession: 'Aujourd’hui • 19h30',
        imageQuery: 'paris fitness studio training'
    },
    {
        id: 'club-lyon',
        name: 'Maison Sportive Croix-Rousse',
        distance: '2,1 km',
        city: 'Lyon 4e',
        address: '18 rue du Mail, 69004 Lyon',
        phone: '04 72 51 23 45',
        disciplines: ['CrossTraining', 'Yoga', 'Danse'],
        nextSession: 'Demain • 12h30',
        imageQuery: 'lyon cross training gym'
    },
    {
        id: 'club-marseille',
        name: 'Studio Performance Marseille',
        distance: '3,8 km',
        city: 'Marseille Prado',
        address: '6 avenue du Parc Borély, 13008 Marseille',
        phone: '04 91 22 11 00',
        disciplines: ['Cycling', 'Mobilité'],
        nextSession: 'Vendredi • 18h00',
        imageQuery: 'marseille cycling studio'
    },
    {
        id: 'club-toulouse',
        name: 'Atelier Canal Toulouse',
        distance: '4,5 km',
        city: 'Toulouse Centre',
        address: '25 rue du Faubourg Bonnefoy, 31500 Toulouse',
        phone: '05 34 45 77 12',
        disciplines: ['Danse', 'Kids multi-activités'],
        nextSession: 'Samedi • 10h00',
        imageQuery: 'toulouse kids dance studio'
    },
    {
        id: 'club-bordeaux',
        name: 'Bordeaux Flow Academy',
        distance: '5,2 km',
        city: 'Bordeaux Chartrons',
        address: '8 quai des Chartrons, 33000 Bordeaux',
        phone: '05 56 12 45 98',
        disciplines: ['Yoga', 'Respiration', 'Mobilité'],
        nextSession: 'Dimanche • 18h30',
        imageQuery: 'bordeaux yoga training studio'
    },
    {
        id: 'club-nantes',
        name: 'Nantes Athlé District',
        distance: '6,8 km',
        city: 'Nantes Erdre',
        address: '14 rue de la Beaujoire, 44300 Nantes',
        phone: '02 51 74 63 21',
        disciplines: ['Athlétisme', 'Renfo', 'Boxe'],
        nextSession: 'Lundi • 20h00',
        imageQuery: 'nantes sports training hall'
    },
    {
        id: 'club-lille',
        name: 'Lille Functional Club',
        distance: '7,3 km',
        city: 'Lille Fives',
        address: '3 rue du Gymnase, 59800 Lille',
        phone: '03 20 45 67 89',
        disciplines: ['Functional training', 'HIIT', 'Boxe'],
        nextSession: 'Mardi • 19h00',
        imageQuery: 'functional training gym people'
    },
    {
        id: 'club-rennes',
        name: 'Rennes Wellness Studio',
        distance: '8,1 km',
        city: 'Rennes Thabor',
        address: '22 boulevard de Sévigné, 35000 Rennes',
        phone: '02 23 45 67 89',
        disciplines: ['Yoga doux', 'Méditation', 'Pré & post-natal'],
        nextSession: 'Mercredi • 09h30',
        imageQuery: 'wellness studio yoga meditation'
    },
    {
        id: 'club-strasbourg',
        name: 'Strasbourg Dojo Europe',
        distance: '8,9 km',
        city: 'Strasbourg',
        address: '5 rue de la Lanterne, 67000 Strasbourg',
        phone: '03 88 45 67 21',
        disciplines: ['Judo', 'Aïkido', 'Kids judo'],
        nextSession: 'Jeudi • 18h15',
        imageQuery: 'judo dojo kids training'
    },
    {
        id: 'club-montpellier',
        name: 'Montpellier Outdoor Club',
        distance: '9,3 km',
        city: 'Montpellier',
        address: 'Allée des Sports, 34090 Montpellier',
        phone: '04 67 89 12 34',
        disciplines: ['Bootcamp', 'Course', 'Renfo outdoor'],
        nextSession: 'Dimanche • 09h00',
        imageQuery: 'outdoor bootcamp fitness park'
    }
];

const mockCoaches: NearbyCoach[] = [
    {
        id: 'coach-hugo',
        name: 'Hugo Fernandes',
        speciality: 'Préparateur physique endurance',
        rating: 4.9,
        distance: '1 km',
        price: '60 €/h',
        phone: '06 11 22 33 44',
        email: 'hugo.endurance@example.com',
        imageQuery: 'endurance coach portrait'
    },
    {
        id: 'coach-lea',
        name: 'Léa Marchal',
        speciality: 'Pilates & mobilité',
        rating: 4.8,
        distance: '2,4 km',
        price: '45 €/h',
        phone: '06 55 66 77 88',
        email: 'lea.marchal@example.com',
        imageQuery: 'pilates coach female studio'
    },
    {
        id: 'coach-tom',
        name: 'Tom Bouvier',
        speciality: 'Coach CrossTraining',
        rating: 4.7,
        distance: '3,1 km',
        price: '55 €/h',
        phone: '06 98 45 32 10',
        email: 'tom.bouvier@example.com',
        imageQuery: 'crosstraining coach portrait'
    },
    {
        id: 'coach-julia',
        name: 'Julia Renard',
        speciality: 'Danse & mobilité',
        rating: 4.9,
        distance: '3,4 km',
        price: '50 €/h',
        phone: '06 41 21 58 96',
        email: 'julia.renard@example.com',
        imageQuery: 'dance coach studio portrait'
    },
    {
        id: 'coach-mathieu',
        name: 'Mathieu Caron',
        speciality: 'Préparation course & trail',
        rating: 4.6,
        distance: '4 km',
        price: '65 €/h',
        phone: '06 90 33 11 22',
        email: 'mathieu.caron@example.com',
        imageQuery: 'running coach outdoor portrait'
    },
    {
        id: 'coach-samira',
        name: 'Samira Aït',
        speciality: 'Cardio-boxe & récupération',
        rating: 4.8,
        distance: '4,8 km',
        price: '48 €/h',
        phone: '06 78 23 45 56',
        email: 'samira.ait@example.com',
        imageQuery: 'cardio boxing coach portrait'
    },
    {
        id: 'coach-ines',
        name: 'Inès Dupont',
        speciality: 'Yoga & gestion du stress',
        rating: 5.0,
        distance: '5,2 km',
        price: '55 €/h',
        phone: '06 32 14 58 96',
        email: 'ines.yoga@example.com',
        imageQuery: 'yoga teacher portrait calm studio'
    },
    {
        id: 'coach-lucas',
        name: 'Lucas Martin',
        speciality: 'Prépa physique sports de combat',
        rating: 4.7,
        distance: '5,9 km',
        price: '70 €/h',
        phone: '06 87 44 22 11',
        email: 'lucas.combatprep@example.com',
        imageQuery: 'mma strength conditioning coach'
    },
    {
        id: 'coach-amelie',
        name: 'Amélie Roche',
        speciality: 'Préparation mentale & respiration',
        rating: 4.9,
        distance: '6,3 km',
        price: '65 €/h',
        phone: '06 22 44 66 88',
        email: 'amelie.mentalcoach@example.com',
        imageQuery: 'mental coach breathing session'
    },
    {
        id: 'coach-yannis',
        name: 'Yannis Belaid',
        speciality: 'Street workout & calisthenics',
        rating: 4.8,
        distance: '7 km',
        price: '50 €/h',
        phone: '06 77 55 33 11',
        email: 'yannis.street@example.com',
        imageQuery: 'street workout coach outdoor bars'
    }
];

const DiscoverPage: React.FC = () => {
    const { user } = useAuth();
    const [hasLocation, setHasLocation] = React.useState(false);
    const [userCity, setUserCity] = React.useState('Paris');
    const [selectedClub, setSelectedClub] = React.useState<NearbyClub | null>(null);
    const [clubMessage, setClubMessage] = React.useState('Bonjour, je souhaite découvrir vos créneaux et en savoir plus sur les inscriptions.');
    const [contactedClubIds, setContactedClubIds] = React.useState<Set<string>>(() => new Set());
    const [selectedCoach, setSelectedCoach] = React.useState<NearbyCoach | null>(null);
    const [coachMessage, setCoachMessage] = React.useState('Bonjour, je suis intéressé(e) par vos séances privées. Avez-vous encore des disponibilités ?');
    const [contactedCoachIds, setContactedCoachIds] = React.useState<Set<string>>(() => new Set());

    const handleAskLocation = React.useCallback(() => {
        if (!('geolocation' in navigator)) {
            window.alert('Votre navigateur ne permet pas la géolocalisation. Choisissez une ville.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            () => {
                setHasLocation(true);
            },
            () => {
                window.alert('Impossible de récupérer votre position. Saisissez votre ville.');
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    }, []);

    return (
        <Layout
            title="Explorez tous les espaces sportifs autour de vous"
            subtitle="Clubs, associations multisports, studios bien-être et coachs indépendants : comparez avant de créer votre compte IKIVIO."
            mode="club"
        >
            <div className="space-y-10">
                <section className="rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white p-8 sm:p-12 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-black/30 to-transparent" />
                    <div className="relative z-10 flex flex-col gap-6">
                        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-white/80">
                            Mode découverte
                        </div>
                        <div className="max-w-3xl space-y-4">
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">
                                Explorez les clubs proches de chez vous
                            </h1>
                            <p className="text-white/90 text-lg">
                                Comparez les disciplines, découvrez les coachs indépendants, trouvez un stage… tout cela avant même de créer un compte IKIVIO.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <Button
                                size="md"
                                className={`${hasLocation ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-500 text-white hover:bg-indigo-400'}`}
                                onClick={handleAskLocation}
                            >
                                {hasLocation ? 'Position détectée' : 'Activer la localisation'}
                            </Button>
                            <Link to="/register">
                                <Button variant="outline" size="md" className="border-white/60 text-white hover:bg-white/10">
                                    Créer un compte gratuit
                                </Button>
                            </Link>
                        </div>
                        <div className="flex flex-col gap-2 text-sm text-white/80">
                            <label htmlFor="city-input" className="uppercase tracking-[0.2em] text-xs font-semibold text-white/70">
                                Ou indiquez votre ville
                            </label>
                            <input
                                id="city-input"
                                type="text"
                                value={userCity}
                                onChange={(event) => setUserCity(event.target.value)}
                                className="px-4 py-3 rounded-2xl bg-white/20 backdrop-blur border border-white/30 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/70 w-full max-w-sm"
                                placeholder="Paris, Lyon, Marseille…"
                            />
                        </div>
                    </div>
                </section>

                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Clubs & associations à proximité</h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{hasLocation ? 'Autour de votre localisation' : `Autour de ${userCity}`}</p>
                        </div>
                        <Link to="/register" className="text-sm text-indigo-600 font-semibold hover:text-indigo-500">
                            Voir tous les clubs
                        </Link>
                    </div>
                    {(() => {
                        const fullRowsCount = Math.floor(mockClubs.length / 3) * 3;
                        const displayedClubs = mockClubs.slice(0, fullRowsCount || mockClubs.length);
                        return (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {displayedClubs.map((club, idx) => (
                            <article key={club.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden text-left">
                                <div className="relative">
                                    <ImgWithFallback
                                        src={unsplash(900, 600, club.imageQuery, `discover-club-${idx}`)}
                                        alt={club.name}
                                        className="w-full aspect-[4/3] object-cover"
                                        width={900}
                                        height={600}
                                        seed={`discover-club-${idx}`}
                                    />
                                    <div className="absolute top-4 left-4 inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800">
                                        {club.distance}
                                    </div>
                                </div>
                                <div className="p-4 space-y-2">
                                    <div className="text-xs text-slate-500 uppercase tracking-[0.2em] font-semibold">{club.city}</div>
                                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">{club.name}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{club.address}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{club.phone}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Prochain cours : {club.nextSession}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {club.disciplines.map((discipline) => (
                                            <span key={discipline} className="text-xs rounded-full bg-indigo-50 text-indigo-600 px-3 py-1">
                                                {discipline}
                                            </span>
                                        ))}
                                    </div>
                                    <Button
                                        size="sm"
                                        className="w-full justify-center mt-2"
                                        onClick={() => setSelectedClub(club)}
                                        disabled={contactedClubIds.has(club.id)}
                                    >
                                        {contactedClubIds.has(club.id) ? 'Demande envoyée' : 'Contacter le club'}
                                    </Button>
                                </div>
                            </article>
                                ))}
                            </div>
                        );
                    })()}
                </section>

                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Coachs indépendants disponibles</h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Cours privés, préparation, mobilité…</p>
                        </div>
                        <Link to="/club/coaches" className="text-sm text-indigo-600 font-semibold hover:text-indigo-500">
                            Voir tous les coachs
                        </Link>
                    </div>
                    {(() => {
                        const fullRowsCount = Math.floor(mockCoaches.length / 3) * 3;
                        const displayedCoaches = mockCoaches.slice(0, fullRowsCount || mockCoaches.length);
                        return (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {displayedCoaches.map((coach, idx) => (
                            <article key={coach.id} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col md:flex-row gap-4 p-5">
                                <Link to={`/coach/independants/${coach.id}`} className="block">
                                    <ImgWithFallback
                                        src={unsplash(200, 200, coach.imageQuery, `coach-${idx}`)}
                                        alt={coach.name}
                                        className="w-32 h-32 rounded-2xl object-cover"
                                        width={200}
                                        height={200}
                                        seed={`coach-${idx}`}
                                    />
                                </Link>
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Link to={`/coach/independants/${coach.id}`} className="space-y-1 group">
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                                {coach.name}
                                            </h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{coach.speciality}</p>
                                        </Link>
                                        <span className="text-xs font-semibold text-slate-500">{coach.distance}</span>
                                    </div>
                                    <div className="text-sm text-slate-500 flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">{coach.rating.toFixed(1)} ★</span>
                                        <span>•</span>
                                        <span>{coach.price}</span>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="w-full justify-center mt-2"
                                        onClick={() => setSelectedCoach(coach)}
                                        disabled={contactedCoachIds.has(coach.id)}
                                    >
                                        {contactedCoachIds.has(coach.id) ? 'Demande envoyée' : `Contacter ${coach.name.split(' ')[0]}`}
                                    </Button>
                                </div>
                            </article>
                                ))}
                            </div>
                        );
                    })()}
                </section>

                {!user && (
                    <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-indigo-500 font-semibold">Prêt à essayer ?</p>
                            <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mt-2">Créez un compte gratuit en 2 minutes</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                                Accédez à toutes les fonctionnalités IKIVIO : réservations, accès aux clubs, messages coachs, événements privés…
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link to="/register">
                                <Button className="min-w-[180px] justify-center">Créer un compte</Button>
                            </Link>
                            <Link to="/login">
                                <Button variant="outline" className="min-w-[180px] justify-center">
                                    Se connecter
                                </Button>
                            </Link>
                        </div>
                    </section>
                )}
            </div>
            <ClubContactModal
                open={!!selectedClub}
                club={selectedClub}
                message={clubMessage}
                onChangeMessage={setClubMessage}
                onSuccess={(clubId) => setContactedClubIds((prev) => new Set(prev).add(clubId))}
                onClose={() => setSelectedClub(null)}
            />
            <CoachContactModal
                open={!!selectedCoach}
                coach={selectedCoach}
                message={coachMessage}
                onChangeMessage={setCoachMessage}
                onSuccess={(coachId) => setContactedCoachIds((prev) => new Set(prev).add(coachId))}
                onClose={() => setSelectedCoach(null)}
            />
        </Layout>
    );
};

export default DiscoverPage;

const ClubContactModal: React.FC<{
    open: boolean;
    club: NearbyClub | null;
    message: string;
    onChangeMessage: (value: string) => void;
    onSuccess: (clubId: string) => void;
    onClose: () => void;
}> = ({ open, club, message, onChangeMessage, onSuccess, onClose }) => {
    if (!open || !club) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
            <div className="absolute inset-0" onClick={onClose} role="presentation" />
            <div className="relative max-w-2xl w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl ring-1 ring-slate-100 dark:ring-slate-800 p-6 space-y-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center text-sm font-semibold hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                    ✕
                </button>
                <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 font-semibold">{club.city}</p>
                    <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">{club.name}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Distance estimée : {club.distance}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{club.address}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{club.phone}</p>
                </div>
                <div className="space-y-2">
                    <label htmlFor="club-message" className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 font-semibold">
                        Message
                    </label>
                    <textarea
                        id="club-message"
                        value={message}
                        onChange={(e) => onChangeMessage(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows={5}
                        placeholder="Présentez-vous et précisez vos attentes..."
                    />
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        className="flex-1 justify-center"
                        onClick={() => {
                            onSuccess(club.id);
                            onClose();
                        }}
                    >
                        Envoyer ma demande
                    </Button>
                    <Button variant="outline" className="flex-1 justify-center" onClick={onClose}>
                        Annuler
                    </Button>
                </div>
            </div>
        </div>
    );
};

const CoachContactModal: React.FC<{
    open: boolean;
    coach: NearbyCoach | null;
    message: string;
    onChangeMessage: (value: string) => void;
    onSuccess: (coachId: string) => void;
    onClose: () => void;
}> = ({ open, coach, message, onChangeMessage, onSuccess, onClose }) => {
    if (!open || !coach) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
            <div className="absolute inset-0" onClick={onClose} role="presentation" />
            <div className="relative max-w-2xl w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl ring-1 ring-slate-100 dark:ring-slate-800 p-6 space-y-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center text-sm font-semibold hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                    ✕
                </button>
                <div className="flex items-center gap-4">
                    <ImgWithFallback
                        src={unsplash(160, 160, coach.imageQuery, `coach-modal-${coach.id}`)}
                        alt={coach.name}
                        className="w-20 h-20 rounded-2xl object-cover"
                        width={160}
                        height={160}
                        seed={`coach-modal-${coach.id}`}
                    />
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 font-semibold">{coach.distance}</p>
                        <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">{coach.name}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{coach.speciality}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{coach.phone}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{coach.email}</p>
                    </div>
                </div>
                <div className="space-y-2">
                    <label htmlFor="coach-message" className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 font-semibold">
                        Message
                    </label>
                    <textarea
                        id="coach-message"
                        value={message}
                        onChange={(e) => onChangeMessage(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows={4}
                        placeholder="Expliquez vos objectifs et disponibilités…"
                    />
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        className="flex-1 justify-center"
                        onClick={() => {
                            onSuccess(coach.id);
                            onClose();
                        }}
                    >
                        Envoyer ma demande
                    </Button>
                    <Button variant="outline" className="flex-1 justify-center" onClick={onClose}>
                        Annuler
                    </Button>
                </div>
            </div>
        </div>
    );
};

