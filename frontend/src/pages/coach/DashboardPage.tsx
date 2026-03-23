import React from 'react';
import Layout from '../../components/layout/Layout';
import ComingSoon from '../../components/shared/ComingSoon';
import { LayoutDashboard } from 'lucide-react';

const DashboardPage: React.FC = () => {
    return (
        <Layout title="Tableau de bord coach" subtitle="Gérez vos créneaux et votre activité" mode="club">
            <ComingSoon
                icon={LayoutDashboard}
                title="Tableau de bord coach"
                description="Cette fonctionnalité sera disponible prochainement."
            />
        </Layout>
    );
};

export default DashboardPage;
