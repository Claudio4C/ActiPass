import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCog, Landmark, Users } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import { useAuth } from '../../contexts/AuthContext';

const ActionCard: React.FC<{
    icon: React.ElementType;
    title: string;
    description: string;
    onClick?: () => void;
}> = ({ icon: Icon, title, description, onClick }) => (
    <div
        onClick={onClick}
        className="flex gap-5 p-6 rounded-2xl bg-white shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
    >
        <div className="w-12 h-12 rounded-2xl bg-[#0F2147]/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-7 h-7 text-[#0F2147]" />
        </div>
        <div className="flex-1">
            <div className="text-2xl font-bold text-[#2A2A2A] mb-2">{title}</div>
            <p className="text-gray-700 text-base leading-relaxed">{description}</p>
        </div>
    </div>
);

const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const userEmail = user?.email || 'admin@ikivio.com';

    return (
        <AdminLayout active="home">
            <div className="max-w-4xl">
                <h2 className="text-5xl font-extrabold tracking-tight text-[#2A2A2A] mb-4">
                    Welcome to your dashboard, Ikivo
                </h2>
                <div className="text-2xl text-[#2A2A2A] font-semibold mb-10">{userEmail}</div>

                <div className="space-y-6">
                    <ActionCard
                        icon={UserCog}
                        title="Ajouter des administrateurs"
                        description="Créez et gérez les comptes administrateurs de votre organisation. Attribuez des rôles et des permissions pour une gestion efficace."
                        onClick={() => navigate('/admin/members')}
                    />
                    <ActionCard
                        icon={Landmark}
                        title="Ajouter des associations"
                        description="Créez de nouvelles associations ou gérez celles existantes. Configurez les paramètres et les membres de chaque organisation."
                        onClick={() => navigate('/admin/associations')}
                    />
                    <ActionCard
                        icon={Users}
                        title="Ajouter des membres"
                        description="Ajoutez et gérez les membres de vos associations. Inscrivez de nouveaux adhérents et suivez leurs informations."
                        onClick={() => navigate('/admin/members')}
                    />
                </div>

                {/* Support Button */}
                <div className="fixed bottom-10 right-10">
                    <div className="bg-[#0F2147] text-white rounded-full px-8 h-16 flex items-center shadow-xl hover:shadow-2xl transition-shadow cursor-pointer">
                        <span className="font-semibold text-lg">Support</span>
                        <span className="ml-3 text-xl">^</span>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default DashboardPage;

