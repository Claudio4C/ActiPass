import React from 'react';
import { Calendar, Users, DollarSign, Star, Clock, MapPin, CheckCircle, XCircle } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import Button from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const DashboardPage: React.FC = () => {
    const { user } = useAuth();

    // Données mockées - à remplacer par des appels API
    const stats = {
        totalSlots: 24,
        pendingSlots: 3,
        privateCourses: 8,
        totalRevenue: 1250,
        averageRating: 4.8,
        totalReviews: 42
    };

    const upcomingSlots = [
        {
            id: '1',
            club: 'Club de Tennis Paris',
            date: '2025-01-15',
            time: '10:00 - 11:30',
            type: 'club',
            status: 'confirmed',
            participants: 12
        },
        {
            id: '2',
            club: 'Cours privé',
            date: '2025-01-15',
            time: '14:00 - 15:00',
            type: 'private',
            status: 'pending',
            student: 'Jean Dupont'
        },
        {
            id: '3',
            club: 'Club de Badminton Lyon',
            date: '2025-01-16',
            time: '18:00 - 19:30',
            type: 'club',
            status: 'pending',
            action: 'accept'
        }
    ];

    return (
        <Layout
            title="Tableau de bord Coach"
            subtitle="Gérez votre planning, vos créneaux et votre profil public"
            mode="club"
        >
            <div className="space-y-8">
                {/* Statistiques rapides */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Créneaux ce mois</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalSlots}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            {stats.pendingSlots} en attente de confirmation
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Cours privés</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.privateCourses}</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/20 rounded-xl flex items-center justify-center">
                                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            Ce mois
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Revenus</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalRevenue} €</p>
                            </div>
                            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            Ce mois
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Note moyenne</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.averageRating}</p>
                            </div>
                            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/20 rounded-xl flex items-center justify-center">
                                <Star className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            {stats.totalReviews} avis
                        </p>
                    </div>
                </div>

                {/* Actions rapides */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link to="/coach/planning">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center mr-3">
                                    <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Mon planning</h3>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                                Gérez vos créneaux multi-club et privés
                            </p>
                            <Button variant="outline" size="sm" mode="club">
                                Accéder
                            </Button>
                        </div>
                    </Link>

                    <Link to="/coach/profile">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/20 rounded-lg flex items-center justify-center mr-3">
                                    <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Profil public</h3>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                                Présentation, tarifs et disponibilités
                            </p>
                            <Button variant="outline" size="sm" mode="club">
                                Accéder
                            </Button>
                        </div>
                    </Link>

                    <Link to="/coach/applications">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg flex items-center justify-center mr-3">
                                    <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Candidatures</h3>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                                Postuler aux clubs disponibles
                            </p>
                            <Button variant="outline" size="sm" mode="club">
                                Accéder
                            </Button>
                        </div>
                    </Link>

                    <Link to="/coach/billing">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/20 rounded-lg flex items-center justify-center mr-3">
                                    <DollarSign className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Rémunérations</h3>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                                Suivez vos paiements et factures
                            </p>
                            <Button variant="outline" size="sm" mode="club">
                                Accéder
                            </Button>
                        </div>
                    </Link>
                </div>

                {/* Prochains créneaux */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Prochains créneaux</h2>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Vos créneaux à venir et en attente</p>
                        </div>
                        <Link to="/coach/planning">
                            <Button variant="outline" size="sm" mode="club">
                                Voir tout
                            </Button>
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {upcomingSlots.map((slot) => (
                            <div
                                key={slot.id}
                                className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                        slot.type === 'club' 
                                            ? 'bg-blue-100 dark:bg-blue-500/20' 
                                            : 'bg-purple-100 dark:bg-purple-500/20'
                                    }`}>
                                        {slot.type === 'club' ? (
                                            <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                        ) : (
                                            <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-slate-900 dark:text-white">{slot.club}</h3>
                                            {slot.status === 'confirmed' ? (
                                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                            ) : (
                                                <Clock className="w-4 h-4 text-amber-500" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-600 dark:text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {slot.date}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {slot.time}
                                            </span>
                                            {slot.type === 'club' && slot.participants && (
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-4 h-4" />
                                                    {slot.participants} participants
                                                </span>
                                            )}
                                            {slot.type === 'private' && slot.student && (
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-4 h-4" />
                                                    {slot.student}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {slot.status === 'pending' && slot.action === 'accept' && (
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" mode="club" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                                            Accepter
                                        </Button>
                                        <Button variant="outline" size="sm" mode="club" className="text-red-600 border-red-200 hover:bg-red-50">
                                            Refuser
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default DashboardPage;

