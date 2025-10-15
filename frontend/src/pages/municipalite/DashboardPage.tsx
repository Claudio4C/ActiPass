import React from 'react';
import { Building2, Users, Calendar, BarChart3, Settings } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import Button from '../../components/ui/Button';

const DashboardPage: React.FC = () => {
    return (
        <Layout
            title="Tableau de bord"
            subtitle="Coordonnez les équipements et services municipaux"
            mode="municipalite"
        >
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 lg:mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                            <Building2 className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">Équipements</p>
                            <p className="text-2xl font-bold text-gray-900">24</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">Associations</p>
                            <p className="text-2xl font-bold text-gray-900">89</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                            <Calendar className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">Réservations</p>
                            <p className="text-2xl font-bold text-gray-900">156</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                            <BarChart3 className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">Taux d'occupation</p>
                            <p className="text-2xl font-bold text-gray-900">78%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                            <Building2 className="w-5 h-5 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Gestion des équipements</h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                        Coordonnez vos espaces et installations
                    </p>
                    <Button variant="outline" size="sm" mode="municipalite">
                        Accéder
                    </Button>
                </div>

                <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Associations</h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                        Gérez les accès et permissions
                    </p>
                    <Button variant="outline" size="sm" mode="municipalite">
                        Accéder
                    </Button>
                </div>

                <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                            <Calendar className="w-5 h-5 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Réservations</h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                        Planifiez et suivez les réservations
                    </p>
                    <Button variant="outline" size="sm" mode="municipalite">
                        Accéder
                    </Button>
                </div>

                <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                            <Settings className="w-5 h-5 text-gray-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Paramètres</h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                        Configuration municipale
                    </p>
                    <Button variant="outline" size="sm" mode="municipalite">
                        Accéder
                    </Button>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="mt-8 bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Activité récente</h3>
                </div>
                <div className="p-6">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">Tennis Club Paris</span> a réservé le court n°2 pour demain 14h-16h
                            </p>
                            <span className="text-xs text-gray-400">Il y a 2h</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">Association de Danse</span> a demandé l'accès à la salle polyvalente
                            </p>
                            <span className="text-xs text-gray-400">Il y a 4h</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">Club de Football</span> a annulé sa réservation du terrain de sport
                            </p>
                            <span className="text-xs text-gray-400">Il y a 6h</span>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default DashboardPage;