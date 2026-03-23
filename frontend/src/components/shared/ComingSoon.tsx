import React from 'react';
import { Construction } from 'lucide-react';

interface ComingSoonProps {
    title?: string;
    description?: string;
    icon?: React.ComponentType<{ className?: string }>;
}

const ComingSoon: React.FC<ComingSoonProps> = ({
    title = 'En cours de construction',
    description = 'Cette fonctionnalité sera disponible prochainement.',
    icon: Icon = Construction,
}) => {
    return (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5">
                <Icon className="h-8 w-8 text-slate-400 dark:text-slate-500" />
            </div>
            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">{title}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">{description}</p>
        </div>
    );
};

export default ComingSoon;
