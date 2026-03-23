import React from 'react';
import Layout from '../../components/layout/Layout';
import ComingSoon from '../../components/shared/ComingSoon';
import { MessageSquare } from 'lucide-react';

const MessagesPage: React.FC = () => {
    return (
        <Layout title="Messages & sollicitations" subtitle="Centralisez vos échanges avec les clubs et vos élèves" mode="club">
            <ComingSoon
                icon={MessageSquare}
                title="Messages"
                description="Cette fonctionnalité sera disponible prochainement."
            />
        </Layout>
    );
};

export default MessagesPage;
