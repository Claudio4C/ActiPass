import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { CreditCard, Wallet, Receipt, Calendar, AlertCircle, Download } from 'lucide-react';

const SubscriptionSummary: React.FC<{ title: string; value: string; descriptor?: string }> = ({ title, value, descriptor }) => (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-4 transition-colors">
        <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</div>
        <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{value}</div>
        {descriptor ? <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{descriptor}</div> : null}
    </div>
);

const SubscriptionPage: React.FC = () => {
    const { user } = useAuth();
    const [autoRenew, setAutoRenew] = React.useState(true);

    const upcomingInvoices = [
        { id: 'inv-001', label: 'Mensualité mai 2025', amount: '39,90 €', dueDate: '05/05/2025', status: 'À venir' },
        { id: 'inv-000', label: 'Mensualité avril 2025', amount: '39,90 €', dueDate: '05/04/2025', status: 'Payée' },
        { id: 'inv-999', label: 'Pack 10 séances', amount: '120,00 €', dueDate: '15/03/2025', status: 'Payée' },
    ];

    const paymentMethods = [
        { id: 'cb-default', type: 'Carte bancaire', masked: '**** **** **** 8421', expiry: '08/27', isDefault: true },
        { id: 'wallet', type: 'Portefeuille club', masked: 'Solde : 45,00 €', expiry: 'Illimité', isDefault: false },
    ];

    return (
        <>
            <div className="space-y-10">
                <section className="rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-slate-900 text-white shadow-lg overflow-hidden">
                    <div className="px-6 sm:px-10 py-10 space-y-8 relative">
                        <div>
                            <p className="text-sm uppercase tracking-[0.2em] text-white/70">Synthèse de votre abonnement</p>
                            <h1 className="text-3xl sm:text-4xl font-semibold leading-tight mt-3">Pack Premium annuel</h1>
                            <p className="text-sm text-white/85 mt-3 max-w-3xl">
                                Vous bénéficiez d’un accès illimité aux cours collectifs, des ateliers compétiteurs et de la plateforme vidéo. Vous pouvez ajuster votre formule ou mettre à jour vos moyens de paiement à tout moment.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
                            <SubscriptionSummary title="Prochaine échéance" value="05 mai 2025" descriptor="39,90 € TTC" />
                            <SubscriptionSummary title="Moyen de paiement" value="Carte Visa •••• 8421" descriptor="Expire 08/2027" />
                            <SubscriptionSummary title="Points fidélité" value="260" descriptor="Unlock: -10% stage" />
                            <SubscriptionSummary title="Engagement" value="Jusqu’au 31/12/2025" descriptor="Puis renouvellement mensuel" />
                        </div>
                    </div>
                </section>

                <section className="bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6 transition-colors">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Moyens de paiement</h2>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Gérez vos cartes bancaires, votre portefeuille club et vos mandats SEPA.</p>
                        </div>
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400"
                        >
                            <CreditCard className="h-4 w-4" />
                            Ajouter une carte
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {paymentMethods.map((method) => (
                            <div key={method.id} className={`rounded-2xl border ${method.isDefault ? 'border-indigo-200 dark:border-indigo-500/60' : 'border-slate-200 dark:border-slate-700'} bg-white dark:bg-slate-900 px-4 py-4 shadow-sm space-y-2 transition-colors`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                                        {method.type === 'Carte bancaire' ? <CreditCard className="h-4 w-4 text-indigo-500" /> : <Wallet className="h-4 w-4 text-emerald-500" />}
                                        {method.type}
                                    </div>
                                    {method.isDefault ? (
                                        <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-600">Défaut</span>
                                    ) : null}
                                </div>
                                <div className="text-sm text-slate-600 dark:text-slate-300">{method.masked}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">Expiration : {method.expiry}</div>
                                <div className="flex items-center gap-2 text-xs">
                                    <button type="button" className="text-indigo-600 hover:text-indigo-500">Définir par défaut</button>
                                    <span className="text-slate-300 dark:text-slate-600">•</span>
                                    <button type="button" className="text-slate-500 dark:text-slate-400 hover:text-slate-700">Supprimer</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-indigo-500" />
                            <div>
                                <p className="font-semibold text-slate-900 dark:text-white">Renouvellement automatique</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Vous serez débité automatiquement chaque mois avant la date d’échéance.</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setAutoRenew((prev) => !prev)}
                            className={`inline-flex h-6 w-11 items-center rounded-full transition ${autoRenew ? 'bg-indigo-500 justify-end' : 'bg-slate-200 dark:bg-slate-700 justify-start'}`}
                            aria-pressed={autoRenew}
                        >
                            <span className="mx-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white shadow" />
                        </button>
                    </div>
                </section>

                <section className="bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6 transition-colors">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Historique & factures</h2>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Téléchargez vos justificatifs ou signalez un problème de facturation.</p>
                        </div>
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600"
                        >
                            <Download className="h-4 w-4" />
                            Exporter l’historique
                        </button>
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                        <table className="min-w-full text-sm text-slate-700 dark:text-slate-200">
                            <thead className="bg-slate-50 dark:bg-slate-800 text-left text-xs font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-wide">
                                <tr>
                                    <th className="px-4 py-3">Facture</th>
                                    <th className="px-4 py-3">Montant</th>
                                    <th className="px-4 py-3">Échéance</th>
                                    <th className="px-4 py-3">Statut</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {upcomingInvoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/70">
                                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{invoice.label}</td>
                                        <td className="px-4 py-3">{invoice.amount}</td>
                                        <td className="px-4 py-3">{invoice.dueDate}</td>
                                        <td className="px-4 py-3">
                                            {invoice.status === 'Payée' ? (
                                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                                                    Payée
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-600">
                                                    À venir
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button type="button" className="text-indigo-600 hover:text-indigo-500">
                                                Télécharger
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 dark:border-amber-500/50 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                        <div>
                            <p className="font-semibold">Besoin d’aide ?</p>
                            <p className="text-xs text-amber-600 dark:text-amber-300">Pour toute question de facturation, contactez finance@gracienova.fr ou passez à l’accueil avant votre prochain cours.</p>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
};

export default SubscriptionPage;
