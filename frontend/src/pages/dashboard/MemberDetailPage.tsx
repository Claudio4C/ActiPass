import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Calendar, Shield, Trash2, User, Phone, Baby, X } from 'lucide-react'
import RoleBasedRoute from '../../components/shared/RoleBasedRoute'
import { api } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

interface Guardian {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string | null;
}

interface MemberDetail {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  username: string;
  phone: string | null;
  birthdate: string | null;
  is_minor: boolean;
  role: { id: string; name: string; type: string; level: number };
  membership_status: string;
  docs_status: string;
  payment_status: string;
  joined_at: string;
  guardians: Guardian[];
}

const AVATAR_COLORS = [
  'hsl(217,91%,60%)', 'hsl(280,70%,60%)', 'hsl(25,95%,53%)',
  'hsl(160,84%,39%)', 'hsl(340,75%,55%)',
]
const avatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]

const roleBadge = (type: string) => {
  switch (type) {
    case 'club_owner':   return 'bg-[hsl(280,70%,60%)]/10 text-[hsl(280,70%,50%)]'
    case 'club_manager': return 'bg-primary/10 text-primary'
    case 'treasurer':    return 'bg-[hsl(160,84%,39%)]/10 text-[hsl(160,84%,32%)]'
    case 'coach':        return 'bg-amber-500/10 text-amber-700'
    default:             return 'bg-muted text-muted-foreground'
  }
}

const roleOptions = [
  { value: 'club_manager', label: 'Gestionnaire', level: 80, description: 'Gestion quotidienne complète (événements, membres, paiements)' },
  { value: 'treasurer',    label: 'Trésorier',    level: 60, description: 'Accès aux finances uniquement' },
  { value: 'coach',        label: 'Coach',         level: 40, description: 'Gestion des séances et présences' },
  { value: 'member',       label: 'Membre',        level: 20, description: 'Accès de base (réservations, lecture)' },
]

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })

