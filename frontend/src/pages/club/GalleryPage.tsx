import React from 'react';
import Layout from '../../components/layout/Layout';
import Button from '../../components/ui/Button';
import { Link } from 'react-router-dom';

const unsplash = (w: number, h: number, query: string, seed: string | number) =>
    `https://source.unsplash.com/random/${w}x${h}/?${encodeURIComponent(query)}&sig=${seed}`;

const ImgWithFallback: React.FC<{
    src: string;
    alt: string;
    className?: string;
    width: number;
    height: number;
    seed: string | number;
    onLoad?: () => void;
}> = ({ src, alt, className, width, height, seed, onLoad }) => {
    const [imgSrc, setImgSrc] = React.useState(src);
    return (
        <img
            src={imgSrc}
            alt={alt}
            className={className}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgSrc(`https://picsum.photos/${width}/${height}?random=${seed}`)}
            onLoad={onLoad}
        />
    );
};

type GalleryCategory = 'all' | 'stage' | 'kids' | 'training' | 'competition' | 'lifestyle';

type GalleryPhoto = {
    id: string;
    title: string;
    caption: string;
    date: string;
    category: GalleryCategory;
    photographer?: string;
    query: string;
};

const galleryPhotos: GalleryPhoto[] = [
    { id: 'gal-1', title: 'Stage Compétition', caption: 'Travail intensif sur les projections.', date: '8 mars 2024', category: 'competition', query: 'bjj competition training team' },
    { id: 'gal-2', title: 'Session Kids & Parents', caption: 'Initiation ludique du dimanche.', date: '2 mars 2024', category: 'kids', query: 'family martial arts dojo kids' },
    { id: 'gal-3', title: 'Open Mat nocturne', caption: 'Ambiance chill, musique et flow libre.', date: '28 fév. 2024', category: 'lifestyle', query: 'night training martial arts gym lights' },
    { id: 'gal-4', title: 'Drills No-Gi', caption: 'Séance de transitions rapides.', date: '26 fév. 2024', category: 'training', query: 'nogi grappling drilling mat' },
    { id: 'gal-5', title: 'Cours mobilité', caption: 'Atelier respiration & stretching.', date: '25 fév. 2024', category: 'lifestyle', query: 'mobility stretching class studio' },
    { id: 'gal-6', title: 'Equipe jeunes', caption: 'Préparation au premier tournoi.', date: '24 fév. 2024', category: 'kids', query: 'kids martial arts team photo' },
    { id: 'gal-7', title: 'Stage invité', caption: 'Passage de garde avec coach invité.', date: '22 fév. 2024', category: 'stage', query: 'seminar martial arts coach teaching' },
    { id: 'gal-8', title: 'Vie du dojo', caption: 'Moments de convivialité après l’entraînement.', date: '21 fév. 2024', category: 'lifestyle', query: 'dojo friends hanging out' },
    { id: 'gal-9', title: 'Prépa compétition', caption: 'Focus tactique avant Lyon Open.', date: '19 fév. 2024', category: 'competition', query: 'team huddle martial arts strategy' },
    { id: 'gal-10', title: 'Atelier self-defense', caption: 'Techniques basiques pour les nouveaux.', date: '17 fév. 2024', category: 'training', query: 'self defense class dojo' },
];

const galleryCategories: { key: GalleryCategory; label: string }[] = [
    { key: 'all', label: 'Tout' },
    { key: 'stage', label: 'Stages' },
    { key: 'kids', label: 'Kids & parents' },
    { key: 'training', label: 'Entraînements' },
    { key: 'competition', label: 'Compétition' },
    { key: 'lifestyle', label: 'Vie du club' },
];

