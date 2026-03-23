import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, Search } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';

const DiscoverPage: React.FC = () => {
    const { user } = useAuth();
    const [hasLocation, setHasLocation] = React.useState(false);
    const [userCity, setUserCity] = React.useState('Paris');

    const handleAskLocation = React.useCallback(() => {
        if (!('geolocation' in navigator)) {
            window.alert('Votre navigateur ne permet pas la géolocalisation. Choisissez une ville.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            () => setHasLocation(true),
            () => window.alert('Impossible de récupérer votre position. Saisissez votre ville.'),
            { enableHighAccuracy: true, timeout: 5000 }
        );
    }, []);

    return (
        <Layout
            title="Explorez tous les espaces sportifs autour de vous"
            subtitle="Clubs, associations multisports, studios bien-être et coachs indépendants."
            mode="club"
        >
            <div className="space-y-10">
                {/* Hero */}
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
                                className={hasLocation ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-500 text-white hover:bg-indigo-400'}
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
                            <div className="flex gap-2 max-w-sm">
                                <input
                                    id="city-input"
                                    type="text"
                                    value={userCity}
                                    onChange={e => setUserCity(e.target.value)}
                                    placeholder="Paris, Lyon, Marseille…"
                                    className="flex-1 rounded-xl bg-white/20 border border-white/30 px-4 py-2 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                                />
                                <Button size="sm" className="bg-white text-indigo-700 hover:bg-indigo-50">
                                    <Search className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Clubs à proximité */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Clubs & associations à proximité</h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                {hasLocation ? 'Autour de votre localisation' : `Autour de ${userCity}`}
                            </p>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-12 text-center">
                        <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-600 dark:text-slate-400 font-medium">
                            La recherche de clubs est en cours de développement
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                            Les clubs rejoignant IKIVIO apparaîtront ici. Revenez bientôt.
                        </p>
                        <Link to="/register" className="inline-block mt-6">
                            <Button size="sm" variant="secondary">
                                Inscrivez votre club
                            </Button>
                        </Link>
                    </div>
                </section>

                {/* Coachs indépendants */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Coachs indépendants disponibles</h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Cours privés, préparation, mobilité…</p>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-12 text-center">
                        <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-600 dark:text-slate-400 font-medium">
                            L'annuaire des coachs est en cours de développement
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                            Les coachs indépendants rejoignant IKIVIO apparaîtront ici.
                        </p>
                        <Link to="/register" className="inline-block mt-6">
                            <Button size="sm" variant="secondary">
                                Créez votre profil coach
                            </Button>
                        </Link>
                    </div>
                </section>

                {/* CTA inscription */}
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
        </Layout>
    );
};

export default DiscoverPage;
