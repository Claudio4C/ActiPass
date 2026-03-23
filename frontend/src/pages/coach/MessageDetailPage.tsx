import React from 'react';
import Layout from '../../components/layout/Layout';
import ComingSoon from '../../components/shared/ComingSoon';
import { MessageSquare } from 'lucide-react';

const MessageDetailPage: React.FC = () => {
    return (
        <Layout title="Conversation" subtitle="" mode="club">
            <ComingSoon
                icon={MessageSquare}
                title="Messagerie"
                description="Cette fonctionnalité sera disponible prochainement."
            />
        </Layout>
    );
};

export default MessageDetailPage;
