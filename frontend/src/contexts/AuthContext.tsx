import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AuthContextType, AppMode, User, RegisterData } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
    initialMode?: AppMode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
    children,
    initialMode = 'club'
}) => {
    const [user, setUser] = useState<User | null>(null);
    const [mode, setMode] = useState<AppMode>(initialMode);
    const [isLoading, setIsLoading] = useState(false);

    // Récupérer le mode depuis l'URL ou le localStorage
    useEffect(() => {
        const urlMode = window.location.pathname.includes('/municipalite') ? 'municipalite' : 'club';
        const savedMode = localStorage.getItem('appMode') as AppMode;
        setMode(savedMode || urlMode);
    }, []);

    const login = async (email: string, password: string): Promise<void> => {
        setIsLoading(true);
        try {
            // TODO: Implémenter l'appel API de connexion
            console.log('Login attempt:', { email, password, mode });

            // Simulation d'une connexion réussie
            const mockUser: User = {
                id: '1',
                email,
                firstName: 'John',
                lastName: 'Doe',
                organizationName: mode === 'club' ? 'Tennis Club Paris' : 'Mairie de Paris',
                phone: '+33 6 12 34 56 78',
                mode
            };

            setUser(mockUser);
            localStorage.setItem('user', JSON.stringify(mockUser));
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (userData: RegisterData): Promise<void> => {
        setIsLoading(true);
        try {
            // TODO: Implémenter l'appel API d'inscription
            console.log('Register attempt:', userData);

            // Simulation d'une inscription réussie
            const newUser: User = {
                id: '1',
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                organizationName: userData.organizationName,
                phone: userData.phone,
                mode: userData.mode
            };

            setUser(newUser);
            localStorage.setItem('user', JSON.stringify(newUser));
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = (): void => {
        setUser(null);
        localStorage.removeItem('user');
    };

    const handleSetMode = (newMode: AppMode): void => {
        setMode(newMode);
        localStorage.setItem('appMode', newMode);
    };

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

    const value: AuthContextType = {
        user,
        mode,
        setMode: handleSetMode,
        login,
        register,
        logout,
        isLoading
    };

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
