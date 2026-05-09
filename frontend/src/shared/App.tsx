import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { type AppMode } from '../types'

// Layouts
import MemberLayout from '../layouts/MemberLayout'
import ClubLayout from '../layouts/ClubLayout'
import CoachLayout from '../layouts/CoachLayout'
import AdminDashboardLayout from '../layouts/AdminDashboardLayout'
import SimpleLayout from '../layouts/SimpleLayout'

// Auth pages
import VerifyEmail from '../pages/VerifyEmail'
import ForgotPassword from '../pages/ForgotPassword'
import ResetPassword from '../pages/ResetPassword'
import ResendVerification from '../pages/ResendVerification'

// General pages
import HomePage from '../pages/HomePage'
import DiscoverPage from '../pages/DiscoverPage'
import AccountSwitch from '../pages/AccountSwitch'
import OnboardingPage from '../pages/OnboardingPage'

// Club member space (org-specific)
import ClubsPage from '../pages/club/ClubsPage'
import ClubHomePage from '../pages/club/ClubHomePage'
import ClubPlanningPage from '../pages/club/ClubPlanningPage'
import ClubOrgEventsPage from '../pages/club/ClubOrgEventsPage'
import ComingSoon from '../components/shared/ComingSoon'

// Club / member pages
import ClubMembersPage from '../pages/club/MembersPage'
import ProfilePage from '../pages/club/ProfilePage'
import SubscriptionPage from '../pages/club/SubscriptionPage'
import NotificationsPage from '../pages/club/NotificationsPage'
import TeachersPage from '../pages/club/TeachersPage'
import DisciplinesPage from '../pages/club/DisciplinesPage'
import VideoLessonsPage from '../pages/club/VideoLessonsPage'
import GalleryPage from '../pages/club/GalleryPage'
import NewsPage from '../pages/club/NewsPage'
import NewsDetailPage from '../pages/club/NewsDetailPage'
import PlanningPage from '../pages/club/PlanningPage'
import EventsPageClub from '../pages/club/EventsPage'
import EventDetailPageClub from '../pages/club/EventDetailPage'
import CreateTripPage from '../pages/club/CreateTripPage'
import TripViewPage from '../pages/club/TripViewPage'
import LoyaltyPage from '../pages/club/LoyaltyPage'
import FamilyPage from '../pages/club/FamilyPage'
import FamilyDashboardPage from '../pages/club/FamilyDashboardPage'
import ChildDetailPage from '../pages/club/ChildDetailPage'
import CoachesDirectoryPage from '../pages/club/CoachesDirectoryPage'

// Coach pages
import CoachPlanningPage from '../pages/coach/PlanningPage'
import CoachProfilePage from '../pages/coach/ProfilePage'
import CoachApplicationsPage from '../pages/coach/ApplicationsPage'
import CoachBillingPage from '../pages/coach/BillingPage'
import CoachMessagesPage from '../pages/coach/MessagesPage'
import CoachMessageDetailPage from '../pages/coach/MessageDetailPage'
import CoachDetailPage from '../pages/CoachDetailPage'

// Dashboard (admin/owner) pages
import OverviewPage from '../pages/dashboard/OverviewPage'
import MembersPage from '../pages/dashboard/MembersPage'
import MemberDetailPage from '../pages/dashboard/MemberDetailPage'
import EventsPage from '../pages/dashboard/EventsPage'
import EventCreatePage from '../pages/dashboard/EventCreatePage'
import EventEditPage from '../pages/dashboard/EventEditPage'
import EventDetailPage from '../pages/dashboard/EventDetailPage'
import AttendancePage from '../pages/dashboard/AttendancePage'
import AttendanceDetailPage from '../pages/dashboard/AttendanceDetailPage'
import AttendanceStatsPage from '../pages/dashboard/AttendanceStatsPage'
import SettingsPage from '../pages/dashboard/SettingsPage'

interface AppProps {
    mode: AppMode;
    LoginComponent: React.ComponentType;
    RegisterComponent: React.ComponentType;
    DashboardComponent: React.ComponentType;
    protectedPath: string;
}

