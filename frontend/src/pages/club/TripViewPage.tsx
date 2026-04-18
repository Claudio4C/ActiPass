import React from 'react';
import ComingSoon from '../../components/shared/ComingSoon';
import { Plane } from 'lucide-react';

const TripViewPage: React.FC = () => {
    return (
        <ComingSoon
            icon={Plane}
            title="Voyage organisé"
            description="Cette fonctionnalité sera disponible prochainement."
        />
    );
};

export default TripViewPage;
