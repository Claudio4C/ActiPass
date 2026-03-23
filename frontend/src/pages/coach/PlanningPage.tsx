import React from 'react';
import Layout from '../../components/layout/Layout';
import ComingSoon from '../../components/shared/ComingSoon';
import { Calendar } from 'lucide-react';

const PlanningPage: React.FC = () => {
    return (
        <Layout title="Planning" subtitle="Gérez vos créneaux et disponibilités" mode="club">
            <ComingSoon
                icon={Calendar}
                title="Planning coach"
                description="Cette fonctionnalité sera disponible prochainement."
            />
        </Layout>
    );
};

export default PlanningPage;
