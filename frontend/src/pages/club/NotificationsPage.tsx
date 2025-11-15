import React from 'react';
import Layout from '../../components/layout/Layout';

const cardClass = 'rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-100 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6 transition-colors';

const defaultClubInfo = {
    title: 'Notifications du club',
    subtitle: 'Consultez vos alertes, rappels et actualités importantes.',
};

type ClubMetadata = {
    name?: string;
    subtitle?: string;
};

type NotificationItem = {
    id: string;
    title: string;
    description: string;
    date: string;
    category: 'planning' | 'facturation' | 'evenement' | 'general';
    unread?: boolean;
};

const categoryLabel: Record<NotificationItem['category'], string> = {
    planning: 'Planning',
    facturation: 'Facturation',
    evenement: 'Évènement',
    general: 'Annonce',
};

const NotificationsPage: React.FC = () => {
    const [clubInfo, setClubInfo] = React.useState(() => {
        if (typeof window === 'undefined') return defaultClubInfo;
        try {
            const raw = window.localStorage.getItem('selectedOrganisation');
            if (!raw) return defaultClubInfo;
            const parsed = JSON.parse(raw) as ClubMetadata | null;
            if (!parsed) return defaultClubInfo;
            return {
                title: parsed.name ? `Notifications – ${parsed.name}` : defaultClubInfo.title,
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
                    title: parsed.name ? `Notifications – ${parsed.name}` : defaultClubInfo.title,
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

    const notifications: NotificationItem[] = [
        {
            id: 'notif-1',
            title: 'Cours exceptionnel no-gi ajouté ce samedi',
            description: 'Session supplémentaire avec Coach Hamza, réservations ouvertes (20 places).',
            date: 'Aujourd’hui • 09:12',
            category: 'planning',
            unread: true,
        },
        {
            id: 'notif-2',
            title: 'Facture d’avril disponible',
            description: 'Votre prélèvement automatique sera effectué le 05/04/2025 (39,90 €).',
            date: 'Hier • 18:24',
            category: 'facturation',
        },
        {
            id: 'notif-3',
            title: 'Stage compétiteurs Lyon Fight Week',
            description: 'Inscription prioritaire pour les membres jusqu’au 15/04. Places limitées.',
            date: '02/04/2025 • 14:05',
            category: 'evenement',
        },
        {
            id: 'notif-4',
            title: 'Mise à jour du règlement intérieur',
            description: 'Consultez les changements sur les règles de sécurité et le prêt de matériel.',
            date: '28/03/2025 • 09:40',
            category: 'general',
        },
    ];

    const unreadCount = notifications.filter((item) => item.unread).length;

    return (
        <Layout title={clubInfo.title} subtitle={clubInfo.subtitle} mode="club">
            <div className="space-y-10 text-slate-900 dark:text-slate-100">
                <section className={cardClass}>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Dernières notifications</h2>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                                Restez informé des cours ajoutés, rappels de facturation et évènements liés à votre club.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-600">
                                {unreadCount} non lues
                            </span>
                            <button type="button" className="underline-offset-2 hover:underline">
                                Tout marquer comme lu
                            </button>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {notifications.map((item) => (
                            <article
                                key={item.id}
                                className={`rounded-2xl border px-4 py-4 transition ${
                                    item.unread
                                        ? 'border-indigo-200 bg-indigo-50/60 dark:border-indigo-500/40 dark:bg-indigo-500/10'
                                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                                {categoryLabel[item.category]}
                                            </span>
                                            {item.unread ? (
                                                <span className="inline-flex h-2 w-2 rounded-full bg-indigo-500" />
                                            ) : null}
                                        </div>
                                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{item.date}</div>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className={cardClass}>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Gestion des alertes</h2>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                            Choisissez les alertes à recevoir pour ce club. Les préférences globales restent disponibles dans « Mon profil ».
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-4 text-sm text-slate-700 dark:text-slate-200">
                            <h3 className="font-semibold text-slate-900 dark:text-white">Cours & planning</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Alertes pour les annulations, nouveaux créneaux et modifications de coach.</p>
                            <label className="mt-4 inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                <input type="checkbox" className="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-900 text-indigo-500" defaultChecked />
                                Notifications push / email
                            </label>
                        </div>
                        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-4 text-sm text-slate-700 dark:text-slate-200">
                            <h3 className="font-semibold text-slate-900 dark:text-white">Facturation & paiements</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Rappels d’échéances, factures disponibles et incidents de prélèvement.</p>
                            <label className="mt-4 inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                <input type="checkbox" className="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-900 text-indigo-500" defaultChecked />
                                Email uniquement
                            </label>
                        </div>
                        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-4 text-sm text-slate-700 dark:text-slate-200">
                            <h3 className="font-semibold text-slate-900 dark:text-white">Évènements & actu</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Stages, compétitions internes, nouveautés boutique et annonces importantes.</p>
                            <label className="mt-4 inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                <input type="checkbox" className="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-900 text-indigo-500" />
                                Notifications push seulement
                            </label>
                        </div>
                    </div>
                </section>
            </div>
        </Layout>
    );
};

export default NotificationsPage;
