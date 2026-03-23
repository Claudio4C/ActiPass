import React from 'react';
import Layout from '../../components/layout/Layout';
import ComingSoon from '../../components/shared/ComingSoon';
import { Plane } from 'lucide-react';

const TripViewPage: React.FC = () => {
    return (
        <Layout title="Voyage organisé" subtitle="Consultez les détails du voyage pour cet événement." mode="club">
            <ComingSoon
                icon={Plane}
                title="Voyage organisé"
                description="Cette fonctionnalité sera disponible prochainement."
            />
        </Layout>
    );
};

export default TripViewPage;
