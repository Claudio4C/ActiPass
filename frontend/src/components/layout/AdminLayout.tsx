import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, Home, Users, Building2, Settings, Landmark, LogOut, UserCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../shared/components/Button';

interface AdminLayoutProps {
    children: React.ReactNode;
    active?: 'home' | 'assos' | 'members' | 'mairies' | 'settings' | 'memberships';
    isSuperAdmin?: boolean;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, active = 'home', isSuperAdmin = false }) => {
    const { logout, user, isLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoggingOut, setIsLoggingOut] = React.useState(false);

    const basePath = isSuperAdmin ? '/superadmin' : '/admin';

    const navItems = isSuperAdmin
        ? [
            { key: 'home' as const, icon: Home, label: 'Accueil', path: '/superadmin' },
            { key: 'members' as const, icon: Users, label: 'Utilisateurs', path: '/superadmin/users' },
            { key: 'assos' as const, icon: Building2, label: 'Organisations', path: '/superadmin/organisations' },
            { key: 'memberships' as const, icon: UserCheck, label: 'Adhésions', path: '/superadmin/memberships' },
        ]
        : [
            { key: 'home' as const, icon: Home, label: 'Accueil', path: '/admin' },
            { key: 'assos' as const, icon: Landmark, label: 'Assos', path: '/admin/associations' },
            { key: 'members' as const, icon: Users, label: 'Membres', path: '/admin/members' },
            { key: 'mairies' as const, icon: Building2, label: 'Mairies', path: '/admin/municipalities' },
            { key: 'settings' as const, icon: Settings, label: 'Paramètres', path: '/admin/settings' },
        ];

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    const handleNavClick = (path: string) => {
        navigate(path);
    };

    return (
        <div className="min-h-screen bg-[#FFF9F8]">
            <div className="flex min-h-screen">
                {/* Sidebar */}
                <aside className="w-72 bg-[#0F2147] text-white flex flex-col p-7">
                    {/* Logo */}
                    <div
                        onClick={() => navigate('/home')}
                        className="flex items-center gap-4 mb-10 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center">
                            <div className="w-7 h-7 bg-[#0F2147] rounded-xl" />
                        </div>
                        <div className="leading-tight">
                            <div className="text-base opacity-90 font-semibold">Ikivio</div>
                        </div>
                    </div>

                    {/* Nav */}
                    <nav className="space-y-3 flex-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = active === item.key || location.pathname === item.path;
                            return (
                                <div
                                    key={item.key}
                                    onClick={() => handleNavClick(item.path)}
                                    className={`flex items-center gap-4 px-5 py-4 rounded-2xl cursor-pointer select-none transition-all ${isActive
                                        ? 'bg-white/12 text-white shadow-[0_6px_20px_-8px_rgba(0,0,0,0.4)]'
                                        : 'text-blue-100 hover:bg-white/6'
                                        }`}
                                >
                                    <Icon className="w-6 h-6" />
                                    <span className="text-base font-semibold">{item.label}</span>
                                </div>
                            );
                        })}
                    </nav>
                </aside>

                {/* Content */}
                <div className="flex-1 flex flex-col">
                    {/* Top bar */}
                    <div className="flex items-center justify-end h-20 px-10 bg-white border-b border-gray-100">
                        <Bell className="w-6 h-6 text-gray-600 mr-4" />
                        <Button
                            variant="primary"
                            size="md"
                            mode="club"
                            onClick={handleLogout}
                            disabled={isLoggingOut || isLoading}
                        >
                            {isLoggingOut ? 'Déconnexion...' : 'Se déconnecter'}
                        </Button>
                    </div>

                    {/* Main */}
                    <main
                        className="flex-1 px-14 pb-16 pt-8 overflow-y-auto"
                        style={{
                            backgroundImage:
                                "repeating-linear-gradient(90deg, rgba(224,0,0,0.05) 0, rgba(224,0,0,0.05) 1px, transparent 1px, transparent 120px)",
                            backgroundSize: '120px 1px'
                        }}
                    >
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;

