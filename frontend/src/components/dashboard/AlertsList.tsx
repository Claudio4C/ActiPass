import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Info, XCircle, ChevronRight } from 'lucide-react';

interface Alert {
    type: 'critical' | 'warning' | 'info';
    message: string;
    link?: string;
}

interface AlertsListProps {
    alerts: Alert[];
}

const alertConfig = {
    critical: {
        icon: XCircle,
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        textColor: 'text-red-800 dark:text-red-300',
        iconColor: 'text-red-600 dark:text-red-400'
    },
    warning: {
        icon: AlertTriangle,
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        textColor: 'text-yellow-800 dark:text-yellow-300',
        iconColor: 'text-yellow-600 dark:text-yellow-400'
    },
    info: {
        icon: Info,
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        textColor: 'text-blue-800 dark:text-blue-300',
        iconColor: 'text-blue-600 dark:text-blue-400'
    }
};

const AlertsList: React.FC<AlertsListProps> = ({ alerts }) => {
    if (alerts.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3">
            {alerts.map((alert, index) => {
                const config = alertConfig[alert.type];
                const Icon = config.icon;

                const content = (
                    <div
                        className={`
                            flex items-start gap-3 p-4 rounded-lg border
                            ${config.bgColor} ${config.borderColor}
                            transition-colors
                            ${alert.link ? 'hover:shadow-md cursor-pointer' : ''}
                        `}
                    >
                        <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${config.textColor}`}>
                                {alert.message}
                            </p>
                        </div>
                        {alert.link && (
                            <ChevronRight className={`h-5 w-5 flex-shrink-0 ${config.iconColor}`} />
                        )}
                    </div>
                );

                if (alert.link) {
                    return (
                        <Link key={index} to={alert.link}>
                            {content}
                        </Link>
                    );
                }

                return <div key={index}>{content}</div>;
            })}
        </div>
    );
};

export default AlertsList;

