import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';

interface LayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
    mode: 'club' | 'municipalite';
}

const Layout: React.FC<LayoutProps> = ({ children, title, subtitle, mode }) => {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
    };

    const isClubMode = mode === 'club';
    const badgeText = isClubMode ? 'Club/Association' : 'Municipalité';

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            {isClubMode ? (
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                                    <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                                    <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                                    </div>
                                </div>
                            )}
                            <span className="text-xl font-bold text-gray-900">Ikivio</span>
                            <span className={`ml-4 px-3 py-1 ${isClubMode
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-purple-100 text-purple-800'
                                } text-sm font-medium rounded-full`}>
                                {badgeText}
                            </span>
                        </div>

                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-700">
                                Bonjour, {user?.firstName} {user?.lastName}
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                mode={mode}
                                icon={LogOut}
                                onClick={handleLogout}
                            >
                                Déconnexion
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                <div className="mb-6 lg:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                        {title}
                    </h1>
                    <p className="text-gray-600">
                        {subtitle}
                    </p>
                </div>
                {children}
            </main>
        </div>
    );
};

export default Layout;
