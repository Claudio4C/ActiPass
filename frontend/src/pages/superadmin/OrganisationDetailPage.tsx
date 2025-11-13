import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, RotateCcw } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import Button from '../../shared/components/Button';
import { api } from '../../lib/api';

interface Organisation {
    id: string;
    name: string;
    description?: string | null;
    type: 'sport' | 'culture' | 'loisir' | 'social' | 'other';
    logo_url?: string | null;
    email?: string | null;
    phone?: string | null;
    website_url?: string | null;
    address?: string | null;
    city?: string | null;
    zip_code?: string | null;
    country?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    member_limit?: number | null;
    is_public: boolean;
    status: 'active' | 'suspended' | 'pending_validation';
    isDeleted: boolean;
    created_at: string;
    deleted_at?: string | null;
}

const SuperAdminOrganisationDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [organisation, setOrganisation] = useState<Organisation | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'sport' as 'sport' | 'culture' | 'loisir' | 'social' | 'other',
        logo_url: '',
        email: '',
        phone: '',
        website_url: '',
        address: '',
        city: '',
        zip_code: '',
        country: '',
        member_limit: '',
        is_public: true,
        status: 'active' as 'active' | 'suspended' | 'pending_validation',
    });

    useEffect(() => {
        if (id) {
            loadOrganisation();
        }
    }, [id]);

    const loadOrganisation = async () => {
        try {
            setLoading(true);
            const org = await api.get<Organisation>(`/super-admin/organisations/${id}`);
            setOrganisation(org);
            setFormData({
                name: org.name || '',
                description: org.description || '',
                type: org.type || 'sport',
                logo_url: org.logo_url || '',
                email: org.email || '',
                phone: org.phone || '',
                website_url: org.website_url || '',
                address: org.address || '',
                city: org.city || '',
                zip_code: org.zip_code || '',
                country: org.country || '',
                member_limit: org.member_limit?.toString() || '',
                is_public: org.is_public ?? true,
                status: org.status || 'active',
            });
        } catch (error) {
            console.error('Error loading organisation:', error);
            alert('Erreur lors du chargement de l\'organisation');
            navigate('/superadmin/organisations');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!id) return;
        try {
            setSaving(true);
            const updateData: Record<string, unknown> = {
                name: formData.name,
                description: formData.description || null,
                type: formData.type,
                logo_url: formData.logo_url || null,
                email: formData.email || null,
                phone: formData.phone || null,
                website_url: formData.website_url || null,
                address: formData.address || null,
                city: formData.city || null,
                zip_code: formData.zip_code || null,
                country: formData.country || null,
                member_limit: formData.member_limit ? parseInt(formData.member_limit) : null,
                is_public: formData.is_public,
                status: formData.status,
            };
            await api.put(`/super-admin/organisations/${id}`, updateData);
            await loadOrganisation();
            alert('Organisation mise à jour avec succès');
            // Retourner à la liste pour voir les changements
            navigate('/superadmin/organisations');
        } catch (error) {
            console.error('Error updating organisation:', error);
            alert('Erreur lors de la mise à jour');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!id || !confirm('Êtes-vous sûr de vouloir supprimer cette organisation ?')) return;
        try {
            await api.delete(`/super-admin/organisations/${id}`);
            alert('Organisation supprimée avec succès');
            navigate('/superadmin/organisations');
        } catch (error) {
            console.error('Error deleting organisation:', error);
            alert('Erreur lors de la suppression');
        }
    };

    const handleRestore = async () => {
        if (!id) return;
        try {
            await api.put(`/super-admin/organisations/${id}/restore`);
            await loadOrganisation();
            alert('Organisation restaurée avec succès');
        } catch (error) {
            console.error('Error restoring organisation:', error);
            alert('Erreur lors de la restauration');
        }
    };

    if (loading) {
        return (
            <AdminLayout active="assos" isSuperAdmin={true}>
                <div className="flex items-center justify-center py-20">
                    <div className="text-gray-500">Chargement...</div>
                </div>
            </AdminLayout>
        );
    }

    if (!organisation) {
        return (
            <AdminLayout active="assos" isSuperAdmin={true}>
                <div className="flex items-center justify-center py-20">
                    <div className="text-gray-500">Organisation non trouvée</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout active="assos" isSuperAdmin={true}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/superadmin/organisations')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-4xl font-bold text-[#2A2A2A]">{organisation.name}</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        {organisation.isDeleted ? (
                            <Button
                                variant="secondary"
                                size="md"
                                mode="club"
                                icon={RotateCcw}
                                onClick={handleRestore}
                            >
                                Restaurer
                            </Button>
                        ) : (
                            <Button
                                variant="secondary"
                                size="md"
                                mode="club"
                                icon={Trash2}
                                onClick={handleDelete}
                            >
                                Supprimer
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Informations de base */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100">
                            <h2 className="text-xl font-bold text-[#2A2A2A] mb-6">Informations de base</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    type: e.target.value as 'sport' | 'culture' | 'loisir' | 'social' | 'other',
                                                })
                                            }
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="sport">Sport</option>
                                            <option value="culture">Culture</option>
                                            <option value="loisir">Loisir</option>
                                            <option value="social">Social</option>
                                            <option value="other">Autre</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Limite de membres</label>
                                        <input
                                            type="number"
                                            value={formData.member_limit}
                                            onChange={(e) => setFormData({ ...formData, member_limit: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Illimité si vide"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">URL du logo</label>
                                    <input
                                        type="url"
                                        value={formData.logo_url}
                                        onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Contact */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100">
                            <h2 className="text-xl font-bold text-[#2A2A2A] mb-6">Contact</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Site web</label>
                                    <input
                                        type="url"
                                        value={formData.website_url}
                                        onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Localisation */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100">
                            <h2 className="text-xl font-bold text-[#2A2A2A] mb-6">Localisation</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                                        <input
                                            type="text"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Code postal</label>
                                        <input
                                            type="text"
                                            value={formData.zip_code}
                                            onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Pays</label>
                                        <input
                                            type="text"
                                            value={formData.country}
                                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
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

                    <div className="space-y-6">
                        {/* Statut */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100">
                            <h2 className="text-xl font-bold text-[#2A2A2A] mb-4">Statut</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                status: e.target.value as 'active' | 'suspended' | 'pending_validation',
                                            })
                                        }
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="active">Active</option>
                                        <option value="suspended">Suspendue</option>
                                        <option value="pending_validation">En attente de validation</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_public}
                                            onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Organisation publique</span>
                                    </label>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">Date de création</div>
                                    <div className="text-sm font-medium text-gray-900">
                                        {new Date(organisation.created_at).toLocaleDateString('fr-FR')}
                                    </div>
                                </div>
                                {organisation.deleted_at && (
                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">Date de suppression</div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {new Date(organisation.deleted_at).toLocaleDateString('fr-FR')}
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

export default SuperAdminOrganisationDetailPage;

