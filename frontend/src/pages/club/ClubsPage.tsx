import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, MapPin, Phone, Users, Plus, X, Check,
  Sparkles, Loader2, ChevronRight, Navigation,
} from 'lucide-react'
import { api } from '../../lib/api'
import { cn } from '../../lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PublicOrg {
  id: string;
  name: string;
  type: 'sport' | 'culture' | 'loisir' | 'social' | 'other';
  description: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  member_count: number;
}

interface FamilyChild {
  id: string; firstname: string; lastname: string; birthdate: string | null;
  memberships: { id: string; organisation: { id: string } }[];
}

interface MyMembership {
  id: string; organisation: { id: string };
}

// ─── Meta catégories ──────────────────────────────────────────────────────────

const CAT_META: Record<string, { emoji: string; label: string; color: string }> = {
  sport:   { emoji: '⚽', label: 'Sport',   color: 'text-[hsl(160,84%,39%)] bg-[hsl(160,84%,39%)]/10' },
  culture: { emoji: '🎭', label: 'Culture', color: 'text-[hsl(340,75%,55%)] bg-[hsl(340,75%,55%)]/10' },
  loisir:  { emoji: '🎨', label: 'Loisir',  color: 'text-amber-600 bg-amber-500/10' },
  social:  { emoji: '🤝', label: 'Social',  color: 'text-primary bg-primary/10' },
  other:   { emoji: '🏢', label: 'Autre',   color: 'text-muted-foreground bg-muted' },
}

const FILTER_CATS = [
  { id: '', label: 'Tout' },
  { id: 'sport', label: 'Sport' },
  { id: 'culture', label: 'Culture' },
  { id: 'loisir', label: 'Loisir' },
  { id: 'social', label: 'Social' },
]

// ─── Enrollment modal ─────────────────────────────────────────────────────────

interface EnrollModalProps {
  org: PublicOrg;
  myMemberships: MyMembership[];
  children: FamilyChild[];
  onClose: () => void;
  onDone: (orgId: string, memberId: string | 'me') => void;
}

