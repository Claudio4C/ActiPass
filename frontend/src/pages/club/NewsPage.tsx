import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import { ArrowLeft, Calendar, User } from 'lucide-react'

const unsplash = (w: number, h: number, query: string, seed: string | number) =>
  `https://source.unsplash.com/random/${w}x${h}/?${encodeURIComponent(query)}&sig=${seed}`

const ImgWithFallback: React.FC<{
    src: string;
    alt: string;
    className?: string;
    width: number;
    height: number;
    seed: string | number;
}> = ({ src, alt, className, width, height, seed }) => {
  const [imgSrc, setImgSrc] = React.useState(src)
  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setImgSrc(`https://picsum.photos/${width}/${height}?random=${seed}`)}
    />
  )
}

export type NewsArticle = {
    id: string;
    title: string;
    excerpt: string;
    content: string;
    date: string;
    author?: string;
    category?: string;
    imageQuery: string;
};

export const newsArticles: NewsArticle[] = [
  {
    id: 'news-1',
    title: "This Day That Year: Sandeep Lamichhane's IPL signing, Paras Khadka's historic century",
    excerpt: 'A look back at significant moments in cricket history that happened on this day.',
    content: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.`,
    date: '31 January, 2023',
    author: 'Rédaction IKIVIO',
    category: 'Compétition',
    imageQuery: 'cricket match stadium celebration',
  },
  {
    id: 'news-2',
    title: 'Six central members leave CAN meeting demanding President Chand resignation',
    excerpt: 'Major developments in the cricket administration as key members step down.',
    content: `Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.

Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.`,
    date: '1 February, 2023',
    author: 'Rédaction IKIVIO',
    category: 'Administration',
    imageQuery: 'meeting conference discussion',
  },
  {
    id: 'news-3',
    title: 'Adil Ansari confesses the spot fixing accusation over him',
    excerpt: 'Breaking news about match-fixing allegations and confessions in the sport.',
    content: `Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur.

Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur.`,
    date: '13 January, 2023',
    author: 'Rédaction IKIVIO',
    category: 'Actualité',
    imageQuery: 'sports news breaking story',
  },
  {
    id: 'news-4',
    title: 'Biratnagar Super Kings defeats Janakpur Royals to book a place in finals',
    excerpt: 'Exciting match results as teams battle for championship positions.',
    content: `At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.

Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio.`,
    date: '23 January, 2023',
    author: 'Rédaction IKIVIO',
    category: 'Compétition',
    imageQuery: 'cricket team victory celebration',
  },
  {
    id: 'news-5',
    title: 'Nouveau stage intensif de préparation compétition',
    excerpt: 'Le club organise un stage spécial pour les compétiteurs du mois de mars.',
    content: `Un stage intensif de trois jours sera organisé pour préparer les compétiteurs aux prochains tournois régionaux. Au programme : techniques avancées, préparation physique et stratégies de combat.

Les inscriptions sont ouvertes jusqu'au 15 février. Places limitées à 20 participants.`,
    date: '5 février, 2024',
    author: 'Équipe du club',
    category: 'Stage',
    imageQuery: 'martial arts training intensive seminar',
  },
  {
    id: 'news-6',
    title: 'Ouverture des inscriptions pour la saison 2024-2025',
    excerpt: 'Les inscriptions pour la nouvelle saison sont désormais ouvertes.',
    content: `C'est le moment de s'inscrire pour la saison 2024-2025 ! Nouveaux horaires, nouveaux cours et toujours la même passion pour les arts martiaux.

Tarifs préférentiels pour les inscriptions avant le 1er mars.`,
    date: '10 février, 2024',
    author: 'Équipe du club',
    category: 'Inscription',
    imageQuery: 'registration enrollment sign up',
  },
]

const NewsPage: React.FC = () => {
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all')

  const categories = React.useMemo(() => {
    const cats = new Set(newsArticles.map((article) => article.category).filter(Boolean))
    return Array.from(cats)
  }, [])

  const filteredArticles = React.useMemo(() => {
    if (selectedCategory === 'all') {return newsArticles}
    return newsArticles.filter((article) => article.category === selectedCategory)
  }, [selectedCategory])

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <section className="flex items-center justify-between">
          <Link to="/club/members" className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Retour à l'espace membres
          </Link>
        </section>

        {/* Filtres */}
        {categories.length > 0 && (
          <section className="rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-white/60 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-full text-xs font-semibold border transition ${
                  selectedCategory === 'all'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-200'
                }`}
              >
                Toutes
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold border transition ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Liste des articles */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article, idx) => (
              <article
                key={article.id}
                onClick={() => navigate(`/club/actualites/${article.id}`)}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-xl ring-1 ring-gray-200/60 dark:ring-slate-800/60 shadow-sm overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-blue-300/60 cursor-pointer"
              >
                <div className="relative">
                  <ImgWithFallback
                      src={unsplash(600, 350, article.imageQuery, `news-${article.id}`)}
                      alt={article.title}
                      className="w-full aspect-video object-cover"
                      width={600}
                      height={350}
                      seed={`news-${article.id}`}
                    />
                  {article.category && (
                    <span className="absolute top-3 left-3 inline-flex items-center rounded-full bg-indigo-600/90 backdrop-blur px-3 py-1 text-[11px] font-semibold text-white">
                      {article.category}
                    </span>
                  )}
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {article.date}
                    </div>
                      {article.author && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {article.author}
                        </div>
                      </>
                    )}
                    </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-2">
                      {article.title}
                    </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
                      {article.excerpt}
                    </p>
                  <div className="pt-2">
                      <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
                      Lire la suite →
                    </span>
                    </div>
                </div>
              </article>
            ))}
          </div>
          {filteredArticles.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-600 dark:text-slate-400">Aucun article trouvé dans cette catégorie.</p>
            </div>
          )}
        </section>
      </div>
    </>
  )
}

export default NewsPage
