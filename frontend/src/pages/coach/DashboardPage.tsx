import React from 'react';
import ComingSoon from '../../components/shared/ComingSoon';
import { LayoutDashboard } from 'lucide-react';

const DashboardPage: React.FC = () => {
    return (
        <ComingSoon
            icon={LayoutDashboard}
            title="Tableau de bord coach"
            description="Cette fonctionnalité sera disponible prochainement."
        />
    );
};

export default DashboardPage;
