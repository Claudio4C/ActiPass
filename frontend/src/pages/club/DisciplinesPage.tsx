import React from 'react';
import Layout from '../../components/layout/Layout';

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

type Discipline = {
    name: string;
    query: string;
    description: string;
    focus: string;
};

const disciplines: Discipline[] = [
    {
        name: 'Jiu-jitsu brésilien',
        query: 'brazilian jiu jitsu training mats',
        description:
            'Travail du sol avec kimono, transitions techniques et soumissions. Adapté à tous les niveaux avec des créneaux loisirs et compétition.',
        focus: 'Kimono • Techniques au sol • Sparring',
    },
    {
        name: 'Luta Livre',
        query: 'nogi grappling training submission',
        description:
            'Discipline no-gi axée sur la mobilité et l’explosivité. Idéale pour le MMA et le grappling sans kimono.',
        focus: 'No-Gi • Contrôle debout/sol • Fluidité',
    },
    {
        name: 'Judo',
        query: 'judo throw training dojo',
        description:
            'Projeté debout, contrôle au sol et discipline olympique. Parfait pour compléter son jeu en grappling.',
        focus: 'Projections • Contrôle debout • Randori',
    },
];

const defaultClubInfo = {
    title: 'Disciplines proposées',
    subtitle: 'Explorez les cours disponibles et trouvez ceux qui correspondent à vos objectifs.',
};

type ClubMetadata = {
    name?: string;
    subtitle?: string;
};

const DisciplinesPage: React.FC = () => {
    const [clubInfo, setClubInfo] = React.useState(() => {
        if (typeof window === 'undefined') return defaultClubInfo;
        try {
            const raw = window.localStorage.getItem('selectedOrganisation');
            if (!raw) return defaultClubInfo;
            const parsed = JSON.parse(raw) as ClubMetadata | null;
            if (!parsed) return defaultClubInfo;
            return {
                title: parsed.name ? `Disciplines • ${parsed.name}` : defaultClubInfo.title,
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
                    title: parsed.name ? `Disciplines • ${parsed.name}` : defaultClubInfo.title,
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
        <Layout title={clubInfo.title} subtitle={clubInfo.subtitle ?? defaultClubInfo.subtitle} mode="club">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {disciplines.map((discipline, idx) => (
                    <article key={discipline.name} className="rounded-3xl border border-slate-200 bg-white/90 backdrop-blur shadow-sm overflow-hidden">
                        <div className="relative">
                            <ImgWithFallback
                                src={unsplash(900, 600, discipline.query, `discipline-page-${idx}`)}
                                alt={discipline.name}
                                className="w-full aspect-[3/2] object-cover"
                                width={900}
                                height={600}
                                seed={`discipline-page-${idx}`}
                            />
                            <span className="absolute top-3 left-3 inline-flex items-center rounded-full bg-black/60 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                                {discipline.focus}
                            </span>
                        </div>
                        <div className="p-6 space-y-3">
                            <h2 className="text-lg font-semibold text-slate-900">{discipline.name}</h2>
                            <p className="text-sm text-slate-600 leading-relaxed">{discipline.description}</p>
                            <button
                                type="button"
                                className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                            >
                                Voir les créneaux
                            </button>
                        </div>
                    </article>
                ))}
            </div>
        </Layout>
    );
};

export default DisciplinesPage;
