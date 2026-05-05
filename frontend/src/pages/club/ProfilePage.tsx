import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Camera, Mail, Phone, Shield, MapPin, Activity, Calendar, Lock } from 'lucide-react';
import { cn } from '../../lib/utils';

// ─── shared input class ──────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-colors';

// ─── sub-components ──────────────────────────────────────────────────────────

const ToggleSwitch: React.FC<{ enabled: boolean; onToggle: () => void }> = ({ enabled, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-pressed={enabled}
    className={cn(
      'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
      enabled ? 'bg-primary' : 'bg-muted',
    )}
  >
    <span className={cn(
      'inline-block h-4 w-4 rounded-full bg-card shadow transition-transform mx-1',
      enabled ? 'translate-x-5' : 'translate-x-0',
    )} />
  </button>
);

const ToggleRow: React.FC<{
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}> = ({ label, description, enabled, onToggle }) => (
  <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card px-4 py-3">
    <div>
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </div>
    <ToggleSwitch enabled={enabled} onToggle={onToggle} />
  </div>
);

const HeroStat: React.FC<{ title: string; value: string; descriptor?: string }> = ({ title, value, descriptor }) => (
  <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-3">
    <p className="text-[10px] uppercase tracking-wider text-primary-foreground/70 font-bold">{title}</p>
    <p className="mt-1 font-display text-2xl font-bold text-primary-foreground">{value}</p>
    {descriptor && <p className="text-xs text-primary-foreground/70 mt-0.5">{descriptor}</p>}
  </div>
);

const SectionCard: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({
  title, description, children,
}) => (
  <section className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-5">
    <div>
      <h2 className="font-display text-lg font-bold text-foreground">{title}</h2>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
    </div>
    {children}
  </section>
);

const InfoRow: React.FC<{ icon: React.ReactNode; children: React.ReactNode; className?: string }> = ({
  icon, children, className,
}) => (
  <div className={cn('flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground', className)}>
    {icon}
    {children}
  </div>
);

// ─── main ────────────────────────────────────────────────────────────────────

const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  const [newsletter,    setNewsletter]    = React.useState(true);
  const [reminders,     setReminders]     = React.useState(true);
  const [communityNews, setCommunityNews] = React.useState(false);
  const [twoFactor,     setTwoFactor]     = React.useState(false);

  const initials = React.useMemo(() => {
    const s = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.trim();
    return (s || user?.email?.[0] || 'M').toUpperCase();
  }, [user?.firstName, user?.lastName, user?.email]);

  return (
    <div className="space-y-6">

      {/* ── Hero banner ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground shadow-xl shadow-primary/30">
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-primary-foreground/10 rounded-full blur-2xl" />
        <div className="absolute -left-8 -bottom-8 w-40 h-40 bg-primary-foreground/5 rounded-full blur-2xl" />

        <div className="relative px-6 sm:px-10 py-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          {/* Identity */}
          <div className="flex items-start gap-5">
            <label className="relative cursor-pointer shrink-0">
              <input type="file" accept="image/*" className="sr-only" />
              <div className="h-20 w-20 rounded-2xl bg-primary-foreground/20 backdrop-blur flex items-center justify-center font-display text-3xl font-bold border border-primary-foreground/30">
                {initials}
              </div>
              <span className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-card text-primary flex items-center justify-center shadow-md border border-border">
                <Camera className="h-4 w-4 shrink-0" />
              </span>
            </label>
            <div className="space-y-2 pt-1">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-primary-foreground/20 px-2.5 py-1 rounded-full">
                Profil membre
              </span>
              <h1 className="font-display text-3xl font-bold leading-tight">
                {user?.firstName} {user?.lastName}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-primary-foreground/80">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 shrink-0" />{user?.email}
                </span>
                {user?.phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 shrink-0" />{user.phone}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 shrink-0" />Membre actif
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <HeroStat title="Présences"        value="42" />
            <HeroStat title="Points fidélité"  value="260" />
            <HeroStat title="Prochaine session" value="Mer 19h30" />
            <HeroStat title="Rang"             value="Warrior" />
          </div>
        </div>
      </section>

      {/* ── Informations personnelles ───────────────────────────────────────── */}
      <form onSubmit={e => { e.preventDefault(); }}>
        <SectionCard title="Informations personnelles">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Prénom</span>
              <input defaultValue={user?.firstName ?? ''} placeholder="Votre prénom" className={inputCls} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Nom</span>
              <input defaultValue={user?.lastName ?? ''} placeholder="Votre nom" className={inputCls} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Date de naissance</span>
              <input type="date" className={inputCls} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Genre</span>
              <select className={inputCls}>
                <option value="female">Femme</option>
                <option value="male">Homme</option>
                <option value="non-binary">Non-binaire</option>
                <option value="prefer_not_to_say">Je préfère ne pas préciser</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border">
            <InfoRow icon={<MapPin className="h-4 w-4 text-primary shrink-0" />}>
              Organisation principale
            </InfoRow>
            <InfoRow icon={<Activity className="h-4 w-4 text-accent shrink-0" />}>
              Discipline favorite
            </InfoRow>
            <InfoRow icon={<Shield className="h-4 w-4 text-primary shrink-0" />}>
              Membre
            </InfoRow>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-bold px-5 py-2.5 rounded-full active:scale-95 transition-transform"
            >
              Enregistrer les modifications
            </button>
          </div>
        </SectionCard>
      </form>

      {/* ── Coordonnées ─────────────────────────────────────────────────────── */}
      <SectionCard title="Coordonnées & réseaux">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow icon={<Mail className="h-4 w-4 text-primary shrink-0" />}>
            {user?.email ?? ''}
          </InfoRow>
          <InfoRow icon={<Phone className="h-4 w-4 text-accent shrink-0" />}>
            {user?.phone ?? 'Ajouter un numéro'}
          </InfoRow>
          <InfoRow icon={<MapPin className="h-4 w-4 text-destructive shrink-0" />} className="sm:col-span-2">
            18 Rue du Courreau, 69004 Lyon
          </InfoRow>
          <InfoRow icon={<Calendar className="h-4 w-4 text-muted-foreground shrink-0" />} className="sm:col-span-2">
            Licence fédérale valide jusqu'au 30/09/2025
          </InfoRow>
        </div>
      </SectionCard>

      {/* ── Notifications ───────────────────────────────────────────────────── */}
      <SectionCard title="Notifications & préférences">
        <div className="space-y-3">
          <ToggleRow
            label="Newsletter hebdomadaire"
            description="Récapitulatif des horaires, stages et résultats de la semaine."
            enabled={newsletter}
            onToggle={() => setNewsletter(p => !p)}
          />
          <ToggleRow
            label="Rappels d'entraînement"
            description="Notification la veille de vos créneaux favoris."
            enabled={reminders}
            onToggle={() => setReminders(p => !p)}
          />
          <ToggleRow
            label="Actualités de la communauté"
            description="Annonces des nouveaux membres, challenges et évènements."
            enabled={communityNews}
            onToggle={() => setCommunityNews(p => !p)}
          />
        </div>
      </SectionCard>

      {/* ── Sécurité ────────────────────────────────────────────────────────── */}
      <SectionCard title="Sécurité du compte">
        <form onSubmit={e => { e.preventDefault(); }} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Ancien mot de passe</span>
              <input type="password" placeholder="••••••••" className={inputCls} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Nouveau mot de passe</span>
              <input type="password" placeholder="••••••••" className={inputCls} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Confirmation</span>
              <input type="password" placeholder="••••••••" className={inputCls} />
            </label>
          </div>

          {/* 2FA toggle */}
          <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Lock className="h-4 w-4 text-primary shrink-0" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Authentification à deux facteurs</p>
                <p className="text-xs text-muted-foreground">Renforcez la sécurité lors des connexions sensibles.</p>
              </div>
            </div>
            <ToggleSwitch enabled={twoFactor} onToggle={() => setTwoFactor(p => !p)} />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 border border-primary text-primary bg-card text-sm font-bold px-5 py-2.5 rounded-full active:scale-95 transition-transform hover:bg-primary/5"
            >
              Mettre à jour la sécurité
            </button>
          </div>
        </form>
      </SectionCard>

    </div>
  );
};

export default ProfilePage;
