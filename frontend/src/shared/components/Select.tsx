import React from 'react';
import { type AppMode } from '../../types';

interface SelectProps {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    placeholder?: string;
    error?: string;
    mode?: AppMode;
    disabled?: boolean;
    className?: string;
    options: { value: string; label: string }[];
    required?: boolean;
}

const Select: React.FC<SelectProps> = ({
    label,
    name,
    value,
    onChange,
    onFocus,
    onBlur,
    placeholder,
    error,
    mode = 'club',
    disabled = false,
    className = '',
    options,
    required = false,
}) => {
    const baseClasses = 'w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200'

    const modeClasses = mode === 'club'
        ? 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 bg-white'
        : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500 bg-white'

    const errorClasses = error
        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
        : ''

    const disabledClasses = disabled
        ? 'bg-gray-100 cursor-not-allowed opacity-60'
        : ''

    return (
        <div className={`space-y-2 ${className}`}>
            <label className="block text-sm font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>

            <select
                name={name}
                value={value}
                onChange={onChange}
                onFocus={onFocus}
                onBlur={onBlur}
                disabled={disabled}
                className={`${baseClasses} ${modeClasses} ${errorClasses} ${disabledClasses}`}
            >
                {placeholder && (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                )}
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>

            {error && (
                <p className="text-sm text-red-600 mt-1">{error}</p>
            )}
        </div>
    );
};

export default Select;