const GalleryPage: React.FC = () => {
    const [category, setCategory] = React.useState<GalleryCategory>('all');
    const [highlightedPhoto, setHighlightedPhoto] = React.useState<GalleryPhoto | null>(galleryPhotos[0]);
    const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);
    const [lightboxLoading, setLightboxLoading] = React.useState(false);

    const filteredPhotos = React.useMemo(() => {
        return galleryPhotos.filter((photo) => category === 'all' || photo.category === category);
    }, [category]);

    React.useEffect(() => {
        if (lightboxIndex !== null && lightboxIndex >= filteredPhotos.length) {
            setLightboxIndex(null);
        }
    }, [filteredPhotos, lightboxIndex]);

    const closeLightbox = React.useCallback(() => {
        setLightboxIndex(null);
    }, []);

    const showNext = React.useCallback(() => {
        if (lightboxIndex === null || filteredPhotos.length === 0) return;
        setLightboxIndex((prev) => {
            if (prev === null) return prev;
            return (prev + 1) % filteredPhotos.length;
        });
    }, [filteredPhotos.length, lightboxIndex]);

    const showPrev = React.useCallback(() => {
        if (lightboxIndex === null || filteredPhotos.length === 0) return;
        setLightboxIndex((prev) => {
            if (prev === null) return prev;
            return (prev - 1 + filteredPhotos.length) % filteredPhotos.length;
        });
    }, [filteredPhotos.length, lightboxIndex]);

    React.useEffect(() => {
        const handleKey = (event: KeyboardEvent) => {
            if (lightboxIndex === null) return;
            if (event.key === 'Escape') {
                closeLightbox();
            } else if (event.key === 'ArrowRight') {
                showNext();
            } else if (event.key === 'ArrowLeft') {
                showPrev();
            }
        };

        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [lightboxIndex, closeLightbox, showNext, showPrev]);

    return (
        <Layout
            title="Galerie photos"
            subtitle="Revivez les meilleurs moments du club, partagez vos souvenirs et inspirez les nouveaux membres."
            mode="club"
        >
            <div className="space-y-10">
                <section className="rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 text-white p-8 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://source.unsplash.com/random/1600x900/?dojo,training')] bg-cover bg-center" />
                    <div className="relative flex flex-col gap-6">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-white/70 font-semibold">Moments forts</p>
                            <h1 className="mt-3 text-3xl sm:text-4xl font-semibold leading-tight">
                                Albums partagés & stories du club
                            </h1>
                            <p className="mt-3 text-sm sm:text-base text-white/85 max-w-3xl">
                                Consultez les dernières photos publiées, organisez vos événements et donnez envie aux visiteurs de rejoindre l’aventure IKIVIO.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button size="sm" className="bg-white/90 text-indigo-700 hover:bg-white">
                                Ajouter des photos
                            </Button>
                            <Link to="/club/members" className="inline-flex">
                                <Button variant="outline" size="sm" className="border-white/60 text-white hover:bg-white/10">
                                    Retour espace membres
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-white/60 dark:border-slate-800 p-6 shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 font-semibold">Filtrer</p>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mt-2">
                                Trouvez un moment précis
                            </h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Sélectionnez un type d’événement pour afficher uniquement les photos correspondantes.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {galleryCategories.map((cat) => (
                                <button
                                    key={cat.key}
                                    type="button"
                                    onClick={() => setCategory(cat.key)}
                                    className={`px-4 py-2 rounded-full text-xs font-semibold border transition ${
                                        category === cat.key
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-200'
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {highlightedPhoto && (
                    <section className="rounded-3xl overflow-hidden border border-white/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg grid grid-cols-1 lg:grid-cols-2">
                        <div className="relative">
                            <ImgWithFallback
                                src={unsplash(1600, 1200, highlightedPhoto.query, highlightedPhoto.id)}
                                alt={highlightedPhoto.title}
                                className="w-full h-full object-cover"
                                width={1600}
                                height={1200}
                                seed={highlightedPhoto.id}
                            />
                            <div className="absolute top-4 left-4 inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-800">
                                Photo du moment
                            </div>
                        </div>
                        <div className="p-8 space-y-4 flex flex-col justify-center">
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{highlightedPhoto.date}</p>
                            <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">{highlightedPhoto.title}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300">{highlightedPhoto.caption}</p>
                            <div className="flex flex-wrap gap-3">
                                <Button size="sm" onClick={() => setHighlightedPhoto(null)}>
                                    Voir plus de photos
                                </Button>
                                <Button variant="outline" size="sm">
                                    Partager
                                </Button>
                            </div>
                        </div>
                    </section>
                )}

                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {category === 'all' ? 'Toutes les photos' : `Photos ${galleryCategories.find((c) => c.key === category)?.label?.toLowerCase()}`}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{filteredPhotos.length} clichés</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredPhotos.map((photo, idx) => (
                            <figure
                                key={photo.id}
                                className="group relative overflow-hidden rounded-3xl border border-white/40 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 shadow-sm hover:shadow-lg transition cursor-pointer"
                                onClick={() => setLightboxIndex(idx)}
                            >
                                <ImgWithFallback
                                    src={unsplash(1200, 900, photo.query, `${photo.id}-${idx}`)}
                                    alt={photo.title}
                                    className="w-full aspect-[4/3] object-cover group-hover:scale-[1.02] transition-transform duration-500"
                                    width={1200}
                                    height={900}
                                    seed={`${photo.id}-${idx}`}
                                />
                            </figure>
                        ))}
                    </div>
                </section>

                {lightboxIndex !== null && filteredPhotos[lightboxIndex] ? (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4">
                        <button
                            type="button"
                            className="absolute inset-0 w-full h-full cursor-zoom-out"
                            onClick={closeLightbox}
                            aria-label="Fermer la visionneuse"
                        />
                        <div className="relative max-w-5xl w-full flex flex-col items-center">
                            <div className="relative w-full rounded-3xl bg-black/40 flex items-center justify-center min-h-[300px] overflow-hidden">
                                {lightboxLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                    </div>
                                )}
                                <ImgWithFallback
                                    src={unsplash(1920, 1200, filteredPhotos[lightboxIndex].query, `lightbox-${filteredPhotos[lightboxIndex].id}`)}
                                    alt={filteredPhotos[lightboxIndex].title}
                                    className={`w-full rounded-3xl object-contain max-h-[80vh] transition-opacity duration-300 ${lightboxLoading ? 'opacity-0' : 'opacity-100'}`}
                                    width={1920}
                                    height={1200}
                                    seed={`lightbox-${filteredPhotos[lightboxIndex].id}`}
                                    onLoad={() => setLightboxLoading(false)}
                                />
                            </div>
                            <div className="absolute top-4 right-4 flex gap-2">
                                <button
                                    type="button"
                                    className="rounded-full bg-black/60 text-white w-8 h-8 flex items-center justify-center text-sm font-semibold hover:bg-black/80"
                                    onClick={closeLightbox}
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="absolute inset-y-0 left-0 flex items-center">
                                <button
                                    type="button"
                                    className="p-3 text-white bg-black/40 hover:bg-black/70 rounded-full"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        showPrev();
                                    }}
                                    aria-label="Photo précédente"
                                >
                                    ‹
                                </button>
                            </div>
                            <div className="absolute inset-y-0 right-0 flex items-center">
                                <button
                                    type="button"
                                    className="p-3 text-white bg-black/40 hover:bg-black/70 rounded-full"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        showNext();
                                    }}
                                    aria-label="Photo suivante"
                                >
                                    ›
                                </button>
                            </div>
                            <div className="mt-4 text-center text-white space-y-1">
                                <p className="text-sm uppercase tracking-[0.3em] text-white/60">{filteredPhotos[lightboxIndex].date}</p>
                                <p className="text-lg font-semibold">{filteredPhotos[lightboxIndex].title}</p>
                                <p className="text-sm text-white/80">{filteredPhotos[lightboxIndex].caption}</p>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </Layout>
    );
};

export default GalleryPage;

