import React from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, CalendarDays, Trophy, QrCode } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// ─── membre card (dark gradient) ────────────────────────────────────────────

const MemberCard: React.FC<{ orgName: string; userName: string }> = ({ orgName, userName }) => (
  <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 rounded-3xl p-6 text-white shadow-xl">
    <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
    <div className="relative">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/50">CARTE DE MEMBRE</p>
          <p className="font-display text-lg font-bold text-white mt-1">{orgName}</p>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
          <QrCode className="w-8 h-8 text-white/70 shrink-0" />
        </div>
      </div>

      <div className="mb-5">
        <p className="text-[10px] text-white/50 uppercase tracking-wider">Titulaire</p>
        <p className="font-display text-2xl font-bold text-white mt-0.5">{userName}</p>
      </div>

      <div className="flex items-center gap-8">
        <div>
          <p className="text-[9px] text-white/50 uppercase tracking-wider">N° adhérent</p>
          <p className="text-sm font-mono font-semibold text-white/90 mt-0.5">M-2024-0481</p>
        </div>
        <div>
          <p className="text-[9px] text-white/50 uppercase tracking-wider">Saison</p>
          <p className="text-sm font-semibold text-white/90 mt-0.5">2024 – 2025</p>
        </div>
      </div>
    </div>
  </div>
);

// ─── stat card ───────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  icon: React.ReactNode;
  value: string;
  label: string;
}> = ({ icon, value, label }) => (
  <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-2">
    <div className="w-8 h-8">{icon}</div>
    <p className="font-display text-xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

// ─── main ────────────────────────────────────────────────────────────────────

const ClubHomePage: React.FC = () => {
  const { orgId } = useParams<{ orgId: string }>();
  const { user } = useAuth();

  const orgName = React.useMemo(() => {
    try {
      const stored = localStorage.getItem('selectedOrganisation');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.id === orgId) return parsed.name as string;
      }
    } catch { /* noop */ }
    return 'Mon Club';
  }, [orgId]);

  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Membre';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Espace membre</h2>
        <p className="text-sm text-muted-foreground mt-1">Votre carte de membre numérique</p>
      </div>

      {/* Member card */}
      <MemberCard orgName={orgName} userName={fullName} />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<CheckCircle2 className="w-6 h-6 text-accent" />}
          value="Actif"
          label="Statut"
        />
        <StatCard
          icon={<CalendarDays className="w-6 h-6 text-primary" />}
          value="30 juin"
          label="Renouvellement"
        />
        <StatCard
          icon={<Trophy className="w-6 h-6 text-destructive" />}
          value="24 / 28"
          label="Présences"
        />
      </div>
    </div>
  );
};

export default ClubHomePage;
