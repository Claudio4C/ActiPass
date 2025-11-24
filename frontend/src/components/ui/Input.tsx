import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: React.ComponentType<LucideProps>;
    error?: string;
    mode?: 'club' | 'municipalite';
}

const Input: React.FC<InputProps> = ({
    label,
    icon: Icon,
    error,
    mode = 'club',
    type = 'text',
    className = '',
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    const baseClasses = 'w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

    const modeClasses = {
        club: {
            normal: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
            error: 'border-red-500 focus:border-red-500 focus:ring-red-500'
        },
        municipalite: {
            normal: 'border-gray-300 focus:border-purple-500 focus:ring-purple-500',
            error: 'border-red-500 focus:border-red-500 focus:ring-red-500'
        }
    };

    const inputClasses = `
    ${baseClasses}
    ${modeClasses[mode][error ? 'error' : 'normal']}
    ${Icon ? 'pl-12' : 'pl-4'}
    ${isPassword ? 'pr-12' : 'pr-4'}
    ${className}
  `.trim();

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-bold text-gray-900 mb-2">
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <Icon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                )}
                <input
                    type={inputType}
                    className={inputClasses}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                )}
            </div>
            {error && (
                <p className="mt-1 text-sm text-red-800 font-medium">{error}</p>
            )}
        </div>
    );
};

export default Input;