const EnrollModal: React.FC<EnrollModalProps> = ({ org, myMemberships, children, onClose, onDone }) => {
  const [selected, setSelected] = useState<string | null>(null) // 'me' | childId
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const meta = CAT_META[org.type] ?? CAT_META.other

  const alreadyMeEnrolled = myMemberships.some((m) => m.organisation.id === org.id)

  const getChildEnrolled = (child: FamilyChild) =>
    child.memberships.some((m) => m.organisation.id === org.id)

  const members = [
    { id: 'me' as const, name: 'Moi', subtitle: 'Adulte', enrolled: alreadyMeEnrolled },
    ...children.map((c) => {
      const age = c.birthdate
        ? Math.floor((Date.now() - new Date(c.birthdate).getTime()) / (1000 * 60 * 60 * 24 * 365))
        : null
      return { id: c.id, name: c.firstname, subtitle: age !== null ? `${age} ans` : 'Enfant', enrolled: getChildEnrolled(c) }
    }),
  ]

  const submit = async () => {
    if (!selected) { return }
    setSaving(true)
    setError(null)
    try {
      if (selected === 'me') {
        await api.post(`/organisations/${org.id}/join`, {})
      } else {
        await api.post(`/family/children/${selected}/memberships`, { organisation_id: org.id })
      }
      onDone(org.id, selected)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'inscription.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-3xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-border">
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base', meta.color)}>
            {meta.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-foreground truncate">Inscrire à {org.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Choisissez qui inscrire dans votre famille</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
            <X className="w-4 h-4 shrink-0" />
          </button>
        </div>

        {/* Erreur */}
        {error && (
          <div className="mx-5 mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Liste membres */}
        <div className="divide-y divide-border max-h-72 overflow-y-auto">
          {members.map((m) => (
            <label
              key={m.id}
              className={cn(
                'flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors',
                m.enrolled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted/50',
              )}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm text-white shrink-0"
                style={{ backgroundColor: m.id === 'me' ? 'hsl(222,47%,20%)' : `hsl(${(m.name.charCodeAt(0) * 37) % 360},70%,55%)` }}
              >
                {m.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground">{m.name}</p>
                <p className="text-xs text-muted-foreground">
                  {m.enrolled ? '✓ Déjà inscrit(e)' : m.subtitle}
                </p>
              </div>
              {m.enrolled ? (
                <Check className="w-4 h-4 text-[hsl(160,84%,39%)] shrink-0" />
              ) : (
                <input
                  type="radio"
                  name="member"
                  value={m.id}
                  checked={selected === m.id}
                  onChange={() => setSelected(m.id)}
                  className="w-5 h-5 accent-primary"
                />
              )}
            </label>
          ))}
        </div>

        {/* Footer */}
        <div className="flex border-t border-border">
          <button
            onClick={onClose}
            className="flex-1 py-4 text-sm font-semibold text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={submit}
            disabled={!selected || saving}
            className="flex-1 py-4 text-sm font-bold text-primary disabled:text-muted-foreground disabled:cursor-not-allowed border-l border-border hover:bg-primary/5 transition-colors inline-flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
            {saving ? 'Envoi…' : selected ? 'Confirmer l\'inscription' : 'Sélectionnez un membre'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Club card ────────────────────────────────────────────────────────────────

const ClubCard: React.FC<{
  org: PublicOrg;
  isEnrolled: boolean;
  hasChildEnrolled: boolean;
  onEnroll: (org: PublicOrg) => void;
}> = ({ org, isEnrolled, hasChildEnrolled, onEnroll }) => {
  const meta = CAT_META[org.type] ?? CAT_META.other

  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md hover:border-primary/20 transition-all">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg', meta.color)}>
          {meta.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display font-bold text-sm text-foreground truncate">{org.name}</p>
          <p className="text-xs text-muted-foreground">
            {org.city ?? 'Localisation non précisée'}
          </p>
        </div>
        {(isEnrolled || hasChildEnrolled) && (
          <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[hsl(160,84%,39%)]/10 text-[hsl(160,84%,32%)]">
            {isEnrolled ? '✓ Membre' : '✓ Enfant inscrit'}
          </span>
        )}
      </div>

      {/* Description */}
      {org.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">{org.description}</p>
      )}

      {/* Métadonnées */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {org.address && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3 h-3 shrink-0" />{org.address}
          </span>
        )}
        {org.phone && (
          <span className="inline-flex items-center gap-1">
            <Phone className="w-3 h-3 shrink-0" />{org.phone}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Users className="w-3 h-3 shrink-0" />{org.member_count} membre{org.member_count !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <Link
          to={`/club/${org.id}`}
          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
        >
          Voir le club <ChevronRight className="w-3 h-3 shrink-0" />
        </Link>
        <button
          onClick={() => onEnroll(org)}
          className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-3.5 py-2 rounded-full active:scale-95 transition-transform hover:opacity-90"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" /> Inscrire
        </button>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const ClubsPage: React.FC = () => {
  const [orgs, setOrgs] = useState<PublicOrg[]>([])
  const [myMemberships, setMyMemberships] = useState<MyMembership[]>([])
  const [children, setChildren] = useState<FamilyChild[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState('')
  const [geoLoading, setGeoLoading] = useState(false)
  const [enrollingOrg, setEnrollingOrg] = useState<PublicOrg | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [enrolledMap, setEnrolledMap] = useState<Record<string, string[]>>({})

  useEffect(() => {
    const load = async () => {
      try {
        const [orgsData, myData, childrenData] = await Promise.all([
          api.get<PublicOrg[]>('/organisations/public', undefined, { useCache: true, cacheTTL: 60000 }),
          api.get<{ organisation: { id: string } }[]>('/organisations/my', {}, { useCache: true, cacheTTL: 60000 }),
          api.get<FamilyChild[]>('/family/children').catch(() => [] as FamilyChild[]),
        ])
        setOrgs(orgsData)
        setMyMemberships(myData.map((m) => ({ id: m.organisation.id, organisation: m.organisation })))
        setChildren(childrenData)
      } catch {
        setOrgs([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleNearMe = () => {
    if (!navigator.geolocation) { return }
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        // Ouvre Google Maps avec une recherche de clubs/associations autour de la position
        const query = encodeURIComponent('club association sport')
        window.open(
          `https://www.google.com/maps/search/${query}/@${latitude},${longitude},14z`,
          '_blank',
          'noopener,noreferrer',
        )
        setGeoLoading(false)
      },
      () => setGeoLoading(false),
    )
  }

  const filtered = useMemo(() => {
    return orgs.filter((o) => {
      const matchType = !activeType || o.type === activeType
      const matchSearch = !search || [o.name, o.description, o.city, o.address].some(
        (v) => v?.toLowerCase().includes(search.toLowerCase()),
      )
      return matchType && matchSearch
    })
  }, [orgs, search, activeType])

  const hasNoClub = myMemberships.length === 0

  const isEnrolled = (orgId: string) =>
    myMemberships.some((m) => m.organisation.id === orgId) ||
    (enrolledMap[orgId] ?? []).includes('me')

  const hasChildEnrolled = (orgId: string) =>
    children.some((c) => c.memberships.some((m) => m.organisation.id === orgId)) ||
    (enrolledMap[orgId] ?? []).some((id) => id !== 'me')

  const handleDone = (orgId: string, memberId: string | 'me') => {
    setEnrolledMap((prev) => ({
      ...prev,
      [orgId]: [...(prev[orgId] ?? []), memberId],
    }))
    const memberName = memberId === 'me'
      ? 'Vous'
      : children.find((c) => c.id === memberId)?.firstname ?? 'Votre enfant'
    setSuccessMsg(`${memberName} : demande d'adhésion envoyée à ${enrollingOrg?.name} !`)
    setTimeout(() => setSuccessMsg(null), 4000)
    setEnrollingOrg(null)
  }

  return (
    <div className="space-y-6">
      {/* Toast succès */}
      {successMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2 bg-[hsl(160,84%,39%)] text-white animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/home"
          className="w-9 h-9 rounded-xl flex items-center justify-center border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors active:scale-95 shrink-0 mt-1">
          <ChevronRight className="w-4 h-4 rotate-180 shrink-0" />
        </Link>
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Clubs & associations</h1>
          <p className="text-muted-foreground mt-1">
            Découvrez les associations, gérez vos adhésions et suivez vos demandes en cours.
          </p>
        </div>
      </div>

      {/* Titre annuaire */}
      <div>
        <h2 className="font-display text-lg font-bold text-foreground">Annuaire des clubs</h2>
        <p className="text-sm text-muted-foreground">
          {loading ? '…' : `${orgs.length} association${orgs.length !== 1 ? 's' : ''} disponible${orgs.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Hero banner si aucun club */}
      {!loading && hasNoClub && (
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/85 rounded-3xl p-5 text-primary-foreground shadow-xl shadow-primary/30">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary-foreground/10 rounded-full blur-2xl" />
          <div className="relative flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-primary-foreground/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <p className="font-display font-bold text-base">Vous n'avez encore rejoint aucun club</p>
              <p className="text-sm text-primary-foreground/80 mt-0.5">
                Recherchez ci-dessous une association pour envoyer une demande d'adhésion.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search + filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom du club, sport, ville…"
            className="w-full h-11 pl-9 pr-4 rounded-2xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4 shrink-0" />
            </button>
          )}
        </div>
        <button
          onClick={handleNearMe}
          disabled={geoLoading}
          className="h-11 px-4 rounded-2xl text-sm font-semibold border border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors inline-flex items-center gap-2 active:scale-95 shrink-0"
          title="Trouver des clubs à proximité sur Google Maps"
        >
          {geoLoading
            ? <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            : <Navigation className="w-4 h-4 shrink-0" />}
          Près de moi
        </button>
        <div className="flex gap-2 flex-wrap">
          {FILTER_CATS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveType(cat.id)}
              className={cn(
                'px-3.5 h-11 rounded-full text-sm font-semibold border transition-colors active:scale-95',
                activeType === cat.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-foreground border-border hover:bg-muted',
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-12 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <Search className="w-7 h-7 text-primary" />
          </div>
          <h2 className="font-display text-lg font-bold text-foreground">Aucun résultat</h2>
          <p className="text-sm text-muted-foreground">Essayez avec d'autres mots-clés ou supprimez les filtres.</p>
          <button
            onClick={() => { setSearch(''); setActiveType('') }}
            className="text-sm text-primary font-semibold hover:underline"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((org) => (
            <ClubCard
              key={org.id}
              org={org}
              isEnrolled={isEnrolled(org.id)}
              hasChildEnrolled={hasChildEnrolled(org.id)}
              onEnroll={setEnrollingOrg}
            />
          ))}
        </div>
      )}

      {/* Modal inscription */}
      {enrollingOrg && (
        <EnrollModal
          org={enrollingOrg}
          myMemberships={myMemberships}
          children={children}
          onClose={() => setEnrollingOrg(null)}
          onDone={handleDone}
        />
      )}
    </div>
  )
}

export default ClubsPage
