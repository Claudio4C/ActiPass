import React from 'react';
import ComingSoon from '../../components/shared/ComingSoon';
import { Calendar } from 'lucide-react';

const PlanningPage: React.FC = () => {
    return (
        <ComingSoon
            icon={Calendar}
            title="Planning coach"
            description="Cette fonctionnalité sera disponible prochainement."
        />
    );
};

export default PlanningPage;
