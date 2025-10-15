import React from 'react';
import { type AppMode } from '../../types';

interface CheckboxProps {
    name: string;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    label: React.ReactNode;
    error?: string;
    mode?: AppMode;
    disabled?: boolean;
    className?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
    name,
    checked,
    onChange,
    label,
    error,
    mode = 'club',
    disabled = false,
    className = ''
}) => {
    const baseClasses = 'h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-offset-0 transition-colors duration-200';

    const modeClasses = mode === 'club'
        ? 'text-blue-600 focus:ring-blue-500'
        : 'text-purple-600 focus:ring-purple-500';

    const errorClasses = error
        ? 'text-red-600 focus:ring-red-500 border-red-300'
        : modeClasses;

    return (
        <div className={`flex items-start ${className}`}>
            <div className="flex items-center h-5">
                <input
                    type="checkbox"
                    id={name}
                    name={name}
                    checked={checked}
                    onChange={onChange}
                    disabled={disabled}
                    className={`${baseClasses} ${errorClasses}`}
                />
            </div>
            <div className="ml-3 text-sm">
                <label htmlFor={name} className="font-medium text-gray-700">
                    {label}
                </label>
                {error && (
                    <p className="mt-1 text-sm text-red-600">{error}</p>
                )}
            </div>
        </div>
    );
};

export default Checkbox;
