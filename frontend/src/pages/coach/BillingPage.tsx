import React from 'react';
import Layout from '../../components/layout/Layout';
import ComingSoon from '../../components/shared/ComingSoon';
import { Euro } from 'lucide-react';

const BillingPage: React.FC = () => {
    return (
        <Layout title="Facturation" subtitle="Gérez vos revenus et factures" mode="club">
            <ComingSoon
                icon={Euro}
                title="Facturation"
                description="Cette fonctionnalité sera disponible prochainement."
            />
        </Layout>
    );
};

export default BillingPage;
