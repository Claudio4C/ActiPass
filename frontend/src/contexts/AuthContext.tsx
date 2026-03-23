import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { AuthContextType, AppMode, User, RegisterData } from '../types';
import { authService } from '../services/auth.service';
import { ApiError, NetworkError } from '../lib/errors';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
    initialMode?: AppMode;
}

const getInitialMode = (fallback: AppMode): AppMode => {
    const urlMode = window.location.pathname.includes('/municipalite') ? 'municipalite' : 'club';
    const savedMode = localStorage.getItem('appMode') as AppMode;
    return savedMode || urlMode || fallback;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({
    children,
    initialMode = 'club'
}) => {
    const [user, setUser] = useState<User | null>(null);
    const [mode, setMode] = useState<AppMode>(() => getInitialMode(initialMode));
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Utiliser une ref pour éviter les dépendances cycliques
    const modeRef = useRef(mode);
    modeRef.current = mode;

    // Synchroniser le mode avec initialMode SEULEMENT au montage
    useEffect(() => {
        if (initialMode && initialMode !== mode) {
            setMode(initialMode);
            localStorage.setItem('appMode', initialMode);
        }
    }, [initialMode]); // ⚠️ initialMode ne devrait jamais changer après le montage

    const login = useCallback(async (email: string, password: string): Promise<void> => {
        setIsLoading(true);
        setError(null);
        try {

            const response = await authService.login({ email, password });

            // Utiliser modeRef pour éviter la dépendance
            const user: User = {
                id: response.user.id,
                email: response.user.email,
                firstName: response.user.firstname,
                lastName: response.user.lastname,
                organizationName: response.user.username,
                phone: response.user.phone,
                mode: modeRef.current, // ← Utilise la ref au lieu du state
                is_super_admin: response.user.is_super_admin || false
            };

            setUser(user);
            localStorage.setItem('user', JSON.stringify(user));
        } catch (error) {
            console.error('Login error:', error);

            if (error instanceof ApiError) {
                if (error.statusCode === 401) {
                    setError('Email ou mot de passe incorrect');
                } else if (error.statusCode === 422) {
                    setError('Les données saisies ne sont pas valides');
                } else {
                    setError(error.message);
                }
            } else if (error instanceof NetworkError) {
                setError('Impossible de joindre le serveur. Vérifiez votre connexion.');
            } else {
                setError('Une erreur inattendue s\'est produite');
            }

            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []); // ← Plus de dépendances !

    const register = useCallback(async (userData: RegisterData): Promise<void> => {
        setIsLoading(true);
        setError(null);
        try {
            console.log('Register attempt:', userData);

            const registerData = {
                email: userData.email,
                password: userData.password,
                confirmPassword: userData.confirmPassword,
                firstname: userData.firstname,
                lastname: userData.lastname,
                username: userData.username,
                gender: userData.gender || 'prefer_not_to_say',
                phone: userData.phone,
                birthdate: userData.birthdate,
                address: userData.address,
                city: userData.city,
                country: userData.country,
                postalCode: userData.postalCode,
                bio: userData.bio
            };

            const response = await authService.register(registerData);
            console.log('Registration successful:', response.message);

        } catch (error) {
            console.error('Register error:', error);

            if (error instanceof ApiError) {
                if (error.statusCode === 409) {
                    setError('Cette adresse email est déjà utilisée');
                } else if (error.statusCode === 422) {
                    setError('Les données saisies ne sont pas valides');
                } else {
                    setError(error.message);
                }
            } else if (error instanceof NetworkError) {
                setError('Impossible de joindre le serveur. Vérifiez votre connexion.');
            } else {
                setError('Une erreur inattendue s\'est produite');
            }

            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(async (): Promise<void> => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            setError(null);
            localStorage.removeItem('user');
        }
    }, []);

    const clearError = useCallback((): void => {
        setError(null);
    }, []);

    const handleSetMode = useCallback((newMode: AppMode): void => {
        setMode(newMode);
        localStorage.setItem('appMode', newMode);
    }, []);

    // Vérifier si l'utilisateur est connecté au chargement
    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                setUser(userData);
            } catch (error) {
                console.error('Error parsing saved user:', error);
                localStorage.removeItem('user');
            }
        }
    }, []);

    const value: AuthContextType = useMemo(() => ({
        user,
        mode,
        setMode: handleSetMode,
        login,
        register,
        logout,
        isLoading,
        error,
        clearError
    }), [user, mode, login, register, logout, isLoading, error, clearError, handleSetMode]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};