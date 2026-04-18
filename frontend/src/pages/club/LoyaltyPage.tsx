import React from 'react';
import ComingSoon from '../../components/shared/ComingSoon';
import { Star } from 'lucide-react';

const LoyaltyPage: React.FC = () => {
    return (
        <ComingSoon
            icon={Star}
            title="Programme de fidélité"
            description="Cette fonctionnalité sera disponible prochainement."
        />
    );
};

export default LoyaltyPage;
