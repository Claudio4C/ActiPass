import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { type AppMode } from '../types';
import VerifyEmail from '../pages/VerifyEmail';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import ResendVerification from '../pages/ResendVerification';
import MembersPage from '../pages/club/MembersPage';
import ProfilePage from '../pages/club/ProfilePage';
import SubscriptionPage from '../pages/club/SubscriptionPage';
import NotificationsPage from '../pages/club/NotificationsPage';
import TeachersPage from '../pages/club/TeachersPage';
import DisciplinesPage from '../pages/club/DisciplinesPage';
import VideoLessonsPage from '../pages/club/VideoLessonsPage';
import PlanningPage from '../pages/club/PlanningPage';
import AccountSwitch from '../pages/AccountSwitch';
import LoyaltyPage from '../pages/club/LoyaltyPage';

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
}> = ({ children, requiredMode }) => {
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
                        <ProtectedRoute requiredMode={mode}>
                            <DashboardComponent />
                        </ProtectedRoute>
                    }
                />
                {/* Espace membres (club) */}
                <Route
                    path="/club/members"
                    element={
                        <MembersPage />
                    }
                />
                <Route
                    path="/club/loyalty"
                    element={
                        <LoyaltyPage />
                    }
                />
                <Route
                    path="/club/notifications"
                    element={
                        <NotificationsPage />
                    }
                />
                <Route
                    path="/club/professeurs"
                    element={
                        <TeachersPage />
                    }
                />
                <Route
                    path="/club/disciplines"
                    element={
                        <DisciplinesPage />
                    }
                />
                <Route
                    path="/club/cours-video"
                    element={
                        <VideoLessonsPage />
                    }
                />
                <Route
                    path="/club/planning"
                    element={
                        <PlanningPage />
                    }
                />
                {/* Sélection de compte / organisation */}
                <Route
                    path="/accounts"
                    element={<AccountSwitch />}
                />
                <Route
                    path="/account/profile"
                    element={
                        <ProfilePage />
                    }
                />
                <Route
                    path="/account/subscriptions"
                    element={
                        <SubscriptionPage />
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
