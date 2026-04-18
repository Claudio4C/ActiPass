import React from 'react';
import ComingSoon from '../../components/shared/ComingSoon';
import { Plane } from 'lucide-react';

const CreateTripPage: React.FC = () => {
    return (
        <ComingSoon
            icon={Plane}
            title="Créer un voyage"
            description="Cette fonctionnalité sera disponible prochainement."
        />
    );
};

export default CreateTripPage;
