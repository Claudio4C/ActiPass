import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Ban, CheckCircle } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import Button from '../../shared/components/Button';
import { api } from '../../lib/api';

interface User {
    id: string;
    email: string;
    username: string;
    firstname: string;
    lastname: string;
    phone?: string;
    is_email_verified: boolean;
    status: 'active' | 'suspended' | 'pending' | 'locked';
    is_super_admin: boolean;
    created_at: string;
    last_login_at: string | null;
}

const SuperAdminUserDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        firstname: '',
        lastname: '',
        phone: '',
    });

    useEffect(() => {
        if (id) {
            loadUser();
        }
    }, [id]);

    const loadUser = async () => {
        try {
            setLoading(true);
            const response = await api.get<{ user: User }>(`/users/${id}`);
            const userData = response.user;
            setUser(userData);
            setFormData({
                email: userData.email || '',
                username: userData.username || '',
                firstname: userData.firstname || '',
                lastname: userData.lastname || '',
                phone: userData.phone || '',
            });
        } catch (error) {
            console.error('Error loading user:', error);
            alert('Erreur lors du chargement de l\'utilisateur');
            navigate('/superadmin/users');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!id) return;
        try {
            setSaving(true);
            await api.put(`/users/${id}`, formData);
            await loadUser();
            alert('Utilisateur mis à jour avec succès');
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Erreur lors de la mise à jour');
        } finally {
            setSaving(false);
        }
    };

    const handleSuspend = async () => {
        if (!id || !confirm('Êtes-vous sûr de vouloir suspendre cet utilisateur ?')) return;
        try {
            await api.put(`/super-admin/users/${id}/suspend`);
            await loadUser();
        } catch (error) {
            console.error('Error suspending user:', error);
            alert('Erreur lors de la suspension');
        }
    };

    const handleActivate = async () => {
        if (!id) return;
        try {
            await api.put(`/super-admin/users/${id}/activate`);
            await loadUser();
        } catch (error) {
            console.error('Error activating user:', error);
            alert('Erreur lors de l\'activation');
        }
    };

    const handleDelete = async () => {
        if (!id || !confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
        try {
            await api.delete(`/users/${id}`);
            alert('Utilisateur supprimé avec succès');
            navigate('/superadmin/users');
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Erreur lors de la suppression');
        }
    };

    if (loading) {
        return (
            <AdminLayout active="members" isSuperAdmin={true}>
                <div className="flex items-center justify-center py-20">
                    <div className="text-gray-500">Chargement...</div>
                </div>
            </AdminLayout>
        );
    }

    if (!user) {
        return (
            <AdminLayout active="members" isSuperAdmin={true}>
                <div className="flex items-center justify-center py-20">
                    <div className="text-gray-500">Utilisateur non trouvé</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout active="members" isSuperAdmin={true}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/superadmin/users')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-4xl font-bold text-[#2A2A2A]">
                            {user.firstname} {user.lastname}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        {user.status === 'suspended' ? (
                            <Button
                                variant="secondary"
                                size="md"
                                mode="club"
                                icon={CheckCircle}
                                onClick={handleActivate}
                            >
                                Réactiver
                            </Button>
                        ) : (
                            <Button
                                variant="secondary"
                                size="md"
                                mode="club"
                                icon={Ban}
                                onClick={handleSuspend}
                            >
                                Suspendre
                            </Button>
                        )}
                        <Button
                            variant="secondary"
                            size="md"
                            mode="club"
                            icon={Trash2}
                            onClick={handleDelete}
                        >
                            Supprimer
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl p-6 border border-gray-100">
                            <h2 className="text-xl font-bold text-[#2A2A2A] mb-6">Informations personnelles</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nom d'utilisateur
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Prénom
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.firstname}
                                            onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nom
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.lastname}
                                            onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Téléphone
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="pt-4">
                                    <Button
                                        variant="primary"
                                        size="md"
                                        mode="club"
                                        icon={Save}
                                        onClick={handleSave}
                                        disabled={saving}
                                    >
                                        {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl p-6 border border-gray-100">
                            <h2 className="text-xl font-bold text-[#2A2A2A] mb-4">Statut</h2>
                            <div className="space-y-4">
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">Statut</div>
                                    {user.status === 'suspended' ? (
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
                                            {user.status}
                                        </span>
                                    )}
                                </div>
                                <div className="pt-2">
                                    {user.status === 'suspended' ? (
                                        <Button
                                            variant="primary"
                                            size="md"
                                            mode="club"
                                            icon={CheckCircle}
                                            onClick={handleActivate}
                                            className="w-full"
                                        >
                                            Réactiver l'utilisateur
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="secondary"
                                            size="md"
                                            mode="club"
                                            icon={Ban}
                                            onClick={handleSuspend}
                                            className="w-full"
                                        >
                                            Suspendre l'utilisateur
                                        </Button>
                                    )}
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">Email vérifié</div>
                                    <div className="text-sm font-medium text-gray-900">
                                        {user.is_email_verified ? 'Oui' : 'Non'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">Super Admin</div>
                                    <div className="text-sm font-medium text-gray-900">
                                        {user.is_super_admin ? 'Oui' : 'Non'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">Date de création</div>
                                    <div className="text-sm font-medium text-gray-900">
                                        {new Date(user.created_at).toLocaleDateString('fr-FR')}
                                    </div>
                                </div>
                                {user.last_login_at && (
                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">Dernière connexion</div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {new Date(user.last_login_at).toLocaleDateString('fr-FR')}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default SuperAdminUserDetailPage;