const ProtectedRoute: React.FC<{
    children: React.ReactNode;
    requiredMode: AppMode;
}> = ({ children, requiredMode }) => {
  const { user, mode } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (mode !== requiredMode) {
    return <Navigate to="/home" replace />
  }

  return <>{children}</>
}

const AppContent: React.FC<{
    mode: AppMode;
    LoginComponent: React.ComponentType;
    RegisterComponent: React.ComponentType;
    DashboardComponent: React.ComponentType;
    protectedPath: string;
}> = ({ mode, LoginComponent, RegisterComponent, DashboardComponent, protectedPath }) => {
  const { user } = useAuth()

  const postLoginTarget = (): string => {
    if (localStorage.getItem('ikivio_onboarding_page_done') === '1') { return '/home' }
    const t = localStorage.getItem('ikivio_onboarding_type')
    return t && t !== 'member' ? '/onboarding' : '/home'
  }

  return (
    <Router>
      <Routes>
        {/* ═══════════════════════════════════════
                    Authentification (aucun layout)
                ═══════════════════════════════════════ */}
        <Route
          path="/login"
          element={user ? <Navigate to={postLoginTarget()} replace /> : <LoginComponent />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to={postLoginTarget()} replace /> : <RegisterComponent />}
        />
        <Route path="/verify-email/:userId/:token" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/resend-verification" element={<ResendVerification />} />

        {/* ═══════════════════════════════════════
                    Pages generales (SimpleLayout — header seul)
                ═══════════════════════════════════════ */}
        <Route
          element={
            <ProtectedRoute requiredMode={mode}>
              <SimpleLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/home" element={<HomePage />} />
          <Route path="/accounts" element={<AccountSwitch />} />
        </Route>

        {/* Onboarding — logo seul, sans navigation */}
        <Route
          element={
            <ProtectedRoute requiredMode={mode}>
              <SimpleLayout hideNav />
            </ProtectedRoute>
          }
        >
          <Route path="/onboarding" element={<OnboardingPage />} />
        </Route>
        <Route path="/discover" element={<DiscoverPage />} />

        {/* ═══════════════════════════════════════
                    Espace membre  (MemberLayout — sidebar bleue)
                ═══════════════════════════════════════ */}
        <Route
          element={
            <ProtectedRoute requiredMode={mode}>
              <MemberLayout />
            </ProtectedRoute>
          }
        >
          {/* /club redirige vers /club/members (contenu réel) */}
          <Route path={protectedPath} element={<Navigate to="/club/members" replace />} />
          <Route path="/club/members" element={<ClubMembersPage />} />
          <Route path="/club/planning" element={<PlanningPage />} />
          <Route path="/club/events" element={<EventsPageClub />} />
          <Route path="/club/events/:eventId" element={<EventDetailPageClub />} />
          <Route path="/club/events/:eventId/create-trip" element={<CreateTripPage />} />
          <Route path="/club/events/:eventId/trip" element={<TripViewPage />} />
          <Route path="/clubs" element={<ClubsPage />} />
          <Route path="/club/famille" element={<FamilyPage />} />
          <Route path="/club/famille/planning" element={<FamilyDashboardPage />} />
          <Route path="/club/famille/:childId" element={<ChildDetailPage />} />
          <Route path="/club/notifications" element={<NotificationsPage />} />
          <Route path="/club/loyalty" element={<LoyaltyPage />} />
          <Route path="/club/professeurs" element={<TeachersPage />} />
          <Route path="/club/disciplines" element={<DisciplinesPage />} />
          <Route path="/club/cours-video" element={<VideoLessonsPage />} />
          <Route path="/account/profile" element={<ProfilePage />} />
          <Route path="/account/subscriptions" element={<SubscriptionPage />} />
        </Route>

        {/* ═══════════════════════════════════════
                    Espace membre club spécifique  (ClubLayout — hero bleu + sidebar)
                    Note: routes statiques /club/members, /club/planning, etc. ont priorité
                    sur /club/:orgId grâce à React Router v6 (static > dynamic)
                ═══════════════════════════════════════ */}
        <Route
          element={
            <ProtectedRoute requiredMode={mode}>
              <ClubLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/club/:orgId" element={<ClubHomePage />} />
          <Route path="/club/:orgId/planning" element={<ClubPlanningPage />} />
          <Route path="/club/:orgId/events" element={<ClubOrgEventsPage />} />
          <Route path="/club/:orgId/famille" element={<FamilyPage />} />
          <Route path="/club/:orgId/coaches" element={<ComingSoon title="Coachs" description="L'annuaire des coachs sera disponible prochainement." />} />
          <Route path="/club/:orgId/deplacements" element={<ComingSoon title="Déplacements" description="La gestion des déplacements sera disponible prochainement." />} />
          <Route path="/club/:orgId/notifications" element={<ComingSoon title="Notifications" description="Vos notifications seront disponibles prochainement." />} />
          <Route path="/club/:orgId/abonnements" element={<ComingSoon title="Abonnements & paiements" description="La gestion des abonnements sera disponible prochainement." />} />
          <Route path="/club/:orgId/fidelite" element={<ComingSoon title="Fidélité" description="Votre programme de fidélité sera disponible prochainement." />} />
          <Route path="/club/:orgId/documents" element={<ComingSoon title="Documents" description="Vos documents seront disponibles prochainement." />} />
          <Route path="/club/:orgId/inviter" element={<ComingSoon title="Inviter" description="La fonctionnalité d'invitation sera disponible prochainement." />} />
        </Route>

        {/* Pages club publiques (pas de sidebar, pas d'auth) */}
        <Route path="/club/galerie" element={<GalleryPage />} />
        <Route path="/club/actualites" element={<NewsPage />} />
        <Route path="/club/actualites/:articleId" element={<NewsDetailPage />} />
        <Route path="/club/coaches" element={<CoachesDirectoryPage />} />

        {/* ═══════════════════════════════════════
                    Espace coach  (CoachLayout — sidebar emeraude)
                ═══════════════════════════════════════ */}
        <Route
          element={
            <ProtectedRoute requiredMode={mode}>
              <CoachLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/coach/planning" element={<CoachPlanningPage />} />
          <Route path="/coach/profile" element={<CoachProfilePage />} />
          <Route path="/coach/messages" element={<CoachMessagesPage />} />
          <Route path="/coach/messages/:messageId" element={<CoachMessageDetailPage />} />
          <Route path="/coach/applications" element={<CoachApplicationsPage />} />
          <Route path="/coach/billing" element={<CoachBillingPage />} />
        </Route>

        {/* Fiche coach publique */}
        <Route path="/coach/independants/:coachId" element={<CoachDetailPage />} />

        {/* ═══════════════════════════════════════
                    Dashboard admin / owner  (AdminDashboardLayout)
                ═══════════════════════════════════════ */}
        <Route
          element={
            <ProtectedRoute requiredMode={mode}>
              <AdminDashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard/:organisationId" element={<Navigate to="overview" replace />} />
          <Route path="/dashboard/:organisationId/overview" element={<OverviewPage />} />
          <Route path="/dashboard/:organisationId/members" element={<MembersPage />} />
          <Route path="/dashboard/:organisationId/members/:memberId" element={<MemberDetailPage />} />
          <Route path="/dashboard/:organisationId/events" element={<EventsPage />} />
          <Route path="/dashboard/:organisationId/events/create" element={<EventCreatePage />} />
          <Route path="/dashboard/:organisationId/events/:eventId" element={<EventDetailPage />} />
          <Route path="/dashboard/:organisationId/events/:eventId/edit" element={<EventEditPage />} />
          <Route path="/dashboard/:organisationId/attendance" element={<AttendancePage />} />
          <Route path="/dashboard/:organisationId/attendance/stats" element={<AttendanceStatsPage />} />
          <Route path="/dashboard/:organisationId/attendance/:eventId" element={<AttendanceDetailPage />} />
          <Route path="/dashboard/:organisationId/settings" element={<SettingsPage />} />
        </Route>

        {/* ═══════════════════════════════════════
                    Fallback
                ═══════════════════════════════════════ */}
        <Route
          path="/"
          element={user ? <Navigate to="/home" replace /> : <DiscoverPage />}
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}

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
  )
}

export default App
