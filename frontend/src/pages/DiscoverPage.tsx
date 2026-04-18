import React from 'react';
import ComingSoon from '../components/shared/ComingSoon';
import { Search } from 'lucide-react';

const DiscoverPage: React.FC = () => {
    return (
        <ComingSoon
            icon={Search}
            title="Recherche de clubs"
            description="La recherche de clubs et associations à proximité sera disponible prochainement."
        />
    );
};

export default DiscoverPage;
