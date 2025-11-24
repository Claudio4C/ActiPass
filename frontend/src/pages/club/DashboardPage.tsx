import React from 'react';
import { Users, Calendar, MessageSquare, Settings, Award, ClipboardList, Wallet, Bell } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import Button from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import { useCurrentOrganisation } from '../../hooks/useCurrentOrganisation';

const DashboardPage: React.FC = () => {
    const { role, metadata } = useCurrentOrganisation();

    if (role === 'coach') {
        return <CoachDashboard />;
    }

    if (role === 'freelance') {
        return <FreelanceDashboard />;
    }

    if (role === 'manager') {
        return <ManagerDashboard />;
    }

    return <MemberDashboard metadata={metadata} />;
};

export default DashboardPage;

const MemberDashboard: React.FC<{ metadata: { title: string; subtitle: string } }> = ({ metadata }) => (
    <Layout title={metadata.title} subtitle={metadata.subtitle} mode="club">
        <DefaultStats />
        <DefaultActions />
    </Layout>
);

const DefaultStats = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 lg:mb-8">
        <StatCard icon={<Users className="w-6 h-6 text-blue-600" />} label="Membres actifs" value="156" tone="blue" />
        <StatCard icon={<Calendar className="w-6 h-6 text-green-600" />} label="Événements ce mois" value="12" tone="green" />
        <StatCard icon={<MessageSquare className="w-6 h-6 text-purple-600" />} label="Messages non lus" value="3" tone="purple" />
    </div>
);

const DefaultActions = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <ActionCard
            icon={<Users className="w-5 h-5 text-blue-600" />}
            title="Gestion des membres"
            description="Inscrire, gérer et suivre vos membres"
            to="/club/members"
        />
        <ActionCard
            icon={<Calendar className="w-5 h-5 text-green-600" />}
            title="Planning"
            description="Organisez vos créneaux et événements"
            to="/club/planning"
        />
        <ActionCard
            icon={<MessageSquare className="w-5 h-5 text-purple-600" />}
            title="Communication"
            description="Messagerie et notifications"
            to="/club/notifications"
        />
        <ActionCard
            icon={<Settings className="w-5 h-5 text-gray-600" />}
            title="Paramètres"
            description="Configuration de votre organisation"
            to="/club/members"
        />
    </div>
);

