import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string | React.ReactNode;
    error?: string;
    mode?: 'club' | 'municipalite';
}

const Checkbox: React.FC<CheckboxProps> = ({
    label,
    error,
    mode = 'club',
    className = '',
    ...props
}) => {
    const modeClasses = {
        club: 'text-blue-600 focus:ring-blue-500',
        municipalite: 'text-purple-600 focus:ring-purple-500'
    };

    const checkboxClasses = `
    w-4 h-4 rounded border-2 border-gray-300 focus:ring-2 focus:ring-offset-2
    ${modeClasses[mode]}
    ${className}
  `.trim();

    return (
        <div className="flex items-start">
            <div className="flex items-center h-5">
                <input
                    type="checkbox"
                    className={checkboxClasses}
                    {...props}
                />
            </div>
            {label && (
                <div className="ml-3 text-sm">
                    <label className="text-gray-900 font-medium">
                        {label}
                    </label>
                    {error && (
                        <p className="text-red-800 mt-1 font-medium">{error}</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Checkbox;
