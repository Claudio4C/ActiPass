import React, { useEffect, useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import DashboardHeader from '../components/layout/DashboardHeader';
import { api } from '../lib/api';

interface OrgStatus {
  id: string; name: string;
  status: 'active' | 'suspended' | 'pending_validation';
  logo_url?: string | null;
}

const PendingBanner: React.FC = () => (
  <div className="flex items-center gap-3 bg-amber-500/10 border-b border-amber-500/20 px-6 py-3">
    <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
      <Clock className="w-4 h-4 text-amber-700 shrink-0" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-amber-800">Votre club est en cours de validation</p>
      <p className="text-xs text-amber-700 mt-0.5">
        Un administrateur Ikivio va valider votre club sous 24-48h. Toutes les fonctionnalités seront disponibles après validation.
      </p>
    </div>
    <span className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full bg-amber-500/15 text-amber-800">
      En attente
    </span>
  </div>
)

const SuspendedBanner: React.FC = () => (
  <div className="flex items-center gap-3 bg-destructive/5 border-b border-destructive/20 px-6 py-3">
    <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
    <p className="text-sm font-semibold text-destructive flex-1">
      Ce club a été suspendu. Contactez le support pour plus d'informations.
    </p>
  </div>
)

const AdminDashboardLayout: React.FC = () => {
  const { organisationId } = useParams<{ organisationId: string }>()
  const [orgStatus, setOrgStatus] = useState<OrgStatus['status'] | null>(null)

  useEffect(() => {
    if (!organisationId) { return }
    api.get<{ organisation: OrgStatus }>(`/organisations/${organisationId}`, undefined, { useCache: true, cacheTTL: 60000 })
      .then((data) => setOrgStatus(data.organisation.status))
      .catch(() => {})
  }, [organisationId])

  if (!organisationId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <h2 className="font-display text-2xl font-bold text-foreground">Organisation introuvable</h2>
          <p className="text-muted-foreground">Veuillez sélectionner une organisation.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background transition-colors">
      <div className="flex h-screen overflow-hidden">
        <DashboardSidebar organisationId={organisationId} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader organisationId={organisationId} />

          {/* Bannière statut */}
          {orgStatus === 'pending_validation' && <PendingBanner />}
          {orgStatus === 'suspended' && <SuspendedBanner />}

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardLayout
