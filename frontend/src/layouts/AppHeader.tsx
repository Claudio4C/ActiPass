import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu, User, Moon, Sun, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AppHeaderProps {
    /** Label affiché dans le badge à droite du logo */
    badge: string;
    /** Couleur du badge : classe Tailwind de fond */
    badgeClass?: string;
    /** Couleur de l'icône logo */
    logoClass?: string;
    /** Icône affichée dans le logo */
    LogoIcon?: React.ComponentType<{ className?: string }>;
    /** Contenu personnalisé à droite du badge (nom d'org, etc.) */
    extra?: React.ReactNode;
}

const AppHeader: React.FC<AppHeaderProps> = ({
    badge,
    badgeClass = 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300',
    logoClass = 'bg-blue-600',
    LogoIcon,
    extra,
}) => {
    const { user, logout, isLoading } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window === 'undefined') return false;
        const stored = window.localStorage.getItem('theme');
        if (stored) return stored === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        const root = document.documentElement;
        if (isDarkMode) {
            root.classList.add('dark');
            root.setAttribute('data-theme', 'dark');
            window.localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            root.setAttribute('data-theme', 'light');
            window.localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const closeMenu = useCallback(() => setIsMenuOpen(false), []);

    useEffect(() => {
        if (!isMenuOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) closeMenu();
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen, closeMenu]);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        closeMenu();
        try { await logout(); } catch (e) { console.error('Logout failed:', e); }
        finally { setIsLoggingOut(false); }
    };

    const initials = useMemo(() => {
        const f = user?.firstName?.charAt(0) ?? '';
        const l = user?.lastName?.charAt(0) ?? '';
        return (f + l || user?.email?.charAt(0) || 'U').toUpperCase();
    }, [user]);

    const profileImage = useMemo(() => {
        if (typeof window !== 'undefined') {
            const stored = window.localStorage.getItem('userAvatar');
            if (stored?.trim()) return stored;
        }
        return null;
    }, [user]);

    const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
    useEffect(() => { setAvatarSrc(profileImage); }, [profileImage]);

    return (
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-slate-800 transition-colors">
            <div className="flex justify-between items-center h-14 px-4 sm:px-6">
                {/* Left: Logo + badge */}
                <div className="flex items-center gap-3">
                    <Link to="/home" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                        <div className={`w-8 h-8 ${logoClass} rounded-lg flex items-center justify-center shadow-sm`}>
                            {LogoIcon ? (
                                <LogoIcon className="w-5 h-5 text-white" />
                            ) : (
                                <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                                </div>
                            )}
                        </div>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">Ikivio</span>
                    </Link>
                    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${badgeClass}`}>
                        {badge}
                    </span>
                    {extra}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                    {/* Dark mode toggle */}
                    <button
                        onClick={() => setIsDarkMode(d => !d)}
                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800 transition-colors"
                        aria-label="Toggle theme"
                    >
                        {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </button>

                    {/* User greeting (desktop) */}
                    {user && (
                        <span className="hidden sm:block text-sm text-gray-600 dark:text-slate-300">
                            {user.firstName}
                        </span>
                    )}

                    {/* User menu */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setIsMenuOpen(p => !p)}
                            className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-1 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition"
                        >
                            {avatarSrc ? (
                                <img src={avatarSrc} alt="" className="h-8 w-8 rounded-full object-cover" onError={() => setAvatarSrc(null)} referrerPolicy="no-referrer" />
                            ) : (
                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-xs font-semibold text-white">
                                    {initials}
                                </div>
                            )}
                            <Menu className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        </button>

                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden z-50">
                                {user && (
                                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{user.firstName} {user.lastName}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                                    </div>
                                )}
                                <nav className="py-1 text-sm">
                                    <Link to="/home" onClick={closeMenu} className="flex items-center gap-3 px-4 py-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                                        <Home className="h-4 w-4 text-indigo-500" /> Accueil
                                    </Link>
                                    <Link to="/account/profile" onClick={closeMenu} className="flex items-center gap-3 px-4 py-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                                        <User className="h-4 w-4 text-slate-500" /> Mon profil
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        disabled={isLoggingOut || isLoading}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        {isLoggingOut ? 'Deconnexion...' : 'Deconnexion'}
                                    </button>
                                </nav>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default AppHeader;
