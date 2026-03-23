import React from 'react';
import Layout from '../../components/layout/Layout';
import ComingSoon from '../../components/shared/ComingSoon';
import { Star } from 'lucide-react';

const LoyaltyPage: React.FC = () => {
    return (
        <Layout title="Programme de fidélité" subtitle="Collecte tes points et débloque des récompenses exclusives." mode="club">
            <ComingSoon
                icon={Star}
                title="Programme de fidélité"
                description="Cette fonctionnalité sera disponible prochainement."
            />
        </Layout>
    );
};

export default LoyaltyPage;
