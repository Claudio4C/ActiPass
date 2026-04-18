import React from 'react';
import ComingSoon from '../../components/shared/ComingSoon';
import { Users } from 'lucide-react';

const CoachesDirectoryPage: React.FC = () => {
    return (
        <ComingSoon
            icon={Users}
            title="Annuaire des coachs"
            description="Cette fonctionnalité sera disponible prochainement."
        />
    );
};

export default CoachesDirectoryPage;
