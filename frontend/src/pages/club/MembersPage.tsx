import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Mail, Globe, QrCode, CalendarDays, Trophy } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrentOrganisation } from '../../hooks/useCurrentOrganisation';

const ClubMembersPage: React.FC = () => {
    const { user } = useAuth();
    const { organisation } = useCurrentOrganisation();

    const fullName = useMemo(() => {
        const first = user?.firstName?.trim() ?? '';
        const last = user?.lastName?.trim() ?? '';
        return `${first} ${last}`.trim() || user?.email || 'Membre';
    }, [user]);

    const memberNumber = useMemo(() => {
        // Affichage stable (sans dépendre du backend), suffisant pour la maquette UI.
        const seed = (user?.id || user?.email || 'member').replace(/[^a-z0-9]/gi, '').slice(-6).toUpperCase();
        return `N° ${seed || '000000'}`;
    }, [user]);

    const renewalLabel = useMemo(() => {
        const d = new Date();
        d.setMonth(d.getMonth() + 2);
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    }, []);

    return (
        <div className="space-y-6">
            {/* Hero */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 px-6 py-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <Link
                                to="/home"
                                className="inline-flex items-center gap-2 text-xs font-medium text-white/90 hover:text-white transition"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Retour au tableau de bord
                            </Link>

                            <div className="mt-3 text-[11px] tracking-wide uppercase text-white/80">
                                {organisation?.type ? `${organisation.type} · association` : 'Sport · association'}
                            </div>
                            <h1 className="text-2xl font-semibold text-white truncate">
                                {organisation?.name || 'Mon association'}
                            </h1>

                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/90">
                                <span className="inline-flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5" />
                                    Poissy
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <Phone className="h-3.5 w-3.5" />
                                    01 39 00 00 00
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <Mail className="h-3.5 w-3.5" />
                                    contact@basketball-poissy.fr
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <Globe className="h-3.5 w-3.5" />
                                    www.basketball-poissy.fr
                                </span>
                            </div>
                        </div>

                        <div className="hidden sm:flex items-center justify-center">
                            <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/20" />
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <HeroStat label="Membres famille" value="1" />
                        <HeroStat label="Cours / sem" value="2" />
                        <HeroStat label="Statut" value="À jour" />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Espace membre</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Votre carte de membre numérique</p>
                    </div>

                    {/* Member card */}
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <div className="text-[11px] tracking-wide uppercase text-white/70">Carte de membre</div>
                                <div className="mt-1 text-lg font-semibold truncate">
                                    {organisation?.name || 'Association'}
                                </div>
                                <div className="mt-4">
                                    <div className="text-xs text-white/70">Titulaire</div>
                                    <div className="text-sm font-semibold truncate">{fullName}</div>
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <div className="text-white/70">N° adhérent</div>
                                        <div className="font-semibold">{memberNumber}</div>
                                    </div>
                                    <div>
                                        <div className="text-white/70">Saison</div>
                                        <div className="font-semibold">
                                            {new Date().getFullYear()} - {new Date().getFullYear() + 1}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="shrink-0">
                                <div className="h-14 w-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
                                    <QrCode className="h-7 w-7 text-white/80" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom tiles */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <MiniTile
                            icon={<span className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Trophy className="h-5 w-5" /></span>}
                            label="Actif"
                            sub="Statut"
                        />
                        <MiniTile
                            icon={<span className="h-9 w-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center"><CalendarDays className="h-5 w-5" /></span>}
                            label={renewalLabel}
                            sub="Renouvellement"
                        />
                        <MiniTile
                            icon={<span className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><QrCode className="h-5 w-5" /></span>}
                            label="24 / 28"
                            sub="Présences"
                        />
                    </div>
                </div>

                {/* Right column placeholder (pour coller à la maquette: vide/respire) */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Résumé</div>
                    <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Ici, on pourra afficher les infos d’adhésion (paiements, documents, prochains cours).
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClubMembersPage;

const HeroStat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="rounded-xl bg-white/10 border border-white/15 px-4 py-3">
        <div className="text-[11px] text-white/75">{label}</div>
        <div className="mt-1 text-lg font-semibold text-white">{value}</div>
    </div>
);

const MiniTile: React.FC<{ icon: React.ReactNode; label: string; sub: string }> = ({ icon, label, sub }) => (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div className="flex items-center gap-3">
            {icon}
            <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{label}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{sub}</div>
            </div>
        </div>
    </div>
);
