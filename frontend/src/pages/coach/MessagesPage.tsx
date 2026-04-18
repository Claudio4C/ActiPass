import React from 'react';
import ComingSoon from '../../components/shared/ComingSoon';
import { MessageSquare } from 'lucide-react';

const MessagesPage: React.FC = () => {
    return (
        <ComingSoon
            icon={MessageSquare}
            title="Messages"
            description="Cette fonctionnalité sera disponible prochainement."
        />
    );
};

export default MessagesPage;
