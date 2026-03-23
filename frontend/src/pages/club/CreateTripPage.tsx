import React from 'react';
import Layout from '../../components/layout/Layout';
import ComingSoon from '../../components/shared/ComingSoon';
import { Plane } from 'lucide-react';

const CreateTripPage: React.FC = () => {
    return (
        <Layout title="Créer un voyage" subtitle="Organisez un voyage pour votre événement." mode="club">
            <ComingSoon
                icon={Plane}
                title="Créer un voyage"
                description="Cette fonctionnalité sera disponible prochainement."
            />
        </Layout>
    );
};

export default CreateTripPage;
