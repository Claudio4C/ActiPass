import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Users, Search, Edit, Trash2, Shield, Mail } from 'lucide-react'
import RoleBasedRoute from '../../components/shared/RoleBasedRoute'
import { api } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

interface Member {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  username: string;
  role: {
    id: string;
    name: string;
    type: string;
    level: number;
  };
  joined_at: string;
}

const roleOptions = [
  { value: 'club_manager', label: 'Gestionnaire', level: 80, description: 'Gestion quotidienne complète (événements, membres, paiements)' },
  { value: 'treasurer', label: 'Trésorier', level: 60, description: 'Accès aux finances uniquement' },
  { value: 'coach', label: 'Coach', level: 40, description: 'Gestion des séances et présences' },
  { value: 'member', label: 'Membre', level: 20, description: 'Accès de base (réservations, lecture)' },
]

const roleBadgeClass = (type: string) => {
  switch (type) {
    case 'club_owner':   return 'bg-[hsl(280_70%_60%/0.12)] text-[hsl(280,70%,50%)]'
    case 'club_manager': return 'bg-primary/10 text-primary'
    case 'treasurer':    return 'bg-[hsl(160_84%_39%/0.12)] text-[hsl(160,84%,32%)]'
    case 'coach':        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
    default:             return 'bg-muted text-muted-foreground'
  }
}

const avatarColors = [
  'hsl(217,91%,60%)', 'hsl(280,70%,60%)', 'hsl(25,95%,53%)',
  'hsl(160,84%,39%)', 'hsl(340,75%,55%)',
]

const getAvatarColor = (name: string) =>
  avatarColors[name.charCodeAt(0) % avatarColors.length]

const MembersPage: React.FC = () => {
  const { organisationId } = useParams<{ organisationId: string }>()
  const { user } = useAuth()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [selectedRoleType, setSelectedRoleType] = useState<string>('')
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (organisationId) { loadMembers() }
  }, [organisationId])

  const loadMembers = async (forceRefresh = false) => {
    if (!organisationId) { return }
    try {
      setLoading(true)
      const data = await api.get<Member[]>(
        `/organisations/${organisationId}/members`,
        undefined,
        forceRefresh ? { useCache: false } : { useCache: true, cacheTTL: 30000 },
      )
      setMembers(data)
    } catch {
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  const handleChangeRole = async () => {
    if (!organisationId || !selectedMember) { return }
    try {
      setActionLoading(true)
      await api.put(`/organisations/${organisationId}/members/${selectedMember.id}/role`, { roleType: selectedRoleType })
      api.clearCache(`/organisations/${organisationId}/members`)
      await loadMembers(true)
      setShowRoleModal(false)
      setSelectedMember(null)
      setSelectedRoleType('')
    } catch {
      alert('Erreur lors du changement de rôle')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteMember = async (memberId: string) => {
    if (!organisationId) { return }
    try {
      setActionLoading(true)
      await api.delete(`/organisations/${organisationId}/members/${memberId}`)
      api.clearCache(`/organisations/${organisationId}/members`)
      await loadMembers(true)
      setShowDeleteModal(false)
      setSelectedMember(null)
    } catch {
      alert('Erreur lors de la suppression du membre')
    } finally {
      setActionLoading(false)
    }
  }

  const filteredMembers = members.filter((m) =>
    [m.firstname, m.lastname, m.email, m.username].some((v) =>
      v?.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Membres</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {members.length} membre{members.length !== 1 ? 's' : ''} dans cette organisation
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          placeholder="Rechercher un membre..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-11 pl-9 pr-4 rounded-2xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {filteredMembers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
              <Users className="w-7 h-7 text-primary" />
            </div>
            <h2 className="font-display text-lg font-bold text-foreground">Aucun membre</h2>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'Aucun membre ne correspond à votre recherche.' : 'Aucun membre dans cette organisation.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  {['Membre', 'Rôle', "Date d'adhésion", 'Actions'].map((col, i) => (
                    <th
                      key={col}
                      className={`px-5 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-bold ${i === 3 ? 'text-right' : 'text-left'}`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white"
                          style={{ backgroundColor: getAvatarColor(member.firstname || 'U') }}
                        >
                          {member.firstname?.charAt(0) || 'U'}{member.lastname?.charAt(0) || ''}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {member.firstname} {member.lastname}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 shrink-0" />
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${roleBadgeClass(member.role.type)}`}>
                        <Shield className="w-3 h-3 shrink-0" />
                        {member.role.name}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {new Date(member.joined_at).toLocaleDateString('fr-FR', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/dashboard/${organisationId}/members/${member.id}`}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Voir les détails"
                        >
                          <Edit className="w-4 h-4 shrink-0" />
                        </Link>
                        {member.id !== user?.id && member.role.type !== 'club_owner' && (
                          <>
                            <button
                              onClick={() => { setSelectedMember(member); setSelectedRoleType(member.role.type); setShowRoleModal(true) }}
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                              title="Changer le rôle"
                            >
                              <Shield className="w-4 h-4 shrink-0" />
                            </button>
                            <button
                              onClick={() => { setSelectedMember(member); setShowDeleteModal(true) }}
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              title="Retirer le membre"
                            >
                              <Trash2 className="w-4 h-4 shrink-0" />
                            </button>
                          </>
                        )}
                        {member.role.type === 'club_owner' && (
                          <span className="text-xs text-muted-foreground italic pr-2">Propriétaire</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal — Changer le rôle */}
      {showRoleModal && selectedMember && (
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5">
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">
                Changer le rôle
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedMember.firstname} {selectedMember.lastname} — rôle actuel&nbsp;:
                <span className="font-semibold text-foreground"> {selectedMember.role.name}</span>
              </p>
            </div>
            <div className="space-y-2">
              {roleOptions.map((role) => (
                <label
                  key={role.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                    selectedRoleType === role.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={selectedRoleType === role.value}
                    onChange={(e) => setSelectedRoleType(e.target.value)}
                    className="text-primary focus:ring-primary"
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
                onClick={() => { setShowRoleModal(false); setSelectedMember(null) }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors active:scale-95"
              >
                Annuler
              </button>
              <button
                onClick={handleChangeRole}
                disabled={actionLoading || selectedRoleType === selectedMember.role.type}
                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
              >
                {actionLoading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Supprimer */}
      {showDeleteModal && selectedMember && (
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5">
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">Retirer le membre</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Êtes-vous sûr de vouloir retirer{' '}
                <span className="font-semibold text-foreground">
                  {selectedMember.firstname} {selectedMember.lastname}
                </span>{' '}
                de cette organisation ? Cette action est irréversible.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setSelectedMember(null) }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors active:scale-95"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteMember(selectedMember.id)}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 bg-destructive text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
              >
                {actionLoading ? 'Suppression...' : 'Retirer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const ProtectedMembersPage: React.FC = () => (
  <RoleBasedRoute allowedRoles={['club_owner', 'club_manager']}>
    <MembersPage />
  </RoleBasedRoute>
)

export default ProtectedMembersPage
