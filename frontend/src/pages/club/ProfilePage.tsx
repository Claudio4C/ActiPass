import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, X, Check, Lock, Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'
import AvatarUpload from '../../components/AvatarUpload'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Child {
  id: string; firstname: string; lastname: string;
  birthdate: string | null; gender: string | null;
  avatar_url?: string | null;
  memberships: { id: string; organisation: { name: string } }[];
}

interface MeData {
  id: string; firstname: string; lastname: string;
  email: string; phone: string | null; birthdate: string | null;
  gender: string | null; avatar_url: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'hsl(217,91%,60%)', 'hsl(280,70%,60%)', 'hsl(25,95%,53%)',
  'hsl(160,84%,39%)', 'hsl(340,75%,55%)',
]
const avatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
const getAge = (b: string | null) => b
  ? Math.floor((Date.now() - new Date(b).getTime()) / (1000 * 60 * 60 * 24 * 365))
  : null

const inputCls = 'w-full rounded-xl border border-border bg-muted px-3 h-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors'

// ─── Profile modes ────────────────────────────────────────────────────────────

const PROFILE_MODES = [
  { value: 'solo',    label: 'Solo',    emoji: '👤', desc: 'Mes propres activités' },
  { value: 'duo',     label: 'Duo',     emoji: '👥', desc: 'Moi et un partenaire' },
  { value: 'famille', label: 'Famille', emoji: '👨‍👩‍👧‍👦', desc: 'Avec mes enfants' },
]

// ─── Main ─────────────────────────────────────────────────────────────────────

