import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Camera, Mail, Phone, Shield, MapPin, Activity, Calendar, Bell, Lock } from 'lucide-react';

type ToggleRowProps = {
    label: string;
    description: string;
    enabled: boolean;
    onToggle: () => void;
};

const ToggleRow: React.FC<ToggleRowProps> = ({ label, description, enabled, onToggle }) => {
    return (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3">
            <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
            </div>
            <button
                type="button"
                onClick={onToggle}
                className={`inline-flex h-6 w-11 items-center rounded-full transition ${
                    enabled ? 'bg-indigo-500 justify-end' : 'bg-slate-200 dark:bg-slate-700 justify-start'
                }`}
                aria-pressed={enabled}
            >
                <span className="mx-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white shadow" />
            </button>
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: string; descriptor?: string }> = ({ title, value, descriptor }) => (
    <div className={`rounded-2xl border border-white/40 bg-white/20 dark:border-slate-700 dark:bg-slate-900/40 px-4 py-3`}>
        <div className="text-xs uppercase tracking-wide text-white/70 dark:text-slate-200/70">{title}</div>
        <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
        {descriptor ? <div className="text-xs text-white/70 dark:text-slate-300/70">{descriptor}</div> : null}
    </div>
);

const SectionCard: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({
    title,
    description,
    children,
}) => (
    <section className="bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6 transition-colors">
        <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
            {description ? <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{description}</p> : null}
        </div>
        {children}
    </section>
);

const ProfilePage: React.FC = () => {
    const { user } = useAuth();

    const [newsletter, setNewsletter] = React.useState(true);
    const [reminders, setReminders] = React.useState(true);
    const [communityNews, setCommunityNews] = React.useState(false);
    const [twoFactor, setTwoFactor] = React.useState(false);

    const initials = React.useMemo(() => {
        const letters = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.trim();
        if (letters.length > 0) return letters.toUpperCase();
        return (user?.email?.[0] ?? 'M').toUpperCase();
    }, [user?.firstName, user?.lastName, user?.email]);

    const handleProfileSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        console.info('Profil sauvegardé (simulation).');
    };

    const handlePasswordSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        console.info('Mot de passe mis à jour (simulation).');
    };

    return (
        <>
            <div className="space-y-10">
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-slate-900 text-white shadow-lg">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),transparent_60%)]" />
                    <div className="relative px-6 sm:px-10 py-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
                        <div className="flex items-start gap-6">
                            <label className="relative cursor-pointer">
                                <input type="file" accept="image/*" className="sr-only" />
                                <div className="h-24 w-24 rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-semibold shadow-lg border border-white/30">
                                    {initials}
                                </div>
                                <span className="absolute -bottom-2 -right-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-indigo-600 shadow-md border border-indigo-100">
                                    <Camera className="h-5 w-5" />
                                </span>
                            </label>
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold tracking-wide uppercase">
                                    Profil membre
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-semibold leading-tight">
                                    {user?.firstName} {user?.lastName}
                                </h1>
                                <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
                                    <span className="inline-flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        {user?.email}
                                    </span>
                                    {user?.phone ? (
                                        <span className="inline-flex items-center gap-2">
                                            <Phone className="h-4 w-4" />
                                            {user.phone}
                                        </span>
                                    ) : null}
                                    <span className="inline-flex items-center gap-2">
                                        <Shield className="h-4 w-4" />
                                        Statut : membre actif
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <StatCard title="Présences" value="42" />
                            <StatCard title="Points fidélité" value="260" />
                            <StatCard title="Prochaine session" value="Mer 19h30" />
                            <StatCard title="Rang fidélité" value="Warrior" />
                        </div>
                    </div>
                </section>

                <form onSubmit={handleProfileSubmit} className="space-y-10">
                    <SectionCard title="Informations personnelles">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <label className="flex flex-col gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prénom</span>
                                <input
                                    defaultValue={user?.firstName ?? ''}
                                    placeholder="Votre prénom"
                                    className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40"
                                />
                            </label>
                            <label className="flex flex-col gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nom</span>
                                <input
                                    defaultValue={user?.lastName ?? ''}
                                    placeholder="Votre nom"
                                    className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40"
                                />
                            </label>
                            <label className="flex flex-col gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date de naissance</span>
                                <input
                                    type="date"
                                    className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40"
                                />
                            </label>
                            <label className="flex flex-col gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Genre</span>
                                <select className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40">
                                    <option value="female">Femme</option>
                                    <option value="male">Homme</option>
                                    <option value="non-binary">Non-binaire</option>
                                    <option value="prefer_not_to_say">Je préfère ne pas le préciser</option>
                                </select>
                            </label>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <label className="flex flex-col gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Organisation principale</span>
                                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                                    <MapPin className="h-4 w-4 text-indigo-500" />
                                    Gracie Nova Lyon
                                </div>
                            </label>
                            <label className="flex flex-col gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Discipline favorite</span>
                                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                                    <Activity className="h-4 w-4 text-emerald-500" />
                                    Jiu-jitsu brésilien
                                </div>
                            </label>
                            <label className="flex flex-col gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rôle actuel</span>
                                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                                    <Shield className="h-4 w-4 text-sky-500" />
                                    Membre
                                </div>
                            </label>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400"
                            >
                                Enregistrer les modifications
                            </button>
                        </div>
                    </SectionCard>
                </form>

                <SectionCard title="Coordonnées & réseaux">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                            <Mail className="h-4 w-4 text-indigo-500" />
                            {user?.email ?? ''}
                        </div>
                        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                            <Phone className="h-4 w-4 text-emerald-500" />
                            {user?.phone ?? 'Ajouter un numéro'}
                        </div>
                        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 sm:col-span-2">
                            <MapPin className="h-4 w-4 text-rose-500" />
                            18 Rue du Courreau, 69004 Lyon
                        </div>
                        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 sm:col-span-2">
                            <Calendar className="h-4 w-4 text-slate-500" />
                            Licence fédérale valide jusqu’au 30/09/2025
                        </div>
                    </div>
                </SectionCard>

                <SectionCard title="Notifications & préférences">
                    <div className="space-y-4">
                        <ToggleRow
                            label="Newsletter hebdomadaire"
                            description="Récapitulatif des horaires, stages et résultats de la semaine."
                            enabled={newsletter}
                            onToggle={() => setNewsletter((prev) => !prev)}
                        />
                        <ToggleRow
                            label="Rappels d’entraînement"
                            description="Notification la veille de vos créneaux favoris."
                            enabled={reminders}
                            onToggle={() => setReminders((prev) => !prev)}
                        />
                        <ToggleRow
                            label="Actualités de la communauté"
                            description="Annonces des nouveaux membres, challenges internes et évènements sociaux."
                            enabled={communityNews}
                            onToggle={() => setCommunityNews((prev) => !prev)}
                        />
                    </div>
                </SectionCard>

                <SectionCard title="Sécurité du compte">
                    <form onSubmit={handlePasswordSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <label className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ancien mot de passe</span>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40"
                            />
                        </label>
                        <label className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nouveau mot de passe</span>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40"
                            />
                        </label>
                        <label className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Confirmation</span>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40"
                            />
                        </label>
                        <div className="sm:col-span-3 flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3">
                            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                                <Lock className="h-5 w-5 text-indigo-500" />
                                <div>
                                    <p className="font-semibold text-slate-900 dark:text-white">Authentification à deux facteurs</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Renforcez la sécurité lors des connexions sensibles.</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setTwoFactor((prev) => !prev)}
                                className={`inline-flex h-6 w-11 items-center rounded-full transition ${
                                    twoFactor ? 'bg-indigo-500 justify-end' : 'bg-slate-200 dark:bg-slate-700 justify-start'
                                }`}
                                aria-pressed={twoFactor}
                            >
                                <span className="mx-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white shadow" />
                            </button>
                        </div>
                        <div className="sm:col-span-3 flex justify-end">
                            <button
                                type="submit"
                                className="inline-flex items-center gap-2 rounded-full border border-indigo-600 bg-white px-5 py-2 text-sm font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400"
                            >
                                Mettre à jour la sécurité
                            </button>
                        </div>
                    </form>
                </SectionCard>
            </div>
        </>
    );
};

export default ProfilePage;

