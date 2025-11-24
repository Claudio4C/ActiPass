import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Users, Calendar, Filter, Search, ArrowRight, Check, Clock } from 'lucide-react';
import Layout from '../../components/layout/Layout';

type MessageType = 'club' | 'private' | 'stage';
type MessageStatus = 'new' | 'in_progress' | 'done';

interface CoachMessage {
    id: string;
    from: string;
    organisation?: string;
    avatar?: string;
    type: MessageType;
    subject: string;
    preview: string;
    date: string;
    status: MessageStatus;
    tags?: string[];
    actionLabel?: string;
}

const mockMessages: CoachMessage[] = [
    {
        id: 'msg-001',
        from: 'Gracie Nova Lyon',
        organisation: 'Club Gracie Nova',
        type: 'stage',
        subject: 'Stage découverte – 26 janvier',
        preview: 'Bonjour Hamza, nous organisons un stage découverte pour nos adhérents adultes. Seriez-vous disponible pour animer…',
        date: 'Il y a 2 heures',
        status: 'new',
        tags: ['Stage', 'En attente'],
        actionLabel: 'Répondre',
    },
    {
        id: 'msg-002',
        from: 'Sophie Dupont',
        type: 'private',
        subject: 'Cours privé mardi 14h',
        preview: 'Merci pour le cours d’hier, on confirme le créneau visio mardi prochain. J’aimerais travailler sur…',
        date: 'Hier',
        status: 'in_progress',
        tags: ['Cours privé'],
        actionLabel: 'Confirmer',
    },
    {
        id: 'msg-003',
        from: 'Club Martial 7e',
        type: 'club',
        subject: 'Créneau découverte février',
        preview: 'Notre présidente souhaite mettre en place un créneau découverte pour les nouveaux membres. Quelle serait votre disponibilité…',
        date: 'Lundi 15 janvier',
        status: 'done',
        tags: ['Club', 'Collectif'],
        actionLabel: 'Archiver',
    },
];

const CoachMessagesPage: React.FC = () => {
    return (
        <Layout title="Messages & sollicitations" subtitle="Centralisez vos échanges avec les clubs et vos élèves" mode="club">
            <div className="space-y-6">
                <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <div className="flex flex-wrap items-center gap-3 justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-semibold">
                                Synthèse
                            </p>
                            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">Messages en attente</h1>
                        </div>
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:border-indigo-200 hover:text-indigo-600 transition"
                        >
                            <Filter className="w-4 h-4" />
                            Tous les filtres
                        </button>
                    </div>
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <SummaryCard
                            label="Messages non lus"
                            value="4"
                            highlight="+2 vs sem. dernière"
                            icon={<MessageSquare className="w-5 h-5" />}
                        />
                        <SummaryCard
                            label="Courses privées en attente"
                            value="2"
                            highlight="Confirmations requises"
                            icon={<Users className="w-5 h-5" />}
                        />
                        <SummaryCard
                            label="Demandes de stages"
                            value="1"
                            highlight="Réponse sous 48h"
                            icon={<Calendar className="w-5 h-5" />}
                        />
                    </div>
                </section>

                <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="relative flex-1">
                            <input
                                type="search"
                                placeholder="Rechercher un message, un club ou un élève…"
                                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-3 pl-12 pr-4 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40 shadow-sm transition"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 w-5 h-5 pointer-events-none" />
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            <button className="px-4 py-2 rounded-full bg-indigo-600 text-white">Tous</button>
                            <button className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 hover:border-indigo-200 hover:text-indigo-600">
                                Clubs
                            </button>
                            <button className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 hover:border-indigo-200 hover:text-indigo-600">
                                Cours privés
                            </button>
                            <button className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 hover:border-indigo-200 hover:text-indigo-600">
                                Offres & stages
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {mockMessages.map((message) => (
                            <article
                                key={message.id}
                                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-indigo-200 transition-colors"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-slate-900 dark:text-white">{message.from}</span>
                                            {message.organisation ? (
                                                <span className="text-xs text-slate-500 dark:text-slate-400">• {message.organisation}</span>
                                            ) : null}
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{message.date}</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        {message.tags?.map((tag) => (
                                            <span key={tag} className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                                                {tag}
                                            </span>
                                        ))}
                                        <StatusBadge status={message.status} />
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{message.subject}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mt-1">{message.preview}</p>
                                </div>
                                <div className="mt-4 flex items-center gap-3">
                                    <Link
                                        to={`/coach/messages/${message.id}`}
                                        className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                    >
                                        <ArrowRight className="w-4 h-4" />
                                        {message.actionLabel ?? 'Ouvrir'}
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            </div>
        </Layout>
    );
};

export default CoachMessagesPage;

const SummaryCard: React.FC<{ label: string; value: string; highlight?: string; icon?: React.ReactNode }> = ({ label, value, highlight, icon }) => (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex items-center justify-between">
        <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">{value}</p>
            {highlight ? <p className="text-xs text-slate-500 dark:text-slate-400">{highlight}</p> : null}
        </div>
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
            {icon}
        </div>
    </div>
);

const StatusBadge: React.FC<{ status: MessageStatus }> = ({ status }) => {
    if (status === 'new') {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                <Check className="w-3 h-3" />
                Nouveau
            </span>
        );
    }
    if (status === 'in_progress') {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                <Clock className="w-3 h-3" />
                À traiter
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            <Check className="w-3 h-3" />
            Traité
        </span>
    );
};


