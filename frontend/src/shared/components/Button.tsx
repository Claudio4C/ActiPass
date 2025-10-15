import React from 'react';
import { type AppMode } from '../../types';

interface ButtonProps {
    children: React.ReactNode;
    type?: 'button' | 'submit' | 'reset';
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    mode?: AppMode;
    icon?: React.ComponentType<{ className?: string }>;
    iconPosition?: 'left' | 'right';
    disabled?: boolean;
    className?: string;
    onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({
    children,
    type = 'button',
    variant = 'primary',
    size = 'md',
    mode = 'club',
    icon: Icon,
    iconPosition = 'left',
    disabled = false,
    className = '',
    onClick
}) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const sizeClasses = {
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base'
    };

    const variantClasses = {
        primary: mode === 'club'
            ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
            : 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500',
        secondary: mode === 'club'
            ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500'
            : 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
        outline: mode === 'club'
            ? 'border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500'
            : 'border border-purple-600 text-purple-600 hover:bg-purple-50 focus:ring-purple-500'
    };

    const iconClasses = Icon ? (iconPosition === 'left' ? 'mr-2' : 'ml-2') : '';

    return (
        <button
            type={type}
            disabled={disabled}
            onClick={onClick}
            className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${iconClasses} ${className}`}
        >
            {Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
            {children}
            {Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
        </button>
    );
};

export default Button;