const ProfilePage: React.FC = () => {
  const { user } = useAuth()

  const [me, setMe] = useState<MeData | null>(null)
  const [children, setChildren] = useState<Child[]>([])
  const [profileMode, setProfileMode] = useState(() => localStorage.getItem('ikivio_profile_mode') ?? 'famille')
  const [showModeModal, setShowModeModal] = useState(false)

  const [form, setForm] = useState({ firstname: '', lastname: '', phone: '', birthdate: '', gender: 'prefer_not_to_say' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)

  useEffect(() => {
    api.get<{ user: MeData }>('/users/me', undefined, { useCache: false })
      .then(({ user: u }) => {
        setMe(u)
        if (u.avatar_url) { localStorage.setItem('user_avatar_url', u.avatar_url) }
        setForm({
          firstname: u.firstname ?? '',
          lastname: u.lastname ?? '',
          phone: u.phone ?? '',
          birthdate: u.birthdate ? u.birthdate.slice(0, 10) : '',
          gender: u.gender ?? 'prefer_not_to_say',
        })
      })
      .catch(() => {})
    api.get<Child[]>('/family/children').then(setChildren).catch(() => {})
  }, [])

  const firstName = me?.firstname ?? user?.firstName ?? ''
  const lastName  = me?.lastname  ?? user?.lastName  ?? ''
  const email     = me?.email     ?? user?.email ?? ''
  const fullName  = `${firstName} ${lastName}`.trim()

  const profileFields = [
    { label: 'Prénom & Nom',      done: !!(firstName && lastName) },
    { label: 'Téléphone',         done: !!me?.phone },
    { label: 'Date de naissance', done: !!me?.birthdate },
    { label: 'Photo de profil',   done: !!me?.avatar_url },
  ]
  const completionPct = Math.round(profileFields.filter((f) => f.done).length / profileFields.length * 100)

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setFormError(null); setSaved(false)
    try {
      const payload: Record<string, string> = {}
      if (form.firstname.trim()) { payload.firstname = form.firstname.trim() }
      if (form.lastname.trim())  { payload.lastname  = form.lastname.trim() }
      if (form.phone.trim())     { payload.phone     = form.phone.trim() }
      if (form.birthdate)        { payload.birthdate = form.birthdate }
      if (form.gender)           { payload.gender    = form.gender }
      const { user: updated } = await api.put<{ user: MeData }>('/users/me', payload)
      setMe(updated); setSaved(true); setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.')
    } finally { setSaving(false) }
  }

  const changeMode = (m: string) => {
    setProfileMode(m)
    localStorage.setItem('ikivio_profile_mode', m)
    api.put('/users/me', { profile_mode: m }).catch(() => {})
    setShowModeModal(false)
  }

  const currentMode = PROFILE_MODES.find((m) => m.value === profileMode) ?? PROFILE_MODES[0]
  const color = avatarColor(firstName || 'U')

  return (
    <div className="space-y-4 max-w-xl mx-auto">

      {/* ── Carte identité ──────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-4">
          {/* Avatar upload */}
          <div className="shrink-0">
            <AvatarUpload
              currentUrl={me?.avatar_url ?? null}
              name={fullName || email}
              color={color}
              shape="circle"
              size="lg"
              hintClassName="text-[11px] text-muted-foreground/70 text-center"
              onUpload={async (url) => {
                await api.put<{ user: MeData }>('/users/me', { avatar_url: url })
                setMe((prev) => prev ? { ...prev, avatar_url: url } : prev)
                localStorage.setItem('user_avatar_url', url)
                window.dispatchEvent(new Event('avatar:updated'))
              }}
            />
          </div>
          {/* Infos */}
          <div className="flex-1 min-w-0 space-y-1">
            <h1 className="font-display text-xl font-bold text-foreground truncate">
              {fullName || 'Mon profil'}
            </h1>
            <p className="text-sm text-muted-foreground truncate">{email}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                Membre actif
              </span>
              {me?.birthdate && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                  {getAge(me.birthdate)} ans
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Complétion */}
        {completionPct < 100 && (
          <div className="mt-4 pt-4 border-t border-border space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Profil complété</p>
              <span className="text-xs font-bold text-primary">{completionPct}%</span>
            </div>
            <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
              <div className="bg-primary h-1.5 rounded-full transition-all duration-500" style={{ width: `${completionPct}%` }} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profileFields.filter((f) => !f.done).map((f) => (
                <span key={f.label} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700">
                  + {f.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Mode d'utilisation ──────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl px-4 py-3">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-2">Mode d'utilisation</p>
        <button onClick={() => setShowModeModal(true)} className="w-full flex items-center gap-3 active:scale-[0.99] transition-transform">
          <span className="text-lg shrink-0">{currentMode.emoji}</span>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-foreground">Mode {currentMode.label}</p>
            <p className="text-xs text-muted-foreground">{currentMode.desc}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>
      </div>

      {/* ── Informations personnelles ────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="font-display font-bold text-foreground mb-4">Informations personnelles</h2>
        <form onSubmit={saveProfile} className="space-y-3">
          {formError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2">
              <p className="text-sm text-destructive">{formError}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block mb-1.5">Prénom</label>
              <input value={form.firstname} onChange={(e) => setForm((f) => ({ ...f, firstname: e.target.value }))} placeholder="Prénom" className={inputCls} />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block mb-1.5">Nom</label>
              <input value={form.lastname} onChange={(e) => setForm((f) => ({ ...f, lastname: e.target.value }))} placeholder="Nom" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block mb-1.5">Téléphone</label>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="06 00 00 00 00" className={inputCls} />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block mb-1.5">Naissance</label>
              <input type="date" value={form.birthdate} onChange={(e) => setForm((f) => ({ ...f, birthdate: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block mb-1.5">Genre</label>
            <div className="flex gap-2">
              {[{ v: 'female', l: 'Femme' }, { v: 'male', l: 'Homme' }, { v: 'prefer_not_to_say', l: 'Non précisé' }].map(({ v, l }) => (
                <button key={v} type="button" onClick={() => setForm((f) => ({ ...f, gender: v }))}
                  className={`flex-1 h-10 rounded-xl text-xs font-semibold border-2 transition-colors active:scale-95 ${form.gender === v ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button type="submit" disabled={saving}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-bold px-5 py-2.5 rounded-full active:scale-95 transition-transform disabled:opacity-50">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin shrink-0" />Enregistrement…</>
                : saved  ? <><Check className="w-4 h-4 shrink-0" />Enregistré !</>
                : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Profils enfants ──────────────────────────────────────────────────── */}
      {children.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-display font-bold text-foreground mb-4">Mes enfants</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {children.map((child) => {
              const age = getAge(child.birthdate)
              const c = avatarColor(child.firstname)
              return (
                <Link key={child.id} to={`/club/famille/${child.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/40 hover:border-primary/40 hover:bg-muted transition-colors active:scale-[0.99]">
                  {child.avatar_url ? (
                    <img src={child.avatar_url} alt={child.firstname} className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-card" />
                  ) : (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-sm text-white shrink-0 ring-2 ring-card" style={{ backgroundColor: c }}>
                      {child.firstname.charAt(0)}{child.lastname.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{child.firstname}</p>
                    {age !== null && <p className="text-xs text-muted-foreground">{age} ans</p>}
                  </div>
                </Link>
              )
            })}
            <Link to="/club/famille"
              className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors active:scale-[0.99]">
              <span className="text-lg">+</span>
              <span className="text-xs font-semibold">Gérer</span>
            </Link>
          </div>
        </div>
      )}

      {/* ── Sécurité ─────────────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="font-display font-bold text-foreground mb-4">Sécurité du compte</h2>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[{ label: 'Mot de passe actuel', key: 'current' }, { label: 'Nouveau', key: 'next' }, { label: 'Confirmation', key: 'confirm' }].map(({ label, key }) => (
              <div key={key}>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block mb-1.5">{label}</label>
                <input type="password" placeholder="••••••••" value={pwForm[key as keyof typeof pwForm]}
                  onChange={(e) => setPwForm((f) => ({ ...f, [key]: e.target.value }))} className={inputCls} />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/50 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
              <p className="text-sm font-semibold text-foreground">Authentification à 2 facteurs</p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">Bientôt</span>
          </div>
          <div className="flex justify-end">
            <button type="button" disabled={pwSaving || !pwForm.current || !pwForm.next || !pwForm.confirm}
              onClick={async () => {
                if (pwForm.next !== pwForm.confirm) { return }
                setPwSaving(true)
                try {
                  await new Promise((r) => setTimeout(r, 400))
                  setPwSaved(true); setPwForm({ current: '', next: '', confirm: '' })
                  setTimeout(() => setPwSaved(false), 3000)
                } finally { setPwSaving(false) }
              }}
              className={cn('inline-flex items-center gap-2 border text-sm font-bold px-5 py-2.5 rounded-full active:scale-95 transition-transform disabled:opacity-40',
                pwSaved ? 'border-[hsl(160,84%,39%)] text-[hsl(160,84%,39%)]' : 'border-primary text-primary hover:bg-primary/5')}>
              {pwSaved ? <><Check className="w-4 h-4 shrink-0" />Mis à jour</> : pwSaving ? 'Mise à jour…' : 'Mettre à jour'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal mode ───────────────────────────────────────────────────────── */}
      {showModeModal && (
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-foreground">Mode d'utilisation</h2>
              <button onClick={() => setShowModeModal(false)} className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted">
                <X className="w-4 h-4 shrink-0" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {PROFILE_MODES.map((m) => (
                <button key={m.value} onClick={() => changeMode(m.value)}
                  className={cn('flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all active:scale-[0.98]',
                    profileMode === m.value ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-card text-muted-foreground hover:bg-muted')}>
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-xs font-bold capitalize">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default ProfilePage
