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
import GalleryPage from '../pages/club/GalleryPage';
import NewsPage from '../pages/club/NewsPage';
import NewsDetailPage from '../pages/club/NewsDetailPage';
import PlanningPage from '../pages/club/PlanningPage';
import EventsPageClub from '../pages/club/EventsPage';
import EventDetailPageClub from '../pages/club/EventDetailPage';
import CreateTripPage from '../pages/club/CreateTripPage';
import TripViewPage from '../pages/club/TripViewPage';
import AccountSwitch from '../pages/AccountSwitch';
import LoyaltyPage from '../pages/club/LoyaltyPage';
import FamilyPage from '../pages/club/FamilyPage';
import FamilyDashboardPage from '../pages/club/FamilyDashboardPage';
import CoachPlanningPage from '../pages/coach/PlanningPage';
import CoachProfilePage from '../pages/coach/ProfilePage';
import CoachApplicationsPage from '../pages/coach/ApplicationsPage';
import CoachBillingPage from '../pages/coach/BillingPage';
import CoachMessagesPage from '../pages/coach/MessagesPage';
import CoachMessageDetailPage from '../pages/coach/MessageDetailPage';
import CoachesDirectoryPage from '../pages/club/CoachesDirectoryPage';
import HomePage from '../pages/HomePage';
import DiscoverPage from '../pages/DiscoverPage';
import CoachDetailPage from '../pages/CoachDetailPage';
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
                    element={user ? <Navigate to="/home" replace /> : <LoginComponent />}
                />
                <Route
                    path="/register"
                    element={user ? <Navigate to="/home" replace /> : <RegisterComponent />}
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

                {/* Pages générales */}
                <Route
                    path="/home"
                    element={<HomePage />}
                />
                <Route
                    path="/discover"
                    element={<DiscoverPage />}
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
                        <ProtectedRoute requiredMode={mode}>
                            <ClubMembersPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/club/loyalty"
                    element={
                        <ProtectedRoute requiredMode={mode}>
                            <LoyaltyPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/club/famille"
                    element={
                        <ProtectedRoute requiredMode={mode}>
                            <FamilyPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/club/famille/planning"
                    element={
                        <ProtectedRoute requiredMode={mode}>
                            <FamilyDashboardPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/club/notifications"
                    element={
                        <ProtectedRoute requiredMode={mode}>
                            <NotificationsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/club/professeurs"
                    element={
                        <ProtectedRoute requiredMode={mode}>
                            <TeachersPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/club/disciplines"
                    element={
                        <ProtectedRoute requiredMode={mode}>
                            <DisciplinesPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/club/cours-video"
                    element={
                        <ProtectedRoute requiredMode={mode}>
                            <VideoLessonsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/club/galerie"
                    element={
                        <GalleryPage />
                    }
                />
                <Route
                    path="/club/actualites"
                    element={
                        <NewsPage />
                    }
                />
                <Route
                    path="/club/actualites/:articleId"
                    element={
                        <NewsDetailPage />
                    }
                />
                <Route
                    path="/club/planning"
                    element={
                        <ProtectedRoute requiredMode={mode}>
                            <PlanningPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/club/coaches"
                    element={
                        <CoachesDirectoryPage />
                    }
                />
                <Route
                    path="/club/events"
                    element={
                        <ProtectedRoute requiredMode={mode}>
                            <EventsPageClub />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/club/events/:eventId"
                    element={
                        <ProtectedRoute requiredMode={mode}>
                            <EventDetailPageClub />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/club/events/:eventId/create-trip"
                    element={
                        <ProtectedRoute requiredMode={mode}>
                            <CreateTripPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/club/events/:eventId/trip"
                    element={
                        <ProtectedRoute requiredMode={mode}>
                            <TripViewPage />
                        </ProtectedRoute>
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
                    element={
                        <ProtectedRoute requiredMode={mode}>
                            <AccountSwitch />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/account/profile"
                    element={
                        <ProtectedRoute requiredMode={mode}>
                            <ProfilePage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/account/subscriptions"
                    element={
                        <ProtectedRoute requiredMode={mode}>
                            <SubscriptionPage />
                        </ProtectedRoute>
                    }
                />

                {/* Espace coach */}
                <Route
                    path="/coach/planning"
                    element={
                        <CoachPlanningPage />
                    }
                />
                <Route
                    path="/coach/profile"
                    element={
                        <CoachProfilePage />
                    }
                />
                <Route
                    path="/coach/messages"
                    element={
                        <CoachMessagesPage />
                    }
                />
                <Route
                    path="/coach/messages/:messageId"
                    element={
                        <CoachMessageDetailPage />
                    }
                />
                <Route
                    path="/coach/applications"
                    element={
                        <CoachApplicationsPage />
                    }
                />
                <Route
                    path="/coach/billing"
                    element={
                        <CoachBillingPage />
                    }
                />
                <Route
                    path="/coach/independants/:coachId"
                    element={<CoachDetailPage />}
                />

                {/* Redirection par défaut vers login */}
                <Route
                    path="/"
                    element={user ? <Navigate to="/home" replace /> : <DiscoverPage />}
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
