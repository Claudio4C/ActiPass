import React from 'react';

const unsplash = (w: number, h: number, query: string, seed: string | number) =>
    `https://source.unsplash.com/random/${w}x${h}/?${encodeURIComponent(query)}&sig=${seed}`;

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

const defaultClubInfo = {
    title: 'Cours vidéo du club',
    subtitle: 'Retrouvez toutes les leçons enregistrées par vos professeurs avec un accès illimité.',
};

type ClubMetadata = {
    name?: string;
    subtitle?: string;
};

const VideoLessonsPage: React.FC = () => {
    const [clubInfo, setClubInfo] = React.useState(() => {
        if (typeof window === 'undefined') return defaultClubInfo;
        try {
            const raw = window.localStorage.getItem('selectedOrganisation');
            if (!raw) return defaultClubInfo;
            const parsed = JSON.parse(raw) as ClubMetadata | null;
            if (!parsed) return defaultClubInfo;
            return {
                title: parsed.name ? `Cours vidéo – ${parsed.name}` : defaultClubInfo.title,
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
                    title: parsed.name ? `Cours vidéo – ${parsed.name}` : defaultClubInfo.title,
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

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {videoLessons.map((lesson) => (
                    <article key={lesson.id} className="rounded-3xl overflow-hidden border border-white/60 bg-white/90 backdrop-blur shadow-sm ring-1 ring-gray-200/60">
                        <div className="relative">
                            <video
                                controls
                                preload="metadata"
                                poster={unsplash(900, 600, lesson.posterQuery, `lesson-page-${lesson.id}`)}
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
                            <h3 className="text-sm font-semibold text-slate-900">{lesson.title}</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">{lesson.description}</p>
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
        </>
    );
};

export default VideoLessonsPage;
