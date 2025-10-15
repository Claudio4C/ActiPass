import React from 'react';
import { type AppMode } from '../../types';

interface InputProps {
    label: string;
    type?: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    placeholder?: string;
    icon?: React.ComponentType<{ className?: string }>;
    error?: string;
    mode?: AppMode;
    disabled?: boolean;
    className?: string;
}

const Input: React.FC<InputProps> = ({
    label,
    type = 'text',
    name,
    value,
    onChange,
    onFocus,
    onBlur,
    placeholder,
    icon: Icon,
    error,
    mode = 'club',
    disabled = false,
    className = ''
}) => {
    const baseClasses = 'block w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors duration-200';

    const modeClasses = mode === 'club'
        ? 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
        : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500';

    const errorClasses = error
        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
        : modeClasses;

    const disabledClasses = disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white';

    return (
        <div className={className}>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
                {label}
            </label>
            <div className="relative">
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Icon className={`w-5 h-5 ${error ? 'text-red-400' : mode === 'club' ? 'text-blue-400' : 'text-purple-400'}`} />
                    </div>
                )}
                <input
                    type={type}
                    id={name}
                    name={name}
                    value={value}
                    onChange={onChange}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    disabled={disabled}
                    autoComplete={type === 'password' ? 'current-password' : type === 'email' ? 'email' : 'off'}
                    className={`${baseClasses} ${errorClasses} ${disabledClasses} ${Icon ? 'pl-10' : ''}`}
                />
            </div>
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
};

export default Input;
