import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import type { RoleType } from '../../types';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: RoleType[];
  fallbackPath?: string;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  allowedRoles,
  fallbackPath = '/accounts',
}) => {
  const { user } = useAuth();
  const { organisationId } = useParams<{ organisationId: string }>();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      if (!user?.id || !organisationId) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }
      try {
        const data = await api.get<{ myRole: { type: RoleType } }>(
          `/organisations/${organisationId}`,
          undefined,
          { useCache: true, cacheTTL: 60000 },
        );
        setIsAuthorized(allowedRoles.includes(data.myRole.type));
      } catch {
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    };
    check();
  }, [organisationId, user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Vérification des permissions…</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-card border border-border rounded-2xl shadow-sm p-8 max-w-md w-full text-center mx-4">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-7 h-7 text-destructive shrink-0" />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground mb-2">Accès refusé</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
          <button
            onClick={() => (window.location.href = fallbackPath)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-bold px-5 py-2.5 rounded-full active:scale-95 transition-transform"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleBasedRoute;
