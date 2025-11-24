import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, Search, UserPlus, Edit, Trash2, Shield, Mail } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import RoleBasedRoute from '../../components/shared/RoleBasedRoute';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface Member {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
    username: string;
    role: {
        id: string;
        name: string;
        type: string;
        level: number;
    };
    joined_at: string;
}

const MembersPage: React.FC = () => {
    const { organisationId } = useParams<{ organisationId: string }>();
    const { user } = useAuth();
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [selectedRoleType, setSelectedRoleType] = useState<string>('');
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (organisationId) {
            loadMembers();
        }
    }, [organisationId]);

    const loadMembers = async (forceRefresh: boolean = false) => {
        if (!organisationId) return;
        try {
            setLoading(true);
            // Si forceRefresh, ne pas utiliser le cache
            const data = await api.get<Member[]>(
                `/organisations/${organisationId}/members`,
                undefined,
                forceRefresh ? { useCache: false } : { useCache: true, cacheTTL: 30000 }
            );
            setMembers(data);
        } catch (error) {
            console.error('Error loading members:', error);
            // Si l'API retourne une erreur (pas de membres), on utilise des données mockées pour tester
            if (error && typeof error === 'object' && 'response' in error) {
                const apiError = error as { response?: { status?: number } };
                if (apiError.response?.status === 404 || apiError.response?.status === 403) {
                    // Pas de membres ou pas d'accès - données mockées pour tester
                    const mockMembers: Member[] = [
                        {
                            id: 'mock-member-1',
                            email: 'jean.dupont@example.com',
                            firstname: 'Jean',
                            lastname: 'Dupont',
                            username: 'jdupont',
                            role: {
                                id: 'role-1',
                                name: 'Membre',
                                type: 'member',
                                level: 20
                            },
                            joined_at: new Date().toISOString()
                        },
                        {
                            id: 'mock-member-2',
                            email: 'marie.martin@example.com',
                            firstname: 'Marie',
                            lastname: 'Martin',
                            username: 'mmartin',
                            role: {
                                id: 'role-2',
                                name: 'Coach',
                                type: 'coach',
                                level: 40
                            },
                            joined_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
                        }
                    ];
                    setMembers(mockMembers);
                    return;
                }
            }
            setMembers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleChangeRole = async () => {
        if (!organisationId || !selectedMember) return;
        try {
            setActionLoading(true);
            // Si c'est un membre mocké, simuler le changement
            if (selectedMember.id.startsWith('mock-member-')) {
                // Simuler le changement de rôle pour les données mockées
                setMembers(prev => prev.map(m =>
                    m.id === selectedMember.id
                        ? { ...m, role: { ...m.role, type: selectedRoleType, name: roleOptions.find(r => r.value === selectedRoleType)?.label || m.role.name } }
                        : m
                ));
                setShowRoleModal(false);
                setSelectedMember(null);
                setSelectedRoleType('');
                setActionLoading(false);
                return;
            }

            await api.put(`/organisations/${organisationId}/members/${selectedMember.id}/role`, {
                roleType: selectedRoleType
            });
            // Invalider le cache des membres pour forcer le rechargement
            api.clearCache(`/organisations/${organisationId}/members`);
            await loadMembers(true);
            setShowRoleModal(false);
            setSelectedMember(null);
            setSelectedRoleType('');
        } catch (error) {
            console.error('Error changing role:', error);
            alert('Erreur lors du changement de rôle');
        } finally {
            setActionLoading(false);
        }
    };

    const openRoleModal = (member: Member) => {
        setSelectedMember(member);
        setSelectedRoleType(member.role.type);
        setShowRoleModal(true);
    };

    const handleDeleteMember = async (memberId: string) => {
        if (!organisationId) return;
        try {
            setActionLoading(true);
            // Si c'est un membre mocké, simuler la suppression
            if (memberId.startsWith('mock-member-')) {
                setMembers(prev => prev.filter(m => m.id !== memberId));
                setShowDeleteModal(false);
                setSelectedMember(null);
                setActionLoading(false);
                return;
            }

            await api.delete(`/organisations/${organisationId}/members/${memberId}`);
            // Invalider le cache des membres pour forcer le rechargement
            api.clearCache(`/organisations/${organisationId}/members`);
            // Recharger sans cache pour être sûr d'avoir les données à jour
            await loadMembers(true);
            setShowDeleteModal(false);
            setSelectedMember(null);
        } catch (error) {
            console.error('Error deleting member:', error);
            alert('Erreur lors de la suppression du membre');
        } finally {
            setActionLoading(false);
        }
    };

    const filteredMembers = members.filter(member =>
        member.firstname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.lastname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const roleOptions = [
        { value: 'club_manager', label: 'Gestionnaire', level: 80, description: 'Gestion quotidienne complète (événements, membres, paiements)' },
        { value: 'treasurer', label: 'Trésorier', level: 60, description: 'Accès aux finances uniquement' },
        { value: 'coach', label: 'Coach', level: 40, description: 'Gestion des séances et présences' },
        { value: 'member', label: 'Membre', level: 20, description: 'Accès de base (réservations, lecture)' }
    ];

    // Vérifier si l'utilisateur actuel est propriétaire (peut changer les rôles)
    const canManageRoles = true; // TODO: Vérifier depuis l'API

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Membres
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Gérez les membres de votre organisation ({members.length} membre{members.length > 1 ? 's' : ''})
                        </p>
                    </div>
                    <Link
                        to={`/dashboard/${organisationId}/members/add`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <UserPlus className="h-5 w-5" />
                        Ajouter un membre
                    </Link>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher un membre..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>

                {/* Members Table */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden">
                    {filteredMembers.length === 0 ? (
                        <div className="p-12 text-center">
                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">
                                {searchQuery ? 'Aucun membre trouvé' : 'Aucun membre dans cette organisation'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Membre
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Rôle
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Date d'adhésion
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                    {filteredMembers.map((member) => (
                                        <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                                                        {member.firstname?.charAt(0) || 'U'}
                                                        {member.lastname?.charAt(0) || ''}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {member.firstname} {member.lastname}
                                                        </div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                                            <Mail className="h-3 w-3" />
                                                            {member.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${member.role.type === 'club_owner' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' :
                                                    member.role.type === 'club_manager' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                                                        member.role.type === 'treasurer' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                                                            member.role.type === 'coach' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                                                                'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                                                    }`}>
                                                    <Shield className="h-3 w-3" />
                                                    {member.role.name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(member.joined_at).toLocaleDateString('fr-FR', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        to={`/dashboard/${organisationId}/members/${member.id}`}
                                                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                                        title="Voir les détails"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Link>
                                                    {canManageRoles && member.id !== user?.id && member.role.type !== 'club_owner' && (
                                                        <>
                                                            <button
                                                                onClick={() => openRoleModal(member)}
                                                                className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                                title="Changer le rôle"
                                                            >
                                                                <Shield className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedMember(member);
                                                                    setShowDeleteModal(true);
                                                                }}
                                                                className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                                                title="Retirer le membre"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {member.role.type === 'club_owner' && (
                                                        <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                                                            Propriétaire
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Change Role Modal */}
                {showRoleModal && selectedMember && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Changer le rôle de {selectedMember.firstname} {selectedMember.lastname}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Rôle actuel : <span className="font-medium">{selectedMember.role.name}</span>
                            </p>
                            <div className="space-y-2 mb-6">
                                {roleOptions.map((role) => (
                                    <label
                                        key={role.value}
                                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${selectedRoleType === role.value
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                            : 'border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="role"
                                            value={role.value}
                                            checked={selectedRoleType === role.value}
                                            onChange={(e) => setSelectedRoleType(e.target.value)}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {role.label}
                                            </div>
                                            {role.description && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    {role.description}
                                                </div>
                                            )}
                                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                Niveau {role.level}
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowRoleModal(false);
                                        setSelectedMember(null);
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                                    disabled={actionLoading}
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleChangeRole}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                    disabled={actionLoading || selectedRoleType === selectedMember.role.type}
                                >
                                    {actionLoading ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Member Modal */}
                {showDeleteModal && selectedMember && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Retirer le membre
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                Êtes-vous sûr de vouloir retirer <span className="font-medium">{selectedMember.firstname} {selectedMember.lastname}</span> de cette organisation ?
                                Cette action est irréversible.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setSelectedMember(null);
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                                    disabled={actionLoading}
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={() => handleDeleteMember(selectedMember.id)}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? 'Suppression...' : 'Retirer le membre'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

// Wrapper avec protection par rôle
const ProtectedMembersPage: React.FC = () => {
    return (
        <RoleBasedRoute allowedRoles={['club_owner', 'club_manager']}>
            <MembersPage />
        </RoleBasedRoute>
    );
};

export default ProtectedMembersPage;

