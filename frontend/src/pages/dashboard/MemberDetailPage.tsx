import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Calendar, Shield, Trash2, User, Phone, Baby } from 'lucide-react';
import RoleBasedRoute from '../../components/shared/RoleBasedRoute';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface Guardian {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    phone: string | null;
}

interface MemberDetail {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
    username: string;
    phone: string | null;
    birthdate: string | null;
    is_minor: boolean;
    role: {
        id: string;
        name: string;
        type: string;
        level: number;
    };
    membership_status: string;
    docs_status: string;
    payment_status: string;
    joined_at: string;
    guardians: Guardian[];
}

const MemberDetailPage: React.FC = () => {
    const { organisationId, memberId } = useParams<{ organisationId: string; memberId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [member, setMember] = useState<MemberDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedRoleType, setSelectedRoleType] = useState<string>('');

    useEffect(() => {
        if (organisationId && memberId) {
            loadMember();
        }
    }, [organisationId, memberId]);

    const loadMember = async () => {
        if (!organisationId || !memberId) return;
        try {
            setLoading(true);
            const data = await api.get<MemberDetail>(`/organisations/${organisationId}/members/${memberId}`);
            setMember(data);
            setSelectedRoleType(data.role.type);
        } catch (error) {
            console.error('Error loading member:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChangeRole = async () => {
        if (!organisationId || !memberId || !member) return;
        try {
            setActionLoading(true);
            await api.put(`/organisations/${organisationId}/members/${memberId}/role`, {
                roleType: selectedRoleType
            });
            await loadMember();
            setShowRoleModal(false);
        } catch (error) {
            console.error('Error changing role:', error);
            alert('Erreur lors du changement de rôle');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteMember = async () => {
        if (!organisationId || !memberId) return;
        try {
            setActionLoading(true);
            await api.delete(`/organisations/${organisationId}/members/${memberId}`);
            navigate(`/dashboard/${organisationId}/members`);
        } catch (error) {
            console.error('Error deleting member:', error);
            alert('Erreur lors de la suppression du membre');
        } finally {
            setActionLoading(false);
        }
    };

    const roleOptions = [
        { value: 'club_manager', label: 'Gestionnaire', level: 80, description: 'Gestion quotidienne complète (événements, membres, paiements)' },
        { value: 'treasurer', label: 'Trésorier', level: 60, description: 'Accès aux finances uniquement' },
        { value: 'coach', label: 'Coach', level: 40, description: 'Gestion des séances et présences' },
        { value: 'member', label: 'Membre', level: 20, description: 'Accès de base (réservations, lecture)' }
    ];

    const canManageRoles = true;

    if (loading) {
        return (
            <>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </>
        );
    }

    if (!member) {
        return (
            <>
                <div className="max-w-7xl mx-auto">
                    <div className="text-center py-12">
                        <p className="text-gray-600 dark:text-gray-400">Membre introuvable</p>
                        <Link
                            to={`/dashboard/${organisationId}/members`}
                            className="mt-4 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Retour à la liste
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        to={`/dashboard/${organisationId}/members`}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                {member.firstname} {member.lastname}
                            </h1>
                            {member.is_minor && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 text-xs font-medium">
                                    <Baby className="h-3.5 w-3.5" />
                                    Membre mineur
                                </span>
                            )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Détails du membre</p>
                    </div>
                    {canManageRoles && member.id !== user?.id && member.role.type !== 'club_owner' && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowRoleModal(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                <Shield className="h-4 w-4" />
                                Changer le rôle
                            </button>
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                <Trash2 className="h-4 w-4" />
                                Retirer
                            </button>
                        </div>
                    )}
                    {member.role.type === 'club_owner' && (
                        <div className="px-4 py-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                            <p className="text-sm text-purple-700 dark:text-purple-300">
                                <Shield className="h-4 w-4 inline mr-2" />
                                Propriétaire — ce rôle ne peut pas être modifié
                            </p>
                        </div>
                    )}
                </div>

                {/* Member Info Card */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
                    <div className="flex items-start gap-6">
                        <div className="flex-shrink-0">
                            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                                {member.firstname?.charAt(0) || 'U'}
                                {member.lastname?.charAt(0) || ''}
                            </div>
                        </div>
                        <div className="flex-1 space-y-4">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    Informations personnelles
                                </h2>
                                <div className="space-y-2">
                                    {!member.is_minor && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <Mail className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-600 dark:text-gray-400">{member.email}</span>
                                        </div>
                                    )}
                                    {member.phone && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <Phone className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-600 dark:text-gray-400">{member.phone}</span>
                                        </div>
                                    )}
                                    {!member.is_minor && member.username && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <User className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-600 dark:text-gray-400">@{member.username}</span>
                                        </div>
                                    )}
                                    {member.birthdate && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <Baby className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-600 dark:text-gray-400">
                                                Né(e) le {new Date(member.birthdate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 text-sm">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600 dark:text-gray-400">
                                            Membre depuis le {new Date(member.joined_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                    Rôle et permissions
                                </h3>
                                <div className="flex items-center gap-3">
                                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                                        member.role.type === 'club_owner' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' :
                                        member.role.type === 'club_manager' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                                        member.role.type === 'treasurer' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                                        member.role.type === 'coach' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                                        'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                                    }`}>
                                        <Shield className="h-4 w-4" />
                                        {member.role.name}
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Niveau {member.role.level}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Carte tuteurs pour les mineurs */}
                {member.is_minor && member.guardians && member.guardians.length > 0 && (
                    <div className="bg-pink-50 dark:bg-pink-900/10 rounded-xl border border-pink-200 dark:border-pink-800 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Baby className="h-5 w-5 text-pink-500" />
                            Contact(s) parent / tuteur
                        </h3>
                        <div className="space-y-3">
                            {member.guardians.map(g => (
                                <div key={g.id} className="flex items-center gap-4 text-sm">
                                    <div className="h-9 w-9 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 font-bold text-xs flex-shrink-0">
                                        {g.firstname.charAt(0)}{g.lastname.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{g.firstname} {g.lastname}</p>
                                        <div className="flex flex-wrap gap-3 mt-0.5">
                                            <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                                <Mail className="h-3.5 w-3.5" />{g.email}
                                            </span>
                                            {g.phone && (
                                                <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                                    <Phone className="h-3.5 w-3.5" />{g.phone}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Change Role Modal */}
                {showRoleModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Changer le rôle</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Rôle actuel : <span className="font-medium">{member.role.name}</span>
                            </p>
                            <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
                                {roleOptions.map((role) => (
                                    <label
                                        key={role.value}
                                        className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                                            selectedRoleType === role.value
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
                                            className="mt-1 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900 dark:text-white">{role.label}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{role.description}</div>
                                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Niveau {role.level}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setShowRoleModal(false); setSelectedRoleType(member.role.type); }}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                                    disabled={actionLoading}
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleChangeRole}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                    disabled={actionLoading || selectedRoleType === member.role.type}
                                >
                                    {actionLoading ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Member Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Retirer le membre</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                Êtes-vous sûr de vouloir retirer <span className="font-medium">{member.firstname} {member.lastname}</span> de cette organisation ?
                                Cette action est irréversible.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                                    disabled={actionLoading}
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleDeleteMember}
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
        </>
    );
};

const ProtectedMemberDetailPage: React.FC = () => {
    return (
        <RoleBasedRoute allowedRoles={['club_owner', 'club_manager']}>
            <MemberDetailPage />
        </RoleBasedRoute>
    );
};

export default ProtectedMemberDetailPage;
