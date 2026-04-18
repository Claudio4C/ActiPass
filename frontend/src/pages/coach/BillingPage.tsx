import React from 'react';
import ComingSoon from '../../components/shared/ComingSoon';
import { Euro } from 'lucide-react';

const BillingPage: React.FC = () => {
    return (
        <ComingSoon
            icon={Euro}
            title="Facturation"
            description="Cette fonctionnalité sera disponible prochainement."
        />
    );
};

export default BillingPage;