const MemberDetailPage: React.FC = () => {
  const { organisationId, memberId } = useParams<{ organisationId: string; memberId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [member,          setMember]          = useState<MemberDetail | null>(null)
  const [loading,         setLoading]         = useState(true)
  const [showRoleModal,   setShowRoleModal]   = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [actionLoading,   setActionLoading]   = useState(false)
  const [selectedRole,    setSelectedRole]    = useState('')

  useEffect(() => {
    if (organisationId && memberId) { loadMember() }
  }, [organisationId, memberId])

  const loadMember = async () => {
    if (!organisationId || !memberId) { return }
    try {
      setLoading(true)
      const data = await api.get<MemberDetail>(`/organisations/${organisationId}/members/${memberId}`)
      setMember(data)
      setSelectedRole(data.role.type)
    } catch {
      // silently fail — "not found" state handles it
    } finally {
      setLoading(false)
    }
  }

  const handleChangeRole = async () => {
    if (!organisationId || !memberId || !member) { return }
    try {
      setActionLoading(true)
      await api.put(`/organisations/${organisationId}/members/${memberId}/role`, { roleType: selectedRole })
      await loadMember()
      setShowRoleModal(false)
    } catch {
      alert('Erreur lors du changement de rôle')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteMember = async () => {
    if (!organisationId || !memberId) { return }
    try {
      setActionLoading(true)
      await api.delete(`/organisations/${organisationId}/members/${memberId}`)
      navigate(`/dashboard/${organisationId}/members`)
    } catch {
      alert('Erreur lors de la suppression du membre')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!member) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-muted-foreground">Membre introuvable.</p>
        <Link
          to={`/dashboard/${organisationId}/members`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" /> Retour à la liste
        </Link>
      </div>
    )
  }

  const canManage = member.id !== user?.id && member.role.type !== 'club_owner'

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start gap-4 flex-wrap">
        <Link
          to={`/dashboard/${organisationId}/members`}
          className="w-9 h-9 rounded-xl flex items-center justify-center border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors active:scale-95 shrink-0"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-2xl font-bold text-foreground">
              {member.firstname} {member.lastname}
            </h1>
            {member.is_minor && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[hsl(340,75%,55%)]/10 text-[hsl(340,75%,48%)]">
                <Baby className="h-3 w-3 shrink-0" />
                Membre mineur
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">Détails du membre</p>
        </div>

        {/* Actions */}
        {canManage ? (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setShowRoleModal(true)}
              className="inline-flex items-center gap-2 px-3 py-2 border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors active:scale-95"
            >
              <Shield className="h-4 w-4 shrink-0" />
              Changer le rôle
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-2 px-3 py-2 bg-destructive text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all active:scale-95"
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              Retirer
            </button>
          </div>
        ) : member.role.type === 'club_owner' && (
          <div className="shrink-0 px-3 py-2 bg-[hsl(280,70%,60%)]/10 border border-[hsl(280,70%,60%)]/20 rounded-xl">
            <p className="text-sm font-semibold text-[hsl(280,70%,50%)] flex items-center gap-1.5">
              <Shield className="h-4 w-4 shrink-0" />
              Propriétaire
            </p>
          </div>
        )}
      </div>

      {/* Fiche principale */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div
            className="shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center font-display text-xl font-bold text-white"
            style={{ backgroundColor: avatarColor(member.firstname) }}
          >
            {member.firstname?.charAt(0)}{member.lastname?.charAt(0)}
          </div>

          <div className="flex-1 min-w-0 space-y-5">
            {/* Infos personnelles */}
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-3">
                Informations personnelles
              </p>
              <div className="space-y-2">
                {!member.is_minor && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-foreground">{member.email}</span>
                  </div>
                )}
                {member.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-foreground">{member.phone}</span>
                  </div>
                )}
                {!member.is_minor && member.username && (
                  <div className="flex items-center gap-3 text-sm">
                    <User className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-muted-foreground">@{member.username}</span>
                  </div>
                )}
                {member.birthdate && (
                  <div className="flex items-center gap-3 text-sm">
                    <Baby className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-muted-foreground">Né(e) le {fmtDate(member.birthdate)}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">Membre depuis le {fmtDate(member.joined_at)}</span>
                </div>
              </div>
            </div>

            {/* Rôle */}
            <div className="pt-4 border-t border-border">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-3">
                Rôle et permissions
              </p>
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full ${roleBadge(member.role.type)}`}>
                  <Shield className="h-3.5 w-3.5 shrink-0" />
                  {member.role.name}
                </span>
                <span className="text-xs text-muted-foreground">Niveau {member.role.level}</span>
              </div>
            </div>

            {/* Statuts */}
            <div className="pt-4 border-t border-border">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-3">
                Statuts
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Adhésion', value: member.membership_status },
                  { label: 'Documents', value: member.docs_status },
                  { label: 'Paiement', value: member.payment_status },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted rounded-xl px-3 py-2 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{label}</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5 capitalize">{value?.replace('_', ' ') ?? '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Carte tuteurs (mineurs) */}
      {member.is_minor && member.guardians?.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-4 flex items-center gap-2">
            <Baby className="h-3.5 w-3.5 shrink-0" />
            Contact(s) parent / tuteur
          </p>
          <div className="space-y-4">
            {member.guardians.map((g) => (
              <div key={g.id} className="flex items-center gap-4">
                <div
                  className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white"
                  style={{ backgroundColor: avatarColor(g.firstname) }}
                >
                  {g.firstname.charAt(0)}{g.lastname.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{g.firstname} {g.lastname}</p>
                  <div className="flex flex-wrap gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3 shrink-0" />{g.email}
                    </span>
                    {g.phone && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3 shrink-0" />{g.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal — Changer le rôle */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">Changer le rôle</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Rôle actuel : <span className="font-semibold text-foreground">{member.role.name}</span>
                </p>
              </div>
              <button
                onClick={() => { setShowRoleModal(false); setSelectedRole(member.role.type) }}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 shrink-0" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {roleOptions.map((role) => (
                <label
                  key={role.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                    selectedRole === role.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={selectedRole === role.value}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="mt-0.5 accent-primary"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{role.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowRoleModal(false); setSelectedRole(member.role.type) }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors active:scale-95"
              >
                Annuler
              </button>
              <button
                onClick={handleChangeRole}
                disabled={actionLoading || selectedRole === member.role.type}
                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
              >
                {actionLoading ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Supprimer */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-foreground">Retirer le membre</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 shrink-0" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Êtes-vous sûr de vouloir retirer{' '}
              <span className="font-semibold text-foreground">
                {member.firstname} {member.lastname}
              </span>{' '}
              de cette organisation ? Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors active:scale-95"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteMember}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 bg-destructive text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
              >
                {actionLoading ? 'Suppression…' : 'Retirer le membre'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

const ProtectedMemberDetailPage: React.FC = () => (
  <RoleBasedRoute allowedRoles={['club_owner', 'club_manager']}>
    <MemberDetailPage />
  </RoleBasedRoute>
)

export default ProtectedMemberDetailPage
