import React, { useState, useEffect } from 'react';
import { Search, Download, Trash2, Ban, CheckCircle } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import Button from '../../shared/components/Button';
import { api } from '../../lib/api';

interface User {
    id: string;
    email: string;
    username: string;
    firstname: string;
    lastname: string;
    is_email_verified: boolean;
    status: 'active' | 'suspended' | 'pending' | 'locked';
    is_super_admin: boolean;
    created_at: string;
    last_login_at: string | null;
    deleted_at?: string | null;
    isDeleted?: boolean;
}

type StatusFilter = 'all' | 'active' | 'suspended' | 'pending' | 'deleted';

const SuperAdminUsersPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await api.get<User[]>('/super-admin/users');
            setUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading users:', error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSuspend = async (userId: string) => {
        try {
            await api.put(`/super-admin/users/${userId}/suspend`);
            await loadUsers();
        } catch (error) {
            console.error('Error suspending user:', error);
            alert('Erreur lors de la suspension');
        }
    };

    const handleActivate = async (userId: string) => {
        try {
            await api.put(`/super-admin/users/${userId}/activate`);
            await loadUsers();
        } catch (error) {
            console.error('Error activating user:', error);
            alert('Erreur lors de l\'activation');
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
        try {
            await api.delete(`/users/${userId}`);
            await loadUsers();
            alert('Utilisateur supprimé avec succès');
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Erreur lors de la suppression');
        }
    };

    const handleRestore = async (userId: string) => {
        try {
            await api.put(`/super-admin/users/${userId}/restore`);
            await loadUsers();
            alert('Utilisateur restauré avec succès');
        } catch (error) {
            console.error('Error restoring user:', error);
            alert('Erreur lors de la restauration');
        }
    };

    const filteredUsers = users.filter((user) => {
        // Filtre par statut (y compris deleted)
        if (statusFilter === 'deleted') {
            if (!user.isDeleted && !user.deleted_at) return false;
        } else if (statusFilter !== 'all') {
            if (user.isDeleted || user.deleted_at) return false; // Exclure les supprimés des autres filtres
            if (user.status !== statusFilter) return false;
        }

        // Filtre par recherche
        const query = searchQuery.toLowerCase();
        const firstname = (user.firstname || '').toLowerCase();
        const lastname = (user.lastname || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        return firstname.includes(query) || lastname.includes(query) || email.includes(query);
    });

    const statusCounts = {
        all: users.length,
        active: users.filter(u => u.status === 'active' && !u.isDeleted && !u.deleted_at).length,
        suspended: users.filter(u => u.status === 'suspended' && !u.isDeleted && !u.deleted_at).length,
        pending: users.filter(u => u.status === 'pending' && !u.isDeleted && !u.deleted_at).length,
        deleted: users.filter(u => u.isDeleted || u.deleted_at).length,
    };

    return (
        <AdminLayout active="members" isSuperAdmin={true}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-4xl font-bold text-[#2A2A2A]">Tous les utilisateurs</h1>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="md" mode="club" icon={Download}>
                            Export CSV
                        </Button>
                    </div>
                </div>

                {/* Filtres par statut */}
                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Tous ({statusCounts.all})
                    </button>
                    <button
                        onClick={() => setStatusFilter('active')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'active'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Actifs ({statusCounts.active})
                    </button>
                    <button
                        onClick={() => setStatusFilter('suspended')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'suspended'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Suspendus ({statusCounts.suspended})
                    </button>
                    <button
                        onClick={() => setStatusFilter('pending')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'pending'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        En attente ({statusCounts.pending})
                    </button>
                    <button
                        onClick={() => setStatusFilter('deleted')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'deleted'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Supprimés ({statusCounts.deleted})
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher par nom ou email"
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
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Statut</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date création</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredUsers.map((user, index) => (
                                        <tr
                                            key={user.id}
                                            className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                                                }`}
                                        >
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => window.location.href = `/superadmin/users/${user.id}`}
                                                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                                                        {(user.firstname?.[0] || '').toUpperCase()}{(user.lastname?.[0] || '').toUpperCase()}
                                                    </div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {user.firstname || ''} {user.lastname || ''}
                                                    </div>
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{user.email || '—'}</td>
                                            <td className="px-6 py-4">
                                                {user.isDeleted || user.deleted_at ? (
                                                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                                                        Supprimé
                                                    </span>
                                                ) : user.status === 'suspended' ? (
                                                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                                                        Suspendu
                                                    </span>
                                                ) : user.status === 'active' ? (
                                                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                                        Actif
                                                    </span>
                                                ) : user.status === 'pending' ? (
                                                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                                                        En attente
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
                                                        {user.status || 'Inactif'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {user.isDeleted || user.deleted_at ? (
                                                        <button
                                                            onClick={() => handleRestore(user.id)}
                                                            className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                                                            title="Restaurer"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <>
                                                            {user.status === 'suspended' ? (
                                                                <button
                                                                    onClick={() => handleActivate(user.id)}
                                                                    className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                                                                    title="Réactiver"
                                                                >
                                                                    <CheckCircle className="w-4 h-4" />
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleSuspend(user.id)}
                                                                    className="p-2 text-gray-400 hover:text-orange-600 transition-colors"
                                                                    title="Suspendre"
                                                                >
                                                                    <Ban className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleDelete(user.id)}
                                                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                                                title="Supprimer"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
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

export default SuperAdminUsersPage;

