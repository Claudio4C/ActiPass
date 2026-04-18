import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { ArrowLeft, Calendar, User, Share2 } from 'lucide-react';
import { newsArticles, type NewsArticle } from './NewsPage';

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

const NewsDetailPage: React.FC = () => {
    const { articleId } = useParams<{ articleId: string }>();
    const navigate = useNavigate();
    const [article, setArticle] = React.useState<NewsArticle | null>(null);

    React.useEffect(() => {
        if (articleId) {
            const found = newsArticles.find((a) => a.id === articleId);
            setArticle(found || null);
        }
    }, [articleId]);

    if (!article) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-600 dark:text-slate-400 mb-4">L'article que vous recherchez n'existe pas.</p>
                <Link to="/club/actualites">
                    <Button>Retour aux actualités</Button>
                </Link>
            </div>
        );
    }

    const relatedArticles = newsArticles.filter((a) => a.id !== article.id && a.category === article.category).slice(0, 3);

    return (
        <>
            <div className="space-y-8">
                {/* Navigation */}
                <section className="flex items-center justify-between">
                    <Link
                        to="/club/actualites"
                        className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Retour aux actualités
                    </Link>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({
                                    title: article.title,
                                    text: article.excerpt,
                                    url: window.location.href,
                                });
                            } else {
                                navigator.clipboard.writeText(window.location.href);
                                alert('Lien copié dans le presse-papiers !');
                            }
                        }}
                    >
                        <Share2 className="w-4 h-4 mr-2" />
                        Partager
                    </Button>
                </section>

                {/* Image hero */}
                <section className="relative w-full h-64 sm:h-80 lg:h-96 overflow-hidden rounded-3xl shadow-lg">
                    <ImgWithFallback
                        src={unsplash(1600, 900, article.imageQuery, article.id)}
                        alt={article.title}
                        className="w-full h-full object-cover"
                        width={1600}
                        height={900}
                        seed={article.id}
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-black/20 to-transparent" />
                    {article.category && (
                        <div className="absolute top-6 left-6">
                            <span className="inline-flex items-center rounded-full bg-indigo-600/90 backdrop-blur px-4 py-2 text-sm font-semibold text-white">
                                {article.category}
                            </span>
                        </div>
                    )}
                </section>

                {/* Métadonnées */}
                <section className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{article.date}</span>
                    </div>
                    {article.author && (
                        <>
                            <span>•</span>
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <span>{article.author}</span>
                            </div>
                        </>
                    )}
                </section>

                {/* Contenu */}
                <section className="prose prose-slate dark:prose-invert max-w-none">
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-3xl border border-white/60 dark:border-slate-800 p-8 shadow-sm">
                        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-6">
                            {article.title}
                        </h1>
                        <div className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                            {article.content.split('\n\n').map((paragraph, idx) => (
                                <p key={idx} className="mb-4">
                                    {paragraph}
                                </p>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Articles similaires */}
                {relatedArticles.length > 0 && (
                    <section>
                        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6">
                            Articles similaires
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {relatedArticles.map((related) => (
                                <article
                                    key={related.id}
                                    onClick={() => navigate(`/club/actualites/${related.id}`)}
                                    className="bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-xl ring-1 ring-gray-200/60 dark:ring-slate-800/60 shadow-sm overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-blue-300/60 cursor-pointer"
                                >
                                    <div className="relative">
                                        <ImgWithFallback
                                            src={unsplash(600, 350, related.imageQuery, related.id)}
                                            alt={related.title}
                                            className="w-full aspect-video object-cover"
                                            width={600}
                                            height={350}
                                            seed={related.id}
                                        />
                                    </div>
                                    <div className="p-5 space-y-2">
                                        <div className="text-xs text-slate-500 dark:text-slate-400">{related.date}</div>
                                        <h3 className="text-base font-semibold text-slate-900 dark:text-white line-clamp-2">
                                            {related.title}
                                        </h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                                            {related.excerpt}
                                        </p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </>
    );
};

export default NewsDetailPage;

