import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import Login from './pages/Login';
import DashboardPage from '../../pages/superadmin/DashboardPage';
import UsersPage from '../../pages/superadmin/UsersPage';
import UserDetailPage from '../../pages/superadmin/UserDetailPage';
import OrganisationsPage from '../../pages/superadmin/OrganisationsPage';
import OrganisationDetailPage from '../../pages/superadmin/OrganisationDetailPage';
import MembershipsPage from '../../pages/superadmin/MembershipsPage';
import CreateSuperAdminPage from '../../pages/superadmin/CreateSuperAdminPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/superadmin/login" replace />;
    }

    // Vérifier que l'utilisateur est bien SuperAdmin
    if (!user.is_super_admin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h2>
                    <p className="text-gray-600 mb-6">
                        Vous n'avez pas les permissions nécessaires pour accéder à l'espace Super Admin.
                    </p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Retour à l'accueil
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

const AppContent: React.FC = () => {
    const { user } = useAuth();

    return (
        <Router>
            <Routes>
                <Route path="/superadmin/login" element={user ? <Navigate to="/superadmin" replace /> : <Login />} />

                <Route
                    path="/superadmin"
                    element={
                        <ProtectedRoute>
                            <DashboardPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/superadmin/users"
                    element={
                        <ProtectedRoute>
                            <UsersPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/superadmin/users/:id"
                    element={
                        <ProtectedRoute>
                            <UserDetailPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/superadmin/create-super-admin"
                    element={
                        <ProtectedRoute>
                            <CreateSuperAdminPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/superadmin/organisations"
                    element={
                        <ProtectedRoute>
                            <OrganisationsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/superadmin/organisations/:id"
                    element={
                        <ProtectedRoute>
                            <OrganisationDetailPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/superadmin/memberships"
                    element={
                        <ProtectedRoute>
                            <MembershipsPage />
                        </ProtectedRoute>
                    }
                />

                <Route path="/superadmin/*" element={<Navigate to="/superadmin" replace />} />
            </Routes>
        </Router>
    );
};

const SuperAdminApp: React.FC = () => {
    return (
        <AuthProvider initialMode="club">
            <AppContent />
        </AuthProvider>
    );
};

export default SuperAdminApp;

