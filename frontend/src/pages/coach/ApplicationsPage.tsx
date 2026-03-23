import React from 'react';
import Layout from '../../components/layout/Layout';
import ComingSoon from '../../components/shared/ComingSoon';
import { ClipboardList } from 'lucide-react';

const ApplicationsPage: React.FC = () => {
    return (
        <Layout title="Candidatures" subtitle="Répondez aux sollicitations des clubs" mode="club">
            <ComingSoon
                icon={ClipboardList}
                title="Candidatures"
                description="Cette fonctionnalité sera disponible prochainement."
            />
        </Layout>
    );
};

export default ApplicationsPage;
