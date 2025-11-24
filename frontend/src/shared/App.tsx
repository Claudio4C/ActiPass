import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { type AppMode } from '../types';
import VerifyEmail from '../pages/VerifyEmail';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import ResendVerification from '../pages/ResendVerification';
import ClubMembersPage from '../pages/club/MembersPage';
import ProfilePage from '../pages/club/ProfilePage';
import SubscriptionPage from '../pages/club/SubscriptionPage';
import NotificationsPage from '../pages/club/NotificationsPage';
import TeachersPage from '../pages/club/TeachersPage';
import DisciplinesPage from '../pages/club/DisciplinesPage';
import VideoLessonsPage from '../pages/club/VideoLessonsPage';
import PlanningPage from '../pages/club/PlanningPage';
import EventsPageClub from '../pages/club/EventsPage';
import AccountSwitch from '../pages/AccountSwitch';
import LoyaltyPage from '../pages/club/LoyaltyPage';
import OverviewPage from '../pages/dashboard/OverviewPage';
import MembersPage from '../pages/dashboard/MembersPage';
import MemberDetailPage from '../pages/dashboard/MemberDetailPage';
import EventsPage from '../pages/dashboard/EventsPage';
import EventCreatePage from '../pages/dashboard/EventCreatePage';
import EventEditPage from '../pages/dashboard/EventEditPage';
import EventDetailPage from '../pages/dashboard/EventDetailPage';

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
                        <ClubMembersPage />
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
                <Route
                    path="/club/events"
                    element={
                        <EventsPageClub />
                    }
                />
                {/* Routes Dashboard avec organisationId */}
                <Route
                    path="/dashboard/:organisationId/overview"
                    element={
                        <ProtectedRoute requiredMode={mode}>
                            <OverviewPage />
                        </ProtectedRoute>
                    }
                />
                {/* Redirection depuis /dashboard/:organisationId vers overview */}
                <Route
                    path="/dashboard/:organisationId"
                    element={
                        <ProtectedRoute requiredMode={mode}>
                            <Navigate to="overview" replace />
                        </ProtectedRoute>
                    }
                />
                {/* Routes Membres */}
                <Route
                    path="/dashboard/:organisationId/members"
                    element={
                        <ProtectedRoute requiredMode={mode}>
                            <MembersPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/:organisationId/members/:memberId"
                    element={
                        <ProtectedRoute requiredMode={mode}>
                            <MemberDetailPage />
                        </ProtectedRoute>
                    }
                />
                {/* Routes Événements */}
                <Route
                    path="/dashboard/:organisationId/events"
                    element={
                        <ProtectedRoute requiredMode={mode}>
                            <EventsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/:organisationId/events/create"
                    element={
                        <ProtectedRoute requiredMode={mode}>
                            <EventCreatePage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/:organisationId/events/:eventId"
                    element={
                        <ProtectedRoute requiredMode={mode}>
                            <EventDetailPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/:organisationId/events/:eventId/edit"
                    element={
                        <ProtectedRoute requiredMode={mode}>
                            <EventEditPage />
                        </ProtectedRoute>
                    }
                />
                {/* /dashboard/:organisationId/attendance */}
                {/* /dashboard/:organisationId/payments */}
                {/* /dashboard/:organisationId/documents */}
                {/* /dashboard/:organisationId/settings */}

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
