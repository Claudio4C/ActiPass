import React from 'react';
import { Users, Calendar, MessageSquare, Settings } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import Button from '../../components/ui/Button';
import { Link } from 'react-router-dom';

const DashboardPage: React.FC = () => {
    return (
        <Layout
            title="Tableau de bord"
            subtitle="Gérez vos membres, activités et communications"
            mode="club"
        >
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 lg:mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">Membres actifs</p>
                            <p className="text-2xl font-bold text-gray-900">156</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                            <Calendar className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">Événements ce mois</p>
                            <p className="text-2xl font-bold text-gray-900">12</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                            <MessageSquare className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">Messages non lus</p>
                            <p className="text-2xl font-bold text-gray-900">3</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Gestion des membres</h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                        Inscrire, gérer et suivre vos membres
                    </p>
                    <Link to="/club/members">
                        <Button variant="outline" size="sm" mode="club">
                            Accéder
                        </Button>
                    </Link>
                </div>

                <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                            <Calendar className="w-5 h-5 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Planning</h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                        Organisez vos créneaux et événements
                    </p>
                    <Button variant="outline" size="sm" mode="club">
                        Accéder
                    </Button>
                </div>

                <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                            <MessageSquare className="w-5 h-5 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Communication</h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                        Messagerie et notifications
                    </p>
                    <Button variant="outline" size="sm" mode="club">
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
                        Configuration de votre organisation
                    </p>
                    <Button variant="outline" size="sm" mode="club">
                        Accéder
                    </Button>
                </div>
            </div>
        </Layout>
    );
};

export default DashboardPage;