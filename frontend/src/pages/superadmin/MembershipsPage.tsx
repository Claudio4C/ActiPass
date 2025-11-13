import React, { useState, useEffect } from 'react';
import { Search, Download, Building2 } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import Button from '../../shared/components/Button';
import { api } from '../../lib/api';

interface Membership {
    id: string;
    user: {
        id: string;
        email: string;
        firstname: string;
        lastname: string;
    };
    organisation: {
        id: string;
        name: string;
        description?: string;
    };
    role: {
        id: string;
        name: string;
        type: string;
    };
    joined_at: string;
    left_at?: string | null;
}

const SuperAdminMembershipsPage: React.FC = () => {
    const [memberships, setMemberships] = useState<Membership[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadMemberships();
    }, []);

    const loadMemberships = async () => {
        try {
            setLoading(true);
            // Récupérer toutes les organisations avec leurs membres
            const organisations = await api.get<any[]>('/super-admin/organisations');

            // Flatten les memberships
            const allMemberships: Membership[] = [];
            organisations.forEach((org) => {
                if (org.memberships && Array.isArray(org.memberships)) {
                    org.memberships.forEach((membership: any) => {
                        allMemberships.push({
                            id: membership.id,
                            user: membership.user,
                            organisation: {
                                id: org.id,
                                name: org.name,
                                description: org.description,
                            },
                            role: membership.role,
                            joined_at: membership.joined_at,
                            left_at: membership.left_at,
                        });
                    });
                }
            });

            setMemberships(allMemberships);
        } catch (error) {
            console.error('Error loading memberships:', error);
            setMemberships([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredMemberships = memberships.filter((membership) => {
        const query = searchQuery.toLowerCase();
        const userName = `${membership.user.firstname} ${membership.user.lastname}`.toLowerCase();
        const orgName = (membership.organisation.name || '').toLowerCase();
        const roleName = (membership.role.name || '').toLowerCase();
        const email = (membership.user.email || '').toLowerCase();

        return userName.includes(query) || orgName.includes(query) || roleName.includes(query) || email.includes(query);
    });

    const activeMemberships = filteredMemberships.filter(m => !m.left_at);
    const inactiveMemberships = filteredMemberships.filter(m => m.left_at);

    return (
        <AdminLayout active="memberships" isSuperAdmin={true}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-4xl font-bold text-[#2A2A2A]">Adhésions</h1>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="md" mode="club" icon={Download}>
                            Export CSV
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className="text-2xl font-bold text-[#2A2A2A]">{memberships.length}</div>
                        <div className="text-sm text-gray-600">Total adhésions</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className="text-2xl font-bold text-green-600">{activeMemberships.length}</div>
                        <div className="text-sm text-gray-600">Adhésions actives</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className="text-2xl font-bold text-gray-600">{inactiveMemberships.length}</div>
                        <div className="text-sm text-gray-600">Adhésions terminées</div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher par utilisateur, organisation ou rôle"
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
                ) : filteredMemberships.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
                        <div className="text-2xl font-bold text-gray-700 mb-2">Aucune adhésion</div>
                        <div className="text-gray-500">Les adhésions vont apparaître ici.</div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Utilisateur</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Organisation</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Rôle</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date d'adhésion</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Statut</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredMemberships.map((membership, index) => (
                                        <tr
                                            key={membership.id}
                                            className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                                                }`}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                                                        {(membership.user.firstname?.[0] || '').toUpperCase()}
                                                        {(membership.user.lastname?.[0] || '').toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {membership.user.firstname} {membership.user.lastname}
                                                        </div>
                                                        <div className="text-xs text-gray-500">{membership.user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-gray-400" />
                                                    <div className="text-sm text-gray-900">{membership.organisation.name}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                                    {membership.role.name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(membership.joined_at).toLocaleDateString('fr-FR')}
                                            </td>
                                            <td className="px-6 py-4">
                                                {membership.left_at ? (
                                                    <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
                                                        Terminée
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                                        Active
                                                    </span>
                                                )}
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

export default SuperAdminMembershipsPage;

