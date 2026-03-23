import React from 'react';
import Layout from '../../components/layout/Layout';
import ComingSoon from '../../components/shared/ComingSoon';
import { User } from 'lucide-react';

const ProfilePage: React.FC = () => {
    return (
        <Layout title="Profil coach" subtitle="Gérez votre profil et vos informations" mode="club">
            <ComingSoon
                icon={User}
                title="Profil coach"
                description="Cette fonctionnalité sera disponible prochainement."
            />
        </Layout>
    );
};

export default ProfilePage;
