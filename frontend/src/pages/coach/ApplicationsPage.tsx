import React from 'react';
import ComingSoon from '../../components/shared/ComingSoon';
import { ClipboardList } from 'lucide-react';

const ApplicationsPage: React.FC = () => {
    return (
        <ComingSoon
            icon={ClipboardList}
            title="Candidatures"
            description="Cette fonctionnalité sera disponible prochainement."
        />
    );
};

export default ApplicationsPage;
