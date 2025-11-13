import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Download, Trash2, RotateCcw } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import Button from '../../shared/components/Button';
import { api } from '../../lib/api';

interface Organisation {
    id: string;
    name: string;
    description?: string;
    status: 'active' | 'suspended' | 'pending_validation';
    isDeleted: boolean;
    created_at: string;
    deleted_at?: string | null;
}

type StatusFilter = 'all' | 'active' | 'suspended' | 'pending_validation' | 'deleted';

const SuperAdminOrganisationsPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [organisations, setOrganisations] = useState<Organisation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const prevPathnameRef = useRef<string>(location.pathname);

    useEffect(() => {
        loadOrganisations();
    }, []);

    // Recharger les organisations quand on revient sur cette page
    useEffect(() => {
        if (prevPathnameRef.current !== location.pathname && location.pathname === '/superadmin/organisations') {
            loadOrganisations();
        }
        prevPathnameRef.current = location.pathname;
    }, [location.pathname]);

    const loadOrganisations = async () => {
        try {
            setLoading(true);
            const data = await api.get<Organisation[]>('/super-admin/organisations');
            setOrganisations(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading organisations:', error);
            setOrganisations([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (orgId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette organisation ?')) return;
        try {
            await api.delete(`/super-admin/organisations/${orgId}`);
            await loadOrganisations();
            alert('Organisation supprimée avec succès');
        } catch (error) {
            console.error('Error deleting organisation:', error);
            alert('Erreur lors de la suppression');
        }
    };

    const handlePermanentDelete = async (orgId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement cette organisation ? Cette action est irréversible.')) return;
        try {
            await api.delete(`/super-admin/organisations/${orgId}/permanent`);
            await loadOrganisations();
            alert('Organisation supprimée définitivement');
        } catch (error) {
            console.error('Error permanently deleting organisation:', error);
            alert('Erreur lors de la suppression définitive');
        }
    };

    const handleRestore = async (orgId: string) => {
        try {
            await api.put(`/super-admin/organisations/${orgId}/restore`);
            await loadOrganisations();
            alert('Organisation restaurée avec succès');
        } catch (error) {
            console.error('Error restoring organisation:', error);
            alert('Erreur lors de la restauration');
        }
    };

    const filteredOrganisations = organisations.filter((org) => {
        // Filtre par statut (y compris deleted)
        if (statusFilter === 'deleted') {
            if (!org.isDeleted && !org.deleted_at) return false;
        } else if (statusFilter !== 'all') {
            if (org.isDeleted || org.deleted_at) return false; // Exclure les supprimés des autres filtres
            if (org.status !== statusFilter) return false;
        }

        // Filtre par recherche
        return org.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const statusCounts = {
        all: organisations.length,
        active: organisations.filter(o => o.status === 'active' && !o.isDeleted && !o.deleted_at).length,
        suspended: organisations.filter(o => o.status === 'suspended' && !o.isDeleted && !o.deleted_at).length,
        pending_validation: organisations.filter(o => o.status === 'pending_validation' && !o.isDeleted && !o.deleted_at).length,
        deleted: organisations.filter(o => o.isDeleted || o.deleted_at).length,
    };

    return (
        <AdminLayout active="assos" isSuperAdmin={true}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-4xl font-bold text-[#2A2A2A]">Toutes les organisations</h1>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="md" mode="club" icon={Download}>
                            Export CSV
                        </Button>
                    </div>
                </div>

                {/* Filtres par statut */}
                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200 flex-wrap">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Toutes ({statusCounts.all})
                    </button>
                    <button
                        onClick={() => setStatusFilter('active')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'active'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Actives ({statusCounts.active})
                    </button>
                    <button
                        onClick={() => setStatusFilter('suspended')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'suspended'
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Suspendues ({statusCounts.suspended})
                    </button>
                    <button
                        onClick={() => setStatusFilter('pending_validation')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'pending_validation'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        En attente ({statusCounts.pending_validation})
                    </button>
                    <button
                        onClick={() => setStatusFilter('deleted')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'deleted'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Supprimées ({statusCounts.deleted})
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher par nom"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20 bg-white rounded-2xl">
                        <div className="text-gray-500">Chargement...</div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nom</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Description</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Statut</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date création</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredOrganisations.map((org, index) => (
                                        <tr
                                            key={org.id}
                                            className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                                                }`}
                                        >
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => navigate(`/superadmin/organisations/${org.id}`)}
                                                    className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                                >
                                                    {org.name}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {org.description || '—'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {org.isDeleted || org.deleted_at ? (
                                                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                                                        Supprimée
                                                    </span>
                                                ) : org.status === 'suspended' ? (
                                                    <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
                                                        Suspendue
                                                    </span>
                                                ) : org.status === 'pending_validation' ? (
                                                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                                                        En attente
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                                        Active
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(org.created_at).toLocaleDateString('fr-FR')}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {org.isDeleted ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleRestore(org.id)}
                                                                className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                                                                title="Restaurer"
                                                            >
                                                                <RotateCcw className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handlePermanentDelete(org.id)}
                                                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                                                title="Supprimer définitivement"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleDelete(org.id)}
                                                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default SuperAdminOrganisationsPage;

