import React from 'react';
import { Link } from 'react-router-dom';
import type { LucideProps } from 'lucide-react';

interface QuickAction {
    label: string;
    icon: React.ComponentType<LucideProps>;
    link: string;
    color?: string;
}

interface QuickActionsProps {
    actions: QuickAction[];
}

const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {actions.map((action, index) => {
                const Icon = action.icon;
                const getColorClasses = () => {
                    switch (action.color) {
                        case 'blue':
                            return {
                                bg: 'bg-blue-50 dark:bg-blue-900/20',
                                text: 'text-blue-600 dark:text-blue-400',
                                hover: 'hover:border-blue-300 dark:hover:border-blue-600'
                            };
                        case 'green':
                            return {
                                bg: 'bg-green-50 dark:bg-green-900/20',
                                text: 'text-green-600 dark:text-green-400',
                                hover: 'hover:border-green-300 dark:hover:border-green-600'
                            };
                        default:
                            return {
                                bg: 'bg-indigo-50 dark:bg-indigo-900/20',
                                text: 'text-indigo-600 dark:text-indigo-400',
                                hover: 'hover:border-indigo-300 dark:hover:border-indigo-600'
                            };
                    }
                };
                const colors = getColorClasses();

                return (
                    <Link
                        key={index}
                        to={action.link}
                        className={`flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md ${colors.hover} transition-all group`}
                    >
                        <div className={`p-2 rounded-lg ${colors.bg}`}>
                            <Icon className={`h-5 w-5 ${colors.text}`} />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                            {action.label}
                        </span>
                    </Link>
                );
            })}
        </div>
    );
};

export default QuickActions;

