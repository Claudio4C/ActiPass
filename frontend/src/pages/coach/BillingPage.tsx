import React, { useState } from 'react';
import { DollarSign, Calendar, Download, FileText, TrendingUp, Users } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';

interface Payment {
    id: string;
    period: string;
    club?: string;
    type: 'club' | 'private';
    amount: number;
    status: 'pending' | 'paid' | 'overdue';
    dueDate: string;
    paidDate?: string;
    details: {
        sessions: number;
        participants?: number;
        rate?: number;
    };
}

const BillingPage: React.FC = () => {
    const { user } = useAuth();
    const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');

    // Données mockées
    const stats = {
        totalEarnings: 3250,
        pendingPayments: 850,
        thisMonth: 1250,
        lastMonth: 2000
    };

    const payments: Payment[] = [
        {
            id: '1',
            period: 'Janvier 2025',
            club: 'Club de Tennis Paris',
            type: 'club',
            amount: 850,
            status: 'pending',
            dueDate: '2025-02-05',
            details: {
                sessions: 12,
                participants: 120,
                rate: 30
            }
        },
        {
            id: '2',
            period: 'Décembre 2024',
            club: 'Club de Badminton Lyon',
            type: 'club',
            amount: 600,
            status: 'paid',
            dueDate: '2025-01-05',
            paidDate: '2025-01-03',
            details: {
                sessions: 8,
                participants: 80,
                rate: 30
            }
        },
        {
            id: '3',
            period: 'Décembre 2024',
            type: 'private',
            amount: 400,
            status: 'paid',
            dueDate: '2025-01-05',
            paidDate: '2025-01-02',
            details: {
                sessions: 8
            }
        }
    ];

    const getStatusBadge = (status: Payment['status']) => {
        switch (status) {
            case 'paid':
                return (
                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-medium">
                        Payé
                    </span>
                );
            case 'pending':
                return (
                    <span className="px-3 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 rounded-full text-xs font-medium">
                        En attente
                    </span>
                );
            case 'overdue':
                return (
                    <span className="px-3 py-1 bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300 rounded-full text-xs font-medium">
                        En retard
                    </span>
                );
        }
    };

    return (
        <Layout
            title="Rémunérations"
            subtitle="Suivez vos paiements, factures et rémunérations des clubs"
            mode="club"
        >
            <div className="space-y-6">
                {/* Statistiques */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total gagné</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalEarnings} €</p>
                            </div>
                            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            Toutes périodes confondues
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">En attente</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.pendingPayments} €</p>
                            </div>
                            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/20 rounded-xl flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            Paiements à venir
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Ce mois</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.thisMonth} €</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            Janvier 2025
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Mois dernier</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.lastMonth} €</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/20 rounded-xl flex items-center justify-center">
                                <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            Décembre 2024
                        </p>
                    </div>
                </div>

                {/* Filtres */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Période :</span>
                        <div className="flex items-center gap-2">
                            {(['month', 'quarter', 'year'] as const).map((period) => (
                                <button
                                    key={period}
                                    onClick={() => setSelectedPeriod(period)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        selectedPeriod === period
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {period === 'month' ? 'Mois' : period === 'quarter' ? 'Trimestre' : 'Année'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Liste des paiements */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Historique des rémunérations</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-slate-50 dark:bg-slate-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Période
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Détails
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Montant
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Statut
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                                {payments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-900 dark:text-white">
                                                {payment.period}
                                            </div>
                                            {payment.club && (
                                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                                    {payment.club}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                payment.type === 'club'
                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300'
                                                    : 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300'
                                            }`}>
                                                {payment.type === 'club' ? 'Club' : 'Privé'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-900 dark:text-white">
                                                {payment.details.sessions} séance{payment.details.sessions > 1 ? 's' : ''}
                                            </div>
                                            {payment.details.participants && (
                                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                                    <Users className="w-3 h-3 inline mr-1" />
                                                    {payment.details.participants} participants
                                                </div>
                                            )}
                                            {payment.details.rate && (
                                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                                    {payment.details.rate} €/heure
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-slate-900 dark:text-white">
                                                {payment.amount} €
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(payment.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-900 dark:text-white">
                                                {payment.status === 'paid' && payment.paidDate
                                                    ? `Payé le ${payment.paidDate}`
                                                    : `Échéance : ${payment.dueDate}`
                                                }
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1 ml-auto">
                                                <Download className="w-4 h-4" />
                                                Facture
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Information sur le système de paiement */}
                <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/50 rounded-2xl p-6">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
                                Comment fonctionne le système de rémunération ?
                            </h3>
                            <ul className="text-sm text-indigo-800 dark:text-indigo-200 space-y-2 list-disc list-inside">
                                <li>Les rémunérations sont calculées automatiquement en fonction du nombre de participants ou d'un forfait défini par le club.</li>
                                <li>Les paiements sont versés à la fin de chaque période (mois/trimestre) après validation du club.</li>
                                <li>Vous recevrez une notification lorsque votre rémunération est prête à être versée.</li>
                                <li>Les factures sont disponibles en téléchargement dès que le paiement est validé.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default BillingPage;

