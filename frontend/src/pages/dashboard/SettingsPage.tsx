import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Save, Globe, Phone, Mail, MapPin, Image, Eye, Loader2, CheckCircle, Construction } from 'lucide-react'
import { api } from '../../lib/api'
import AvatarUpload from '../../components/AvatarUpload'
import RoleBasedRoute from '../../components/shared/RoleBasedRoute'

// ─── Constantes ───────────────────────────────────────────────────────────────

const ORG_TYPES = [
  { value: 'sport',       label: 'Sport',       emoji: '⚽' },
  { value: 'association', label: 'Association',  emoji: '🤝' },
  { value: 'culture',     label: 'Culture',     emoji: '🎭' },
  { value: 'loisir',      label: 'Loisir',      emoji: '🎨' },
  { value: 'other',       label: 'Autre',       emoji: '🏢' },
] as const

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrgData {
  id: string; name: string; description: string | null; type: string;
  address: string | null; city: string | null; zip_code: string | null;
  phone: string | null; email: string | null; website_url: string | null;
  logo_url: string | null; is_public: boolean; status: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const inputCls = 'w-full h-11 px-3 rounded-xl border border-border bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors'

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
    <div className="flex items-center gap-2.5 pb-3 border-b border-border">
      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
        {icon}
      </div>
      <h2 className="font-display font-bold text-foreground">{title}</h2>
    </div>
    {children}
  </div>
)

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode; hint?: string }> = ({ label, required, children, hint }) => (
  <div>
    <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block mb-1.5">
      {label}{required && ' *'}
    </label>
    {children}
    {hint && <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>}
  </div>
)

const ComingSoon: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="bg-card border border-border rounded-2xl p-4 opacity-60 flex items-center gap-3">
    <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center shrink-0">
      <Construction className="w-4 h-4 text-muted-foreground shrink-0" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <p className="font-display font-bold text-sm text-foreground">{title}</p>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">Bientôt</span>
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </div>
  </div>
)

// ─── Main ─────────────────────────────────────────────────────────────────────

