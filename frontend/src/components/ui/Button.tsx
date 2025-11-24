import React from 'react';
import type { LucideProps } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    mode?: 'club' | 'municipalite';
    icon?: React.ComponentType<LucideProps>;
    iconPosition?: 'left' | 'right';
    children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    mode = 'club',
    icon: Icon,
    iconPosition = 'right',
    className = '',
    children,
    ...props
}) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const sizeClasses = {
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-2.5 text-base',
        lg: 'px-6 py-3 text-lg'
    };

    const modeClasses = {
        club: {
            primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
            secondary: 'bg-blue-50 hover:bg-blue-100 text-blue-700 focus:ring-blue-500',
            outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
            ghost: 'text-blue-600 hover:bg-blue-50 focus:ring-blue-500'
        },
        municipalite: {
            primary: 'bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500',
            secondary: 'bg-purple-50 hover:bg-purple-100 text-purple-700 focus:ring-purple-500',
            outline: 'border-2 border-purple-600 text-purple-600 hover:bg-purple-50 focus:ring-purple-500',
            ghost: 'text-purple-600 hover:bg-purple-50 focus:ring-purple-500'
        }
    };

    const classes = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${modeClasses[mode][variant]}
    ${className}
  `.trim();

    return (
        <button className={classes} {...props}>
            {Icon && iconPosition === 'left' && (
                <Icon className="w-4 h-4 mr-2" />
            )}
            {children}
            {Icon && iconPosition === 'right' && (
                <Icon className="w-4 h-4 ml-2" />
            )}
        </button>
    );
};

export default Button;
