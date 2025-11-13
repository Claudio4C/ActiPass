import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, Building2, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import { api } from '../../lib/api';

interface DashboardStats {
    users: {
        total: number;
        active: number;
        suspended: number;
        pending: number;
    };
    organisations: {
        total: number;
        active: number;
        suspended: number; // Suspendues + Supprimées regroupées
        pending: number;
    };
    memberships: {
        total: number;
    };
}

const StatCard: React.FC<{
    icon: React.ElementType;
    title: string;
    value: string | number;
    color: string;
}> = ({ icon: Icon, title, value, color }) => (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
        <div className="text-3xl font-bold text-[#2A2A2A] mb-1">{value}</div>
        <div className="text-sm text-gray-600">{title}</div>
    </div>
);

const SuperAdminDashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    const loadDashboard = React.useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.get<DashboardStats>('/super-admin/dashboard');
            setStats(data);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    // Recharger le dashboard quand on revient sur cette page
    const prevPathnameRef = React.useRef<string>(location.pathname);
    useEffect(() => {
        if (prevPathnameRef.current !== location.pathname && location.pathname === '/superadmin') {
            loadDashboard();
        }
        prevPathnameRef.current = location.pathname;
    }, [location.pathname, loadDashboard]);

    return (
        <AdminLayout active="home" isSuperAdmin={true}>
            <div className="space-y-8">
                <div>
                    <h2 className="text-5xl font-extrabold tracking-tight text-[#2A2A2A] mb-4">
                        Super Admin Dashboard
                    </h2>
                    <p className="text-xl text-gray-600">
                        Vue d'ensemble complète du système IKIVIO
                    </p>
                </div>

                {/* Métriques principales */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        icon={Users}
                        title="Total Utilisateurs"
                        value={loading ? '...' : stats?.users?.total || 0}
                        color="bg-blue-600"
                    />
                    <StatCard
                        icon={Building2}
                        title="Total Organisations"
                        value={loading ? '...' : stats?.organisations?.total || 0}
                        color="bg-purple-600"
                    />
                    <StatCard
                        icon={Users}
                        title="Total Adhésions"
                        value={loading ? '...' : stats?.memberships?.total || 0}
                        color="bg-indigo-600"
                    />
                </div>

                {/* Section Utilisateurs */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <h3 className="text-xl font-bold text-[#2A2A2A] mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        Utilisateurs
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard
                            icon={CheckCircle}
                            title="Actifs"
                            value={loading ? '...' : stats?.users?.active || 0}
                            color="bg-green-600"
                        />
                        <StatCard
                            icon={AlertCircle}
                            title="Suspendus"
                            value={loading ? '...' : stats?.users?.suspended || 0}
                            color="bg-red-600"
                        />
                        <StatCard
                            icon={Users}
                            title="En attente"
                            value={loading ? '...' : stats?.users?.pending || 0}
                            color="bg-yellow-600"
                        />
                    </div>
                </div>

                {/* Section Organisations */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <h3 className="text-xl font-bold text-[#2A2A2A] mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-purple-600" />
                        Organisations
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard
                            icon={CheckCircle}
                            title="Actives"
                            value={loading ? '...' : stats?.organisations?.active || 0}
                            color="bg-green-600"
                        />
                        <StatCard
                            icon={AlertCircle}
                            title="Suspendues/Supprimées"
                            value={loading ? '...' : stats?.organisations?.suspended || 0}
                            color="bg-red-600"
                        />
                        <StatCard
                            icon={Users}
                            title="En attente"
                            value={loading ? '...' : stats?.organisations?.pending || 0}
                            color="bg-yellow-600"
                        />
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                    <h3 className="text-xl font-bold text-[#2A2A2A] mb-4">Actions rapides</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border border-gray-200 rounded-xl hover:border-blue-500 transition-colors cursor-pointer">
                            <Shield className="w-8 h-8 text-blue-600 mb-2" />
                            <div className="font-semibold text-gray-900">Gérer les utilisateurs</div>
                            <div className="text-sm text-gray-600 mt-1">Voir et modifier tous les utilisateurs</div>
                        </div>
                        <div className="p-4 border border-gray-200 rounded-xl hover:border-purple-500 transition-colors cursor-pointer">
                            <Building2 className="w-8 h-8 text-purple-600 mb-2" />
                            <div className="font-semibold text-gray-900">Gérer les organisations</div>
                            <div className="text-sm text-gray-600 mt-1">Voir et modifier toutes les organisations</div>
                        </div>
                        <div
                            onClick={() => navigate('/superadmin/create-super-admin')}
                            className="p-4 border border-gray-200 rounded-xl hover:border-green-500 transition-colors cursor-pointer"
                        >
                            <Users className="w-8 h-8 text-green-600 mb-2" />
                            <div className="font-semibold text-gray-900">Créer Super Admin</div>
                            <div className="text-sm text-gray-600 mt-1">Créer un nouveau compte Super Admin</div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default SuperAdminDashboardPage;

