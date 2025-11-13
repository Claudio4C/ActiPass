import React from 'react';
import AdminLayout from '../../components/layout/AdminLayout';

const MunicipalitiesPage: React.FC = () => {
    return (
        <AdminLayout active="mairies">
            <div className="space-y-6">
                <h1 className="text-4xl font-bold text-[#2A2A2A]">Mairies</h1>
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
                    <div className="text-2xl font-bold text-gray-700 mb-2">Page en construction</div>
                    <div className="text-gray-500">La gestion des municipalités sera disponible prochainement.</div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default MunicipalitiesPage;

