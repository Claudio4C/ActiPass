import React from 'react';
import { Link } from 'react-router-dom';
import { Construction } from 'lucide-react';

interface ComingSoonProps {
    feature?: string;
    phase?: string;
    backTo?: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({
    feature = 'Cette fonctionnalité',
    phase,
    backTo = '/accounts',
}) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-10 max-w-md w-full text-center border border-gray-200 dark:border-slate-800">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-5">
                    <Construction className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">En construction</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                    {feature} est en cours de développement.
                </p>
                {phase && (
                    <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mb-6">
                        Prévu en {phase}
                    </p>
                )}
                <Link
                    to={backTo}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium mt-4"
                >
                    Retour
                </Link>
            </div>
        </div>
    );
};

export default ComingSoon;
