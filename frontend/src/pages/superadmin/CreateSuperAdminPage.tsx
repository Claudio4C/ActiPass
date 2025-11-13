import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import Button from '../../shared/components/Button';
import { api } from '../../lib/api';

const CreateSuperAdminPage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        firstname: '',
        lastname: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.email) {
            newErrors.email = 'L\'email est requis';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'L\'email n\'est pas valide';
        }

        if (!formData.username) {
            newErrors.username = 'Le nom d\'utilisateur est requis';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
        }

        if (!formData.firstname) {
            newErrors.firstname = 'Le prénom est requis';
        }

        if (!formData.lastname) {
            newErrors.lastname = 'Le nom est requis';
        }

        if (!formData.password) {
            newErrors.password = 'Le mot de passe est requis';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        try {
            setLoading(true);
            await api.post('/super-admin/create-super-admin', {
                email: formData.email,
                username: formData.username,
                firstname: formData.firstname,
                lastname: formData.lastname,
                password: formData.password,
            });
            alert('Super Admin créé avec succès !');
            navigate('/superadmin/users');
        } catch (error: any) {
            console.error('Error creating super admin:', error);
            const errorMessage = error.response?.data?.message || 'Erreur lors de la création du Super Admin';
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout active="home" isSuperAdmin={true}>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/superadmin')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-4xl font-bold text-[#2A2A2A]">Créer un Super Admin</h1>
                </div>

                <div className="bg-white rounded-2xl p-8 border border-gray-100 max-w-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email *
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="email@example.com"
                            />
                            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nom d'utilisateur *
                            </label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.username ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="username"
                            />
                            {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Prénom *
                                </label>
                                <input
                                    type="text"
                                    value={formData.firstname}
                                    onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.firstname ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Prénom"
                                />
                                {errors.firstname && <p className="mt-1 text-sm text-red-600">{errors.firstname}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nom *
                                </label>
                                <input
                                    type="text"
                                    value={formData.lastname}
                                    onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.lastname ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Nom"
                                />
                                {errors.lastname && <p className="mt-1 text-sm text-red-600">{errors.lastname}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mot de passe *
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Minimum 8 caractères"
                            />
                            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirmer le mot de passe *
                            </label>
                            <input
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Confirmer le mot de passe"
                            />
                            {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                        </div>

                        <div className="flex items-center justify-end gap-4 pt-4">
                            <Button
                                type="button"
                                variant="secondary"
                                size="md"
                                mode="club"
                                onClick={() => navigate('/superadmin')}
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                size="md"
                                mode="club"
                                icon={UserPlus}
                                disabled={loading}
                            >
                                {loading ? 'Création...' : 'Créer le Super Admin'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
};

export default CreateSuperAdminPage;

