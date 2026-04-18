import React from 'react';
import ComingSoon from '../../components/shared/ComingSoon';
import { Building2 } from 'lucide-react';

const DashboardPage: React.FC = () => {
    return (
        <ComingSoon
            icon={Building2}
            title="Espace municipalité"
            description="Cette fonctionnalité sera disponible prochainement."
        />
    );
};

export default DashboardPage;
