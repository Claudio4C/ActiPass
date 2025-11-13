import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardPage from '../../pages/admin/DashboardPage';
import AssociationsPage from '../../pages/admin/AssociationsPage';
import MembersPage from '../../pages/admin/MembersPage';
import MunicipalitiesPage from '../../pages/admin/MunicipalitiesPage';
import SettingsPage from '../../pages/admin/SettingsPage';
import VerifyEmail from '../../pages/VerifyEmail';
import ForgotPassword from '../../pages/ForgotPassword';
import ResetPassword from '../../pages/ResetPassword';
import ResendVerification from '../../pages/ResendVerification';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    if (!user) {
        return <Navigate to="/admin/login" replace />;
    }
    return <>{children}</>;
};

const AppContent: React.FC = () => {
    const { user } = useAuth();

    return (
        <Router>
            <Routes>
                <Route path="/admin/login" element={user ? <Navigate to="/admin" replace /> : <Login />} />
                <Route path="/admin/register" element={user ? <Navigate to="/admin" replace /> : <Register />} />
                <Route path="/admin/verify-email/:userId/:token" element={<VerifyEmail />} />
                <Route path="/admin/forgot-password" element={<ForgotPassword />} />
                <Route path="/admin/reset-password" element={<ResetPassword />} />
                <Route path="/admin/resend-verification" element={<ResendVerification />} />

                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute>
                            <DashboardPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/associations"
                    element={
                        <ProtectedRoute>
                            <AssociationsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/members"
                    element={
                        <ProtectedRoute>
                            <MembersPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/municipalities"
                    element={
                        <ProtectedRoute>
                            <MunicipalitiesPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/settings"
                    element={
                        <ProtectedRoute>
                            <SettingsPage />
                        </ProtectedRoute>
                    }
                />

                <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
            </Routes>
        </Router>
    );
};

const AdminApp: React.FC = () => {
    return (
        <AuthProvider initialMode="club">
            <AppContent />
        </AuthProvider>
    );
};

export default AdminApp;

