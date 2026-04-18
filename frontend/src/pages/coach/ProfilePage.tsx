import React from 'react';
import ComingSoon from '../../components/shared/ComingSoon';
import { User } from 'lucide-react';

const ProfilePage: React.FC = () => {
    return (
        <ComingSoon
            icon={User}
            title="Profil coach"
            description="Cette fonctionnalité sera disponible prochainement."
        />
    );
};

export default ProfilePage;
