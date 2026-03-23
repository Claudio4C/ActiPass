import React from 'react';
import Layout from '../../components/layout/Layout';
import ComingSoon from '../../components/shared/ComingSoon';
import { Building2 } from 'lucide-react';

const DashboardPage: React.FC = () => {
    return (
        <Layout title="Tableau de bord" subtitle="Coordonnez les équipements et services municipaux" mode="municipalite">
            <ComingSoon
                icon={Building2}
                title="Espace municipalité"
                description="Cette fonctionnalité sera disponible prochainement."
            />
        </Layout>
    );
};

export default DashboardPage;
