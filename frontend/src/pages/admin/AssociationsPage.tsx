import React, { useState, useEffect } from 'react';
import { Search, Plus, Download, Filter, ChevronDown } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import Button from '../../shared/components/Button';
import { api } from '../../lib/api';

interface Organisation {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
}

const AssociationsPage: React.FC = () => {
    const [organisations, setOrganisations] = useState<Organisation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadOrganisations();
    }, []);

    const loadOrganisations = async () => {
        try {
            setLoading(true);
            const data = await api.get<Organisation[]>('/organisations');
            setOrganisations(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading organisations:', error);
            setOrganisations([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrganisations = organisations.filter((org) =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AdminLayout active="assos">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-4xl font-bold text-[#2A2A2A]">Associations</h1>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="md" mode="club" icon={Download}>
                            Export CSV
                        </Button>
                        <Button variant="primary" size="md" mode="club" icon={Plus}>
                            Ajouter une asso
                        </Button>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher par nom"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <Button variant="outline" size="md" mode="club" icon={ChevronDown} iconPosition="right">
                        Filtre
                    </Button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-gray-500">Chargement...</div>
                    </div>
                ) : filteredOrganisations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
                        <div className="text-2xl font-bold text-gray-700 mb-2">Aucune association</div>
                        <div className="text-gray-500">Les associations vont apparaître ici.</div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nom</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Description</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date de création</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredOrganisations.map((org) => (
                                        <tr key={org.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{org.name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {org.description || '—'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(org.createdAt).toLocaleDateString('fr-FR')}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="outline" size="sm" mode="club">
                                                        Modifier
                                                    </Button>
                                                    <Button variant="outline" size="sm" mode="club">
                                                        Supprimer
                                                    </Button>
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

export default AssociationsPage;

