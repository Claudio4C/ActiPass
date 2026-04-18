import React from 'react';
import ComingSoon from '../../components/shared/ComingSoon';
import { MessageSquare } from 'lucide-react';

const MessageDetailPage: React.FC = () => {
    return (
        <ComingSoon
            icon={MessageSquare}
            title="Messagerie"
            description="Cette fonctionnalité sera disponible prochainement."
        />
    );
};

export default MessageDetailPage;
