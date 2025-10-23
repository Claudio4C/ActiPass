import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { type AppMode } from '../types';
import VerifyEmail from '../pages/VerifyEmail';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import ResendVerification from '../pages/ResendVerification';

interface AppProps {
    mode: AppMode;
    LoginComponent: React.ComponentType;
    RegisterComponent: React.ComponentType;
    DashboardComponent: React.ComponentType;
    protectedPath: string;
}

// Composant pour protéger les routes
const ProtectedRoute: React.FC<{
    children: React.ReactNode;
    requiredMode: AppMode;
    protectedPath: string;
}> = ({ children, requiredMode, protectedPath }) => {
    const { user, mode } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Vérifier que l'utilisateur est bien dans le bon mode
    if (mode !== requiredMode) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

// Composant principal de l'application
const AppContent: React.FC<{
    mode: AppMode;
    LoginComponent: React.ComponentType;
    RegisterComponent: React.ComponentType;
    DashboardComponent: React.ComponentType;
    protectedPath: string;
}> = ({ mode, LoginComponent, RegisterComponent, DashboardComponent, protectedPath }) => {
    const { user } = useAuth();

    return (
        <Router>
            <Routes>
                {/* Routes d'authentification */}
                <Route
                    path="/login"
                    element={user ? <Navigate to={protectedPath} replace /> : <LoginComponent />}
                />
                <Route
                    path="/register"
                    element={user ? <Navigate to={protectedPath} replace /> : <RegisterComponent />}
                />

                {/* Routes de gestion des comptes */}
                <Route
                    path="/verify-email/:userId/:token"
                    element={<VerifyEmail />}
                />
                <Route
                    path="/forgot-password"
                    element={<ForgotPassword />}
                />
                <Route
                    path="/reset-password"
                    element={<ResetPassword />}
                />
                <Route
                    path="/resend-verification"
                    element={<ResendVerification />}
                />

                {/* Routes protégées */}
                <Route
                    path={protectedPath}
                    element={
                        <ProtectedRoute requiredMode={mode} protectedPath={protectedPath}>
                            <DashboardComponent />
                        </ProtectedRoute>
                    }
                />

                {/* Redirection par défaut vers login */}
                <Route
                    path="/"
                    element={<Navigate to="/login" replace />}
                />

                {/* Route de fallback */}
                <Route
                    path="*"
                    element={<Navigate to="/login" replace />}
                />
            </Routes>
        </Router>
    );
};

// Application générique avec le provider d'authentification
const App: React.FC<AppProps> = ({ mode, LoginComponent, RegisterComponent, DashboardComponent, protectedPath }) => {
    return (
        <AuthProvider initialMode={mode}>
            <AppContent
                mode={mode}
                LoginComponent={LoginComponent}
                RegisterComponent={RegisterComponent}
                DashboardComponent={DashboardComponent}
                protectedPath={protectedPath}
            />
        </AuthProvider>
    );
};

export default App;
