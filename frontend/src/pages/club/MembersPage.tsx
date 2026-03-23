import React from 'react';
import Layout from '../../components/layout/Layout';
import ComingSoon from '../../components/shared/ComingSoon';
import { Users } from 'lucide-react';

const ClubMembersPage: React.FC = () => {
    return (
        <Layout title="Espace membres" subtitle="Accédez aux informations de votre club" mode="club">
            <ComingSoon
                icon={Users}
                title="Espace membres"
                description="Cette fonctionnalité sera disponible prochainement."
            />
        </Layout>
    );
};

export default ClubMembersPage;
