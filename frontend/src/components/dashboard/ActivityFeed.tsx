import React from 'react';
import { Calendar, User, Euro, FileText, Clock } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

interface Activity {
    type: 'booking' | 'payment' | 'document' | 'member' | 'event';
    user: string;
    action: string;
    time: string;
}

interface ActivityFeedProps {
    activities: Activity[];
    maxItems?: number;
}

const activityIcons: Record<Activity['type'], React.ComponentType<LucideProps>> = {
    booking: Calendar,
    payment: Euro,
    document: FileText,
    member: User,
    event: Calendar
};

const activityColors: Record<Activity['type'], string> = {
    booking: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    payment: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    document: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    member: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
    event: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
};

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, maxItems = 10 }) => {
    const displayedActivities = activities.slice(0, maxItems);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activité récente</h3>
            <div className="space-y-4">
                {displayedActivities.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <p>Aucune activité récente</p>
                    </div>
                ) : (
                    displayedActivities.map((activity, index) => {
                        const Icon = activityIcons[activity.type];
                        const colorClass = activityColors[activity.type];

                        return (
                            <div key={index} className="flex items-start gap-3">
                                <div className={`flex-shrink-0 p-2 rounded-lg ${colorClass}`}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900 dark:text-white">
                                        <span className="font-medium">{activity.user}</span> {activity.action}
                                    </p>
                                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        <Clock className="h-3 w-3" />
                                        {activity.time}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ActivityFeed;

