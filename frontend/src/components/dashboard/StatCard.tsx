import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, ArrowDown } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    variation?: number;
    trend?: 'up' | 'down';
    icon: React.ComponentType<LucideProps>;
    linkTo?: string;
    period?: string;
    badge?: number;
}

const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    variation,
    trend,
    icon: Icon,
    linkTo,
    period,
    badge
}) => {
    const content = (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                        {variation !== undefined && (
                            <div className={`flex items-center gap-1 text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {trend === 'up' ? (
                                    <ArrowUp className="h-4 w-4" />
                                ) : (
                                    <ArrowDown className="h-4 w-4" />
                                )}
                                {Math.abs(variation)}%
                            </div>
                        )}
                    </div>
                    {period && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{period}</p>
                    )}
                </div>
                <div className="relative">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                        <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    {badge !== undefined && badge > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white">
                            {badge}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );

    if (linkTo) {
        return (
            <Link to={linkTo} className="block">
                {content}
            </Link>
        );
    }

    return content;
};

export default StatCard;

