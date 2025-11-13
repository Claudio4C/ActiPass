import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import Checkbox from '../../../shared/components/Checkbox';
import { useFormValidation } from '../../../hooks/useFormValidation';
import { loginSchema, type LoginFormData } from '../../../shared/schemas/auth';

const Login: React.FC = () => {
    const { login, isLoading, error, clearError } = useAuth();
    const navigate = useNavigate();

    const {
        values: formData,
        setValue,
        validate,
        handleBlur,
        handleFocus,
        getFieldError,
    } = useFormValidation<LoginFormData>({
        schema: loginSchema,
        initialValues: { email: '', password: '', rememberMe: false }
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setValue(name as keyof LoginFormData, type === 'checkbox' ? checked : value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        try {
            await login(formData.email, formData.password);
            navigate('/admin');
        } catch { }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="flex items-center justify-center mb-6">
                        <div className="w-12 h-12 bg-[#0F2147] rounded-2xl flex items-center justify-center mr-3">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Espace Administration</h2>
                            <p className="text-gray-600 text-sm">Connectez-vous à votre tableau de bord</p>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center justify-between">
                            <p className="text-red-600 text-sm">{error}</p>
                            <button type="button" onClick={clearError} className="text-red-400 hover:text-red-600">×</button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="Adresse email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            onFocus={() => handleFocus('email')}
                            onBlur={() => handleBlur('email')}
                            placeholder="admin@exemple.com"
                            icon={Mail}
                            error={getFieldError('email')}
                            mode="club"
                        />

                        <Input
                            label="Mot de passe"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            onFocus={() => handleFocus('password')}
                            onBlur={() => handleBlur('password')}
                            placeholder="••••••••"
                            icon={Lock}
                            error={getFieldError('password')}
                            mode="club"
                        />

                        <div className="flex items-center justify-between">
                            <Checkbox
                                name="rememberMe"
                                checked={formData.rememberMe}
                                onChange={handleInputChange}
                                label="Se souvenir de moi"
                                mode="club"
                            />
                            <Link to="/admin/forgot-password" className="text-sm font-medium text-blue-600 hover:underline">
                                Mot de passe oublié ?
                            </Link>
                        </div>

                        <Button type="submit" variant="primary" size="lg" mode="club" icon={ArrowRight} iconPosition="right" disabled={isLoading} className="w-full">
                            {isLoading ? 'Connexion...' : 'Se connecter'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;

