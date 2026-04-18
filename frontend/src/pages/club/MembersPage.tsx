import React from 'react';
import ComingSoon from '../../components/shared/ComingSoon';
import { Users } from 'lucide-react';

const ClubMembersPage: React.FC = () => {
    return (
        <ComingSoon
            icon={Users}
            title="Espace membres"
            description="Cette fonctionnalité sera disponible prochainement."
        />
    );
};

export default ClubMembersPage;
