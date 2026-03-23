import React from 'react';
import Layout from '../components/layout/Layout';
import ComingSoon from '../components/shared/ComingSoon';
import { Search } from 'lucide-react';

const DiscoverPage: React.FC = () => {
    return (
        <Layout
            title="Découvrir"
            subtitle="Trouvez des clubs et associations près de chez vous"
            mode="club"
        >
            <ComingSoon
                icon={Search}
                title="Recherche de clubs"
                description="La recherche de clubs et associations à proximité sera disponible prochainement."
            />
        </Layout>
    );
};

export default DiscoverPage;
