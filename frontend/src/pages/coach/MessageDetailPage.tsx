import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users, MessageSquare, Send, Paperclip, CheckCircle } from 'lucide-react';
import Layout from '../../components/layout/Layout';

interface MessageDetail {
    id: string;
    subject: string;
    from: string;
    organisation?: string;
    type: 'club' | 'private' | 'stage';
    date: string;
    tags: string[];
    summary: string;
    timeline: Array<{
        id: string;
        author: string;
        role: 'coach' | 'club' | 'student';
        timestamp: string;
        content: string;
        attachments?: Array<{ name: string; size: string }>;
    }>;
}

const conversations: Record<string, MessageDetail> = {
    'msg-001': {
        id: 'msg-001',
        subject: 'Stage découverte – 26 janvier',
        from: 'Gracie Nova Lyon',
        organisation: 'Club Gracie Nova',
        type: 'stage',
        date: 'Il y a 2 heures',
        tags: ['Stage', 'En attente'],
        summary:
            'Organisation d’un stage découverte pour les adhérents adultes. Besoin d’un coach pour 3 heures avec focus initiation au grappling et mobilité.',
        timeline: [
            {
                id: 't-1',
                author: 'Gracie Nova Lyon',
                role: 'club',
                timestamp: 'Aujourd’hui • 10:12',
                content:
                    "Bonjour Hamza,\n\nNous aimerions organiser un stage découverte le dimanche 26 janvier de 9h à 12h pour nos nouveaux adhérents. L’objectif est une initiation ludique au grappling avec un focus mobilité.\n\nSeriez-vous disponible ? Quel tarif proposeriez-vous ?\n\nMerci !\nClara – coordinatrice évènementiel",
                attachments: [
                    { name: 'Brief-stage.pdf', size: '240 Ko' },
                    { name: 'Planning-previsionnel.xlsx', size: '80 Ko' },
                ],
            },
            {
                id: 't-2',
                author: 'Hamza (vous)',
                role: 'coach',
                timestamp: 'Aujourd’hui • 10:45',
                content:
                    "Bonjour Clara,\n\nMerci pour votre message ! Le créneau est libre dans mon planning. Je peux proposer un format progressif : mobilité / drills ludiques / mini-challenges.\n\nTarif : 450 € forfait stage (3h + brief en amont).\n\nSouhaitez-vous que je prévois du matériel spécifique ?",
            },
            {
                id: 't-3',
                author: 'Gracie Nova Lyon',
                role: 'club',
                timestamp: 'Aujourd’hui • 11:02',
                content:
                    "Super, c’est parfait pour nous. Nous devons valider côté direction, réponse sous 48h. Peux-tu nous envoyer ton RIB et préciser si tu peux venir 30 min en avance afin de faire un point logistique ?",
            },
        ],
    },
};

const CoachMessageDetailPage: React.FC = () => {
    const { messageId } = useParams<{ messageId: string }>();
    const conversation = (messageId && conversations[messageId]) ?? conversations['msg-001'];

    return (
        <Layout title="Conversation" subtitle={conversation.subject} mode="club">
            <div className="space-y-6">
                <header className="flex flex-wrap items-center justify-between gap-4">
                    <Link
                        to="/coach/messages"
                        className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Retour aux messages
                    </Link>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {conversation.tags.map((tag) => (
                            <span key={tag} className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                                {tag}
                            </span>
                        ))}
                    </div>
                </header>

                <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-semibold">Club</p>
                            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{conversation.from}</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{conversation.date}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:border-indigo-200 hover:text-indigo-600 transition">
                                <Users className="w-4 h-4" />
                                Ajouter un participant
                            </button>
                            <button className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500">
                                <CheckCircle className="w-4 h-4" />
                                Marquer comme résolu
                            </button>
                        </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{conversation.summary}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-slate-600 dark:text-slate-300">
                        <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 px-3 py-2">
                            <Calendar className="w-4 h-4 text-indigo-500" />
                            Décision sous 48h
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 px-3 py-2">
                            <MapPin className="w-4 h-4 text-emerald-500" />
                            Lyon 4e
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 px-3 py-2">
                            <Users className="w-4 h-4 text-amber-500" />
                            15 participants
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
                    <div className="space-y-6">
                        {conversation.timeline.map((entry) => (
                            <div
                                key={entry.id}
                                className={`flex gap-4 ${entry.role === 'coach' || entry.role === 'freelance' ? 'flex-row-reverse text-right' : 'text-left'}`}
                            >
                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold">
                                    {entry.author.charAt(0)}
                                </div>
                                <div className="flex-1 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{entry.author}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{entry.timestamp}</p>
                                        </div>
                                        {entry.role === 'coach' || entry.role === 'freelance' ? (
                                            <span className="text-xs inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-600">
                                                Vous
                                            </span>
                                        ) : null}
                                    </div>
                                    <p className="mt-3 whitespace-pre-line text-sm text-slate-700 dark:text-slate-200">{entry.content}</p>
                                    {entry.attachments && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {entry.attachments.map((att) => (
                                                <button
                                                    key={att.name}
                                                    className="inline-flex items-center gap-2 text-xs font-medium text-indigo-600 hover:text-indigo-500"
                                                >
                                                    <Paperclip className="w-3 h-3" />
                                                    {att.name} • {att.size}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-4 space-y-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-semibold">Nouvelle réponse</p>
                        <textarea
                            rows={5}
                            placeholder="Rédigez votre réponse..."
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40"
                        />
                        <div className="flex flex-wrap items-center gap-3">
                            <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                <Paperclip className="w-4 h-4" />
                                Joindre un fichier
                            </button>
                            <button className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500">
                                <Send className="w-4 h-4" />
                                Envoyer
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </Layout>
    );
};

export default CoachMessageDetailPage;