const CoachDashboard: React.FC = () => {
    const stats = [
        {
            label: 'Créneaux à venir',
            value: '9',
            icon: <Calendar className="w-4 h-4" />,
            badgeClass: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10',
        },
        {
            label: 'Cours privés',
            value: '4',
            icon: <Users className="w-4 h-4" />,
            badgeClass: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10',
        },
        {
            label: 'Demandes reçues',
            value: '3',
            icon: <ClipboardList className="w-4 h-4" />,
            badgeClass: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10',
        },
    ];

    return (
        <Layout title="Espace coach" subtitle="Vos créneaux, coachings privés et échanges" mode="club">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
                {stats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-slate-500">{stat.label}</p>
                                <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{stat.value}</p>
                            </div>
                            <span className={`p-2 rounded-xl ${stat.badgeClass}`}>
                                {stat.icon}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Prochains créneaux</h2>
                        <Link to="/coach/planning">
                            <Button size="sm" mode="club">Voir mon planning</Button>
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {['Club A', 'Cours privé', 'Stage découverte'].map((item) => (
                            <div key={item} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{item}</p>
                                    <p className="text-xs text-slate-500">Demain • 18:00 - 19:30</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" mode="club">
                                        Détails
                                    </Button>
                                    <Button size="sm" mode="club">
                                        Gérer
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Actions rapides</h3>
                    <CoachAction to="/coach/applications" icon={<ClipboardList className="w-4 h-4 text-indigo-500" />} title="Répondre aux clubs" description="Demandes de stages, offres en attente" />
                    <CoachAction to="/coach/profile" icon={<Award className="w-4 h-4 text-purple-500" />} title="Profil public" description="Photo, bio, tarifs, disponibilité" />
                    <CoachAction to="/coach/billing" icon={<Wallet className="w-4 h-4 text-emerald-500" />} title="Rémunérations" description="Revenus, factures, paiements" />
                </div>
            </div>
        </Layout>
    );
};

const FreelanceDashboard: React.FC = () => {
    const stats = [
        { label: 'Demandes privées', value: '5', sub: '+2 cette semaine', tone: 'sky' },
        { label: 'Visios programmées', value: '4', sub: 'sur les 7 prochains jours', tone: 'emerald' },
        { label: 'Note moyenne', value: '4.9', sub: '86 avis confirmés', tone: 'amber' },
    ];

    return (
        <Layout title="Studio indépendant" subtitle="Vos cours privés, disponibilités publiques et clients directs" mode="club">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
                {stats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <p className="text-xs uppercase tracking-wide text-slate-500">{stat.label}</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{stat.value}</p>
                        <p
                            className={`text-xs font-semibold ${
                                stat.tone === 'sky' ? 'text-sky-600' : stat.tone === 'emerald' ? 'text-emerald-600' : 'text-amber-600'
                            }`}
                        >
                            {stat.sub}
                        </p>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Demandes privées</h2>
                        <Link to="/coach/messages">
                            <Button size="sm" mode="club">Ouvrir la messagerie</Button>
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {['Sophie L. • Visio 60 min', 'Club Move Nice • Stage mobilité', 'Marc & Léa • Coaching duo'].map((item) => (
                            <div key={item} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 flex items-center justify-between gap-3">
                                <span className="text-sm font-semibold text-slate-900 dark:text-white">{item}</span>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" mode="club">
                                        Répondre
                                    </Button>
                                    <Button size="sm" mode="club">
                                        Confirmer
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Actions rapides</h3>
                    <CoachAction to="/coach/planning" icon={<Calendar className="w-4 h-4 text-sky-500" />} title="Publier des disponibilités" description="Visio, domicile, mini stage" />
                    <CoachAction to="/coach/profile" icon={<Award className="w-4 h-4 text-purple-500" />} title="Optimiser mon profil public" description="Bio, tarifs packs, zone d’intervention" />
                    <CoachAction to="/coach/billing" icon={<Wallet className="w-4 h-4 text-emerald-500" />} title="Suivre mes revenus" description="Factures & paiements automatiques" />
                </div>
            </div>
        </Layout>
    );
};

const ManagerDashboard: React.FC = () => {
    const managerStats = [
        {
            label: 'Adhésions en attente',
            value: '7',
            icon: <ClipboardList className="w-4 h-4" />,
            badgeClass: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10',
        },
        {
            label: 'Présence ce soir',
            value: '82%',
            icon: <Users className="w-4 h-4" />,
            badgeClass: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10',
        },
        {
            label: 'Alertes',
            value: '2',
            icon: <Bell className="w-4 h-4" />,
            badgeClass: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10',
        },
    ];

    return (
        <Layout title="Espace gestionnaire" subtitle="Vue consolidée des adhésions, finances et opérations" mode="club">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
                {managerStats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-slate-500">{stat.label}</p>
                                <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{stat.value}</p>
                            </div>
                            <span className={`p-2 rounded-xl ${stat.badgeClass}`}>
                                {stat.icon}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            <DefaultActions />
        </Layout>
    );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; tone: 'blue' | 'green' | 'purple' }> = ({ icon, label, value }) => (
    <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mr-4">{icon}</div>
            <div>
                <p className="text-sm font-medium text-gray-600">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    </div>
);

const ActionCard: React.FC<{ icon: React.ReactNode; title: string; description: string; to: string }> = ({
    icon,
    title,
    description,
    to,
}) => (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mr-3">{icon}</div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 text-sm mb-4">{description}</p>
        <Link to={to}>
            <Button variant="outline" size="sm" mode="club">
                Accéder
            </Button>
        </Link>
    </div>
);

const CoachAction: React.FC<{ to: string; icon: React.ReactNode; title: string; description: string }> = ({ to, icon, title, description }) => (
    <Link to={to} className="flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 hover:border-indigo-200 transition-colors">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">{icon}</div>
        <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
        </div>
    </Link>
);
