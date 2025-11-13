import React, { useState, useEffect } from 'react';
import { Search, Plus, Download, Filter, ChevronDown, Edit, Trash2 } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import Button from '../../shared/components/Button';
import { api } from '../../lib/api';

interface Member {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    gender?: string;
    createdAt: string;
}

const MembersPage: React.FC = () => {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadMembers();
    }, []);

    const loadMembers = async () => {
        try {
            setLoading(true);
            // Pour l'instant, on charge depuis /users/me et les organisations
            // TODO: Utiliser l'endpoint approprié selon le rôle
            const data = await api.get<Member[]>('/users/me');
            // Mock data pour l'instant - à remplacer par l'API réelle
            setMembers([]);
        } catch (error) {
            console.error('Error loading members:', error);
            setMembers([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredMembers = members.filter(
        (member) =>
            member.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AdminLayout active="members">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-4xl font-bold text-[#2A2A2A]">Membres</h1>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="md" mode="club" icon={Download}>
                            Export CSV
                        </Button>
                        <Button variant="primary" size="md" mode="club" icon={Plus}>
                            Ajouter un membre
                        </Button>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher par nom ou email"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <Button variant="outline" size="md" mode="club" icon={ChevronDown} iconPosition="right">
                        Add filter
                    </Button>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
                        <div className="text-gray-500">Chargement...</div>
                    </div>
                ) : filteredMembers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
                        <div className="text-2xl font-bold text-gray-700 mb-2">Aucun membre</div>
                        <div className="text-gray-500">Les membres vont apparaître ici.</div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nom</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Téléphone</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Genre</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredMembers.map((member, index) => (
                                        <tr
                                            key={member.id}
                                            className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                                                }`}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                                                        {member.firstName[0]}{member.lastName[0]}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {member.firstName} {member.lastName}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{member.email}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{member.phone || '—'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{member.gender || '—'}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
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

export default MembersPage;