const SettingsPage: React.FC = () => {
  const { organisationId } = useParams<{ organisationId: string }>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const feedbackRef = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState({
    name: '', description: '', type: 'sport',
    address: '', city: '', zip_code: '',
    phone: '', email: '', website: '',
    logo_url: '', is_public: true,
  })

  useEffect(() => {
    if (!organisationId) { return }
    api.get<{ organisation: OrgData }>(`/organisations/${organisationId}`, undefined, { useCache: false })
      .then(({ organisation: o }) => {
        setForm({
          name:        o.name ?? '',
          description: o.description ?? '',
          type:        o.type ?? 'sport',
          address:     o.address ?? '',
          city:        o.city ?? '',
          zip_code:    o.zip_code ?? '',
          phone:       o.phone ?? '',
          email:       o.email ?? '',
          website:     o.website_url ?? '',
          logo_url:    o.logo_url ?? '',
          is_public:   o.is_public ?? true,
        })
      })
      .catch(() => setError('Impossible de charger les paramètres.'))
      .finally(() => setLoading(false))
  }, [organisationId])

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    if (!organisationId || saving) { return }
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const payload: Record<string, unknown> = {
        name:        form.name.trim() || undefined,
        description: form.description.trim() || undefined,
        address:     form.address.trim() || undefined,
        city:        form.city.trim() || undefined,
        zip_code:    form.zip_code.trim() || undefined,
        phone:       form.phone.trim() || undefined,
        email:       form.email.trim() || undefined,
        logo_url:    form.logo_url.trim() || undefined,
        is_public:   form.is_public,
      }
      if (form.website.trim()) { payload.website = form.website.trim() }
      await api.put(`/organisations/${organisationId}`, payload)
      api.clearCache(`/organisations/${organisationId}`)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      setTimeout(() => feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to={`/dashboard/${organisationId}/overview`}
          className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors active:scale-95 shrink-0"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Paramètres du club</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gérez les informations de votre organisation.</p>
        </div>
      </div>

      {/* Feedback */}
      <div ref={feedbackRef}>
        {error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
        {saved && (
          <div className="rounded-2xl border border-[hsl(160,84%,39%)]/30 bg-[hsl(160,84%,39%)]/5 px-4 py-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[hsl(160,84%,39%)] shrink-0" />
            <p className="text-sm font-semibold text-[hsl(160,84%,39%)]">Modifications enregistrées !</p>
          </div>
        )}
      </div>

      {/* Identité */}
      <Section title="Identité" icon={<span className="text-base leading-none">🏷️</span>}>
        <Field label="Nom du club" required>
          <input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Judo Club de Lyon"
            className={inputCls}
          />
        </Field>
        <Field label="Description">
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Présentez votre club en quelques lignes — disciplines, niveaux, ambiance…"
            rows={4}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />
        </Field>
        <Field label="Type d'activité">
          <div className="flex flex-wrap gap-2">
            {ORG_TYPES.map(({ value, label, emoji }) => (
              <button
                key={value}
                type="button"
                onClick={() => set('type', value)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all active:scale-95 ${
                  form.type === value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40'
                }`}
              >
                {emoji} {label}
              </button>
            ))}
          </div>
        </Field>
      </Section>

      {/* Localisation */}
      <Section title="Localisation" icon={<MapPin className="w-4 h-4 shrink-0" />}>
        <Field label="Adresse">
          <input value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="12 rue des Lilas" className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ville">
            <input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Lyon" className={inputCls} />
          </Field>
          <Field label="Code postal">
            <input value={form.zip_code} onChange={(e) => set('zip_code', e.target.value)} placeholder="69001" className={inputCls} />
          </Field>
        </div>
      </Section>

      {/* Contact */}
      <Section title="Contact" icon={<Phone className="w-4 h-4 shrink-0" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Téléphone">
            <input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="04 72 00 00 00" className={inputCls} />
          </Field>
          <Field label="Email public">
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="contact@monclub.fr" className={inputCls} />
          </Field>
        </div>
        <Field label="Site web">
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground shrink-0" />
            <input value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://monclub.fr" className={`${inputCls} pl-9`} />
          </div>
        </Field>
      </Section>

      {/* Apparence */}
      <Section title="Apparence" icon={<Image className="w-4 h-4 shrink-0" />}>
        <div className="flex flex-col items-center gap-1 py-2">
          <AvatarUpload
            currentUrl={form.logo_url || null}
            name={form.name || 'Club'}
            color="hsl(217,91%,60%)"
            shape="square"
            size="xl"
            onUpload={async (url) => {
              set('logo_url', url)
              // Sauvegarde immédiate du logo (sans attendre le bouton "Enregistrer")
              await api.put(`/organisations/${organisationId}`, { logo_url: url })
              api.clearCache(`/organisations/${organisationId}`)
            }}
          />
          <p className="text-[11px] text-muted-foreground text-center mt-1">
            Logo du club · JPG, PNG, WebP · max 5 Mo
          </p>
        </div>
      </Section>

      {/* Visibilité */}
      <Section title="Visibilité" icon={<Eye className="w-4 h-4 shrink-0" />}>
        <div
          onClick={() => set('is_public', !form.is_public)}
          className="flex items-center justify-between cursor-pointer p-3 bg-muted rounded-xl hover:bg-muted/80 transition-colors active:scale-[0.99]"
        >
          <div>
            <p className="text-sm font-semibold text-foreground">Club visible dans l'annuaire</p>
            <p className="text-xs text-muted-foreground mt-0.5">Les familles pourront trouver votre club via la recherche</p>
          </div>
          <div className={`w-11 h-6 rounded-full transition-colors shrink-0 ml-4 flex items-center px-0.5 ${form.is_public ? 'bg-primary' : 'bg-border'}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${form.is_public ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
        </div>
      </Section>

      {/* Bientôt */}
      <div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-3">Fonctionnalités à venir</p>
        <div className="space-y-2">
          <ComingSoon title="Tarifs & abonnements"    description="Configurez vos plans d'adhésion et gérez les paiements en ligne." />
          <ComingSoon title="Documents requis"         description="Définissez les pièces justificatives à fournir lors de l'inscription." />
          <ComingSoon title="Notifications & emails"  description="Personnalisez les emails automatiques envoyés à vos membres." />
        </div>
      </div>

      {/* CTA */}
      <div className="pb-8">
        <button
          onClick={save}
          disabled={saving}
          className="w-full h-12 bg-primary text-primary-foreground rounded-2xl font-bold text-sm inline-flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-transform shadow-lg shadow-primary/25 disabled:opacity-50"
        >
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin shrink-0" /> Enregistrement…</>
            : <><Save className="w-4 h-4 shrink-0" /> Enregistrer les modifications</>}
        </button>
      </div>

    </div>
  )
}

const ProtectedSettingsPage: React.FC = () => (
  <RoleBasedRoute allowedRoles={['club_owner', 'club_manager', 'treasurer']}>
    <SettingsPage />
  </RoleBasedRoute>
)

export default ProtectedSettingsPage
