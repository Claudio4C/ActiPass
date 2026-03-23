import React from 'react';
import { LogOut, Menu, Sparkles, User, CreditCard, ArrowLeftRight, Bell, Calendar, MapPin, DollarSign, Award, MessageSquare, Users, Home, Baby } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrentOrganisation } from '../../hooks/useCurrentOrganisation';

interface LayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
    mode: 'club' | 'municipalite';
}

const Layout: React.FC<LayoutProps> = ({ children, title, subtitle, mode }) => {
    const { user, logout, isLoading } = useAuth();
    const location = useLocation();
    const { role: orgRole } = useCurrentOrganisation();
    const isFreelance = orgRole === 'freelance';
    const isCoachRoute = location.pathname.startsWith('/coach/');
    const showCoachLayout = isCoachRoute || orgRole === 'coach' || isFreelance;
    const isHomePage = location.pathname === '/home';
    const isAccountsPage = location.pathname === '/accounts';
    const isGeneralPage = isHomePage || isAccountsPage;
    const [isLoggingOut, setIsLoggingOut] = React.useState(false);
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const menuRef = React.useRef<HTMLDivElement | null>(null);
    const [activeOrganisation, setActiveOrganisation] = React.useState<string | null>(null);
    const [isDarkMode, setIsDarkMode] = React.useState(() => {
        if (typeof window === 'undefined') return false;
        const stored = window.localStorage.getItem('theme');
        if (stored) return stored === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    React.useEffect(() => {
        if (typeof document === 'undefined') return;
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

    const refreshOrganisation = React.useCallback(() => {
        if (typeof window === 'undefined') return;
        try {
            const raw = window.localStorage.getItem('selectedOrganisation');
            if (!raw) {
                setActiveOrganisation(null);
                return;
            }
            const parsed = JSON.parse(raw) as { name?: string } | null;
            setActiveOrganisation(parsed?.name ?? null);
        } catch (error) {
            console.error('Impossible de lire l’organisation active', error);
            setActiveOrganisation(null);
        }
    }, []);

    const initials = React.useMemo(() => {
        const first = user?.firstName?.charAt(0) ?? '';
        const last = user?.lastName?.charAt(0) ?? '';
        const fallback = user?.email?.charAt(0) ?? 'M';
        return (first + last || fallback).toUpperCase();
    }, [user?.firstName, user?.lastName, user?.email]);

    const profileImage = React.useMemo(() => {
        if (!user) return null;
        const extendedUser = user as {
            avatar?: string;
            photo?: string;
            photoUrl?: string;
            photoURL?: string;
            profileImage?: string;
            profilePicture?: string;
            image?: string;
        };
        const candidate =
            extendedUser.avatar ||
            extendedUser.photo ||
            extendedUser.photoUrl ||
            extendedUser.photoURL ||
            extendedUser.profileImage ||
            extendedUser.profilePicture ||
            extendedUser.image ||
            null;
        if (candidate) return candidate;
        if (typeof window !== 'undefined') {
            const stored = window.localStorage.getItem('userAvatar');
            if (stored && stored.trim().length > 0) {
                return stored;
            }
        }
        return null;
    }, [user]);

    const [avatarSrc, setAvatarSrc] = React.useState<string | null>(null);

    React.useEffect(() => {
        setAvatarSrc(profileImage);
    }, [profileImage]);

    const closeMenu = React.useCallback(() => setIsMenuOpen(false), []);
    const isAuthenticated = Boolean(user);

    React.useEffect(() => {
        refreshOrganisation();
    }, [refreshOrganisation]);

    React.useEffect(() => {
        if (!isMenuOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                closeMenu();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen, closeMenu]);

    React.useEffect(() => {
        const handler = () => refreshOrganisation();
        window.addEventListener('storage', handler);
        window.addEventListener('organisation:updated', handler);
        return () => {
            window.removeEventListener('storage', handler);
            window.removeEventListener('organisation:updated', handler);
        };
    }, [refreshOrganisation]);

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

    React.useEffect(() => {
        if (!isLoggingOut) return;
        setIsMenuOpen(false);
    }, [isLoggingOut]);

    const isClubMode = mode === 'club';
    const badgeText = isGeneralPage 
        ? (isAccountsPage ? 'Changer de compte' : 'Tableau de bord')
        : showCoachLayout 
            ? (isFreelance ? 'Coach indépendant' : 'Coach') 
            : isClubMode 
                ? 'Club/Association' 
                : 'Municipalité';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 dark:text-slate-100 transition-colors">
            {/* Header */}
            <header className="relative z-40 bg-white/80 dark:bg-slate-900/80 dark:border-b dark:border-slate-800 backdrop-blur-sm shadow-sm transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            {isGeneralPage ? (
                                <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                                    <Home className="w-5 h-5 text-white" />
                                </div>
                            ) : showCoachLayout ? (
                                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                                    <Award className="w-5 h-5 text-white" />
                                </div>
                            ) : isClubMode ? (
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                                    <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                                    </div>
                                </div>
                            ) : (
                                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                                    <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-purple-600 rounded-full" />
                                    </div>
                                </div>
                            )}
                            <span className="text-xl font-bold text-gray-900 dark:text-white">Ikivio</span>
                            <span
                                className={`ml-4 px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                                    isGeneralPage
                                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300'
                                        : showCoachLayout
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                                        : isClubMode
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-purple-100 text-purple-800'
                                }`}
                            >
                                {badgeText}
                            </span>
                            {!isGeneralPage && isClubMode && !showCoachLayout && activeOrganisation ? (
                                <Link
                                    to="/club/members"
                                    className="ml-3 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                                >
                                    <span className="hidden sm:inline">{activeOrganisation}</span>
                                    <span className="sm:hidden">{activeOrganisation}</span>
                                </Link>
                            ) : null}
                        </div>

                        <div className="flex items-center space-x-4">
                        {isGeneralPage ? (
                            <Link
                                to={isAccountsPage ? "/home" : "/accounts"}
                                className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-sm font-semibold text-indigo-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:hover:border-indigo-400"
                            >
                                {isAccountsPage ? (
                                    <>
                                        <Home className="h-4 w-4 text-indigo-500" />
                                        <span className="hidden sm:inline">Tableau de bord</span>
                                    </>
                                ) : (
                                    <>
                                        <ArrowLeftRight className="h-4 w-4 text-indigo-500" />
                                        <span className="hidden sm:inline">Mes comptes</span>
                                    </>
                                )}
                            </Link>
                        ) : showCoachLayout ? (
                            <Link
                                to="/club/members"
                                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-sm font-semibold text-emerald-600 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:hover:border-emerald-400"
                            >
                                <Award className="h-4 w-4 text-emerald-500" />
                                <span className="hidden sm:inline">{isFreelance ? 'Studio indépendant' : 'Espace coach'}</span>
                            </Link>
                        ) : (
                            <Link
                                to="/club/members"
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
                            >
                                <Users className="h-4 w-4 text-indigo-500" />
                                Espace membre
                            </Link>
                        )}
                            {isAuthenticated ? (
                                <div className="hidden sm:flex flex-col items-end leading-tight">
                                    <span className="text-sm text-gray-700 dark:text-slate-200">
                                        Bonjour, {user?.firstName ?? 'Utilisateur'}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-slate-400">
                                        {isGeneralPage
                                            ? (isAccountsPage ? 'Changer de compte' : 'Tableau de bord')
                                            : showCoachLayout
                                                ? 'Espace coach'
                                                : 'Gérer mon compte'}
                                    </span>
                                </div>
                            ) : null}

                            {!isAuthenticated ? (
                                <Link
                                    to="/login"
                                    className="hidden sm:inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:hover:border-indigo-400"
                                >
                                    <User className="h-4 w-4 text-indigo-500" />
                                    Se connecter
                                </Link>
                            ) : null}

                            <div className="relative z-50" ref={menuRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsMenuOpen((prev) => !prev)}
                                    className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-2 py-1 shadow-sm transition hover:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400 dark:bg-slate-800 dark:border-slate-700"
                                >
                                    <span className="sr-only">Ouvrir le menu principal</span>
                                    {isAuthenticated ? (
                                        avatarSrc ? (
                                            <img
                                                src={avatarSrc}
                                                alt="Photo de profil"
                                                className="h-10 w-10 rounded-full object-cover border border-white/60"
                                                onError={() => setAvatarSrc(null)}
                                                referrerPolicy="no-referrer"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-semibold text-white">
                                                {initials}
                                            </div>
                                        )
                                    ) : (
                                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-700">
                                            <Menu className="h-5 w-5 text-slate-600 dark:text-slate-200" />
                                        </div>
                                    )}
                                    <Menu className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                                </button>
                                {isMenuOpen ? (
                                    <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-2xl border border-slate-200/70 bg-white dark:bg-slate-900 shadow-xl backdrop-blur z-50">
                                        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
                                            {isAuthenticated ? (
                                                <>
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                        {user?.firstName} {user?.lastName}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                        Navigation invitée
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        Parcourez les espaces puis connectez-vous pour agir.
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                        <nav className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                                            {isGeneralPage ? (
                                                <>
                                                    <div className="px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900">
                                                        Navigation générale
                                                    </div>
                                                    <Link
                                                        to="/home"
                                                        className="flex items-center gap-3 px-4 py-3 text-slate-700 transition hover:bg-indigo-50 dark:text-slate-200 dark:hover:bg-slate-800/70"
                                                        onClick={closeMenu}
                                                    >
                                                        <Home className="h-4 w-4 text-indigo-500" />
                                                        Tableau de bord
                                                    </Link>
                                                    <Link
                                                        to="/accounts"
                                                        className="flex items-center gap-3 px-4 py-3 text-slate-700 transition hover:bg-indigo-50 dark:text-slate-200 dark:hover:bg-slate-800/70"
                                                        onClick={closeMenu}
                                                    >
                                                        <ArrowLeftRight className="h-4 w-4 text-sky-500" />
                                                        Changer de compte
                                                    </Link>
                                                    <div className="px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900">
                                                        Accès rapide
                                                    </div>
                                                    <Link
                                                        to="/club/members"
                                                        className="flex items-center gap-3 px-4 py-3 text-slate-700 transition hover:bg-indigo-50 dark:text-slate-200 dark:hover:bg-slate-800/70"
                                                        onClick={closeMenu}
                                                    >
                                                        <Users className="h-4 w-4 text-blue-500" />
                                                        Espace membre
                                                    </Link>
                                                    <Link
                                                        to="/coach/planning"
                                                        className="flex items-center gap-3 px-4 py-3 text-slate-700 transition hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-slate-800/70"
                                                        onClick={closeMenu}
                                                    >
                                                        <Calendar className="h-4 w-4 text-blue-500" />
                                                        Planning coach
                                                    </Link>
                                                    <Link
                                                        to="/coach/messages"
                                                        className="flex items-center gap-3 px-4 py-3 text-slate-700 transition hover:bg-indigo-50 dark:text-slate-200 dark:hover:bg-slate-800/70"
                                                        onClick={closeMenu}
                                                    >
                                                        <MessageSquare className="h-4 w-4 text-indigo-500" />
                                                        Messages
                                                    </Link>
                                                    <div className="px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900">
                                                        Mon compte
                                                    </div>
                                                    <Link
                                                        to="/account/profile"
                                                        className="flex items-center gap-3 px-4 py-3 text-slate-700 transition hover:bg-indigo-50 dark:text-slate-200 dark:hover:bg-slate-800/70"
                                                        onClick={closeMenu}
                                                    >
                                                        <User className="h-4 w-4 text-indigo-500" />
                                                        Mon profil
                                                    </Link>
                                                </>
                                            ) : showCoachLayout ? (
                                                <>
                                            <div className="px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900">
                                                {isFreelance ? 'Navigation freelance' : 'Navigation coach'}
                                            </div>
                                            <Link
                                                to="/club/members"
                                                className="flex items-center gap-3 px-4 py-3 text-slate-700 transition hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-slate-800/70"
                                                onClick={closeMenu}
                                            >
                                                <Award className="h-4 w-4 text-emerald-500" />
                                                {isFreelance ? 'Studio indépendant' : 'Espace coach complet'}
                                            </Link>
                                            <Link
                                                to="/coach/planning"
                                                className="flex items-center gap-3 px-4 py-3 text-slate-700 transition hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-slate-800/70"
                                                onClick={closeMenu}
                                            >
                                                <Calendar className="h-4 w-4 text-blue-500" />
                                                Mon planning
                                            </Link>
                                            <Link
                                                to="/coach/messages"
                                                className="flex items-center gap-3 px-4 py-3 text-slate-700 transition hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-slate-800/70"
                                                onClick={closeMenu}
                                            >
                                                <MessageSquare className="h-4 w-4 text-indigo-500" />
                                                Messages & sollicitations
                                            </Link>
                                            <Link
                                                to="/coach/applications"
                                                className="flex items-center gap-3 px-4 py-3 text-slate-700 transition hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-slate-800/70"
                                                onClick={closeMenu}
                                            >
                                                <MapPin className="h-4 w-4 text-indigo-500" />
                                                Candidatures
                                            </Link>
                                            <Link
                                                to="/coach/billing"
                                                className="flex items-center gap-3 px-4 py-3 text-slate-700 transition hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-slate-800/70"
                                                onClick={closeMenu}
                                            >
                                                <DollarSign className="h-4 w-4 text-emerald-500" />
                                                Rémunérations
                                            </Link>
                                            <div className="px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900">
                                                Mon compte
                                            </div>
                                            <Link
                                                to="/account/profile"
                                                className="flex items-center gap-3 px-4 py-3 text-slate-700 transition hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-slate-800/70"
                                                onClick={closeMenu}
                                            >
                                                <User className="h-4 w-4 text-slate-500" />
                                                Paramètres
                                            </Link>
                                            <Link
                                                to="/accounts"
                                                className="flex items-center gap-3 px-4 py-3 text-slate-700 transition hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-slate-800/70"
                                                onClick={closeMenu}
                                            >
                                                <ArrowLeftRight className="h-4 w-4 text-sky-500" />
                                                Changer de compte
                                            </Link>
                                                </>
                                            ) : (
                                                <>
                                            <div className="px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900">
                                                Navigation membre
                                            </div>
                                            <Link
                                                to="/club/members"
                                                className="flex items-center gap-3 px-4 py-3 text-slate-700 transition hover:bg-indigo-50 dark:text-slate-200 dark:hover:bg-slate-800/70"
                                                onClick={closeMenu}
                                            >
                                                <Users className="h-4 w-4 text-blue-500" />
                                                Espace membre
                                            </Link>
                                            <Link
                                                to="/club/famille"
                                                className="flex items-center gap-3 px-4 py-3 text-slate-700 transition hover:bg-indigo-50 dark:text-slate-200 dark:hover:bg-slate-800/70"
                                                onClick={closeMenu}
                                            >
                                                <Baby className="h-4 w-4 text-pink-500" />
                                                Ma famille
                                            </Link>
                                            <Link
                                                to="/club/notifications"
                                                className="flex items-center gap-3 px-4 py-3 text-slate-700 transition hover:bg-indigo-50 dark:text-slate-200 dark:hover:bg-slate-800/70"
                                                onClick={closeMenu}
                                            >
                                                <Bell className="h-4 w-4 text-indigo-500" />
                                                Notifications
                                            </Link>
                                            <Link
                                                to="/club/loyalty"
                                                className="flex items-center gap-3 px-4 py-3 text-slate-700 transition hover:bg-indigo-50 dark:text-slate-200 dark:hover:bg-slate-800/70"
                                                onClick={closeMenu}
                                            >
                                                <Sparkles className="h-4 w-4 text-amber-500" />
                                                Programme de fidélité
                                            </Link>
                                            <Link
                                                to="/account/subscriptions"
                                                className="flex items-center gap-3 px-4 py-3 text-slate-700 transition hover:bg-indigo-50 dark:text-slate-200 dark:hover:bg-slate-800/70"
                                                onClick={closeMenu}
                                            >
                                                <CreditCard className="h-4 w-4 text-emerald-500" />
                                                Abonnements & paiements
                                            </Link>
                                            <div className="px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900">
                                                Mon compte
                                            </div>
                                            <Link
                                                to="/account/profile"
                                                className="flex items-center gap-3 px-4 py-3 text-slate-700 transition hover:bg-indigo-50 dark:text-slate-200 dark:hover:bg-slate-800/70"
                                                onClick={closeMenu}
                                            >
                                                <User className="h-4 w-4 text-indigo-500" />
                                                Mon profil
                                            </Link>
                                            <Link
                                                to="/accounts"
                                                className="flex items-center gap-3 px-4 py-3 text-slate-700 transition hover:bg-indigo-50 dark:text-slate-200 dark:hover:bg-slate-800/70"
                                                onClick={closeMenu}
                                            >
                                                <ArrowLeftRight className="h-4 w-4 text-sky-500" />
                                                Changer de compte
                                            </Link>
                                                </>
                                            )}
                                            {isAuthenticated ? (
                                                <button
                                                    type="button"
                                                    className="flex items-center gap-3 px-4 py-3 text-left text-slate-700 transition hover:bg-red-50 dark:text-slate-200 dark:hover:bg-red-500/10"
                                                    onClick={async () => {
                                                        closeMenu();
                                                        await handleLogout();
                                                    }}
                                                    disabled={isLoggingOut || isLoading}
                                                >
                                                    <LogOut className="h-4 w-4 text-red-500" />
                                                    {isLoggingOut ? 'Déconnexion…' : 'Déconnexion'}
                                                </button>
                                            ) : (
                                                <div className="p-4 space-y-2">
                                                    <Link
                                                        to="/login"
                                                        className="inline-flex w-full items-center justify-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
                                                        onClick={closeMenu}
                                                    >
                                                        Se connecter
                                                    </Link>
                                                    <Link
                                                        to="/register"
                                                        className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-100 dark:hover:border-indigo-400"
                                                        onClick={closeMenu}
                                                    >
                                                        Créer un compte
                                                    </Link>
                                                </div>
                                            )}
                                        </nav>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                <div className="mb-6 lg:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {title}
                    </h1>
                    <p className="text-gray-600 dark:text-slate-300">
                        {subtitle}
                    </p>
                </div>
                {children}
            </main>
        </div>
    );
};

export default Layout;
