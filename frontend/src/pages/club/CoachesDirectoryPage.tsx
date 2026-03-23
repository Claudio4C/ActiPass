import React from 'react';
import Layout from '../../components/layout/Layout';
import ComingSoon from '../../components/shared/ComingSoon';
import { Users } from 'lucide-react';

const CoachesDirectoryPage: React.FC = () => {
    return (
        <Layout title="Annuaire des coachs" subtitle="Trouvez des coachs indépendants" mode="club">
            <ComingSoon
                icon={Users}
                title="Annuaire des coachs"
                description="Cette fonctionnalité sera disponible prochainement."
            />
        </Layout>
    );
};

export default CoachesDirectoryPage;
