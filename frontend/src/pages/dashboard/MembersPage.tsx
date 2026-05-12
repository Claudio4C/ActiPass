import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Users, Search, Edit, Trash2, Shield, Mail, Download, Tag, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import RoleBasedRoute from '../../components/shared/RoleBasedRoute'
import { api } from '../../lib/api'
import { getErrorMessage } from '../../lib/errors'
import { useAuth } from '../../contexts/AuthContext'
import type { RoleType } from '../../types'

interface MemberTag {
  id: string
  name: string
}

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
  tags?: MemberTag[];
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
  const [orgTags, setOrgTags] = useState<MemberTag[]>([])
  const [tagFilter, setTagFilter] = useState<string>('all')
  const [tagsCatalogOpen, setTagsCatalogOpen] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [tagCatalogLoading, setTagCatalogLoading] = useState(false)
  const [orgTagsLoading, setOrgTagsLoading] = useState(false)
  const [tagCatalogNotice, setTagCatalogNotice] = useState<{ variant: 'success' | 'error'; message: string } | null>(null)
  const [pageToast, setPageToast] = useState<{ variant: 'success' | 'error'; message: string } | null>(null)
  const [memberTagNotice, setMemberTagNotice] = useState<{ variant: 'success' | 'error'; message: string } | null>(null)
  const [memberTagEdit, setMemberTagEdit] = useState<Member | null>(null)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [exportLoading, setExportLoading] = useState(false)
  /** Seul le propriétaire (rôle ou créateur du club) gère les tags — aligné sur l’API. */
  const [canManageTags, setCanManageTags] = useState<boolean | null>(null)

  const loadOrgTags = useCallback(async (context: 'initial' | 'catalog' | 'member' = 'initial') => {
    if (!organisationId) { return }
    try {
      setOrgTagsLoading(true)
      const t = await api.get<MemberTag[]>(
        `/organisations/${organisationId}/member-tags`,
        undefined,
        { useCache: false },
      )
      setOrgTags(Array.isArray(t) ? t : [])
    } catch (e) {
      setOrgTags([])
      const msg = getErrorMessage(e instanceof Error ? e : new Error(String(e)))
      if (context === 'catalog') {
        setTagCatalogNotice({ variant: 'error', message: msg })
      } else if (context === 'member') {
        setMemberTagNotice({ variant: 'error', message: msg })
      }
    } finally {
      setOrgTagsLoading(false)
    }
  }, [organisationId])

  const openTagsCatalogModal = useCallback(() => {
    setTagCatalogNotice(null)
    setTagsCatalogOpen(true)
    void loadOrgTags('catalog')
  }, [loadOrgTags])

  const loadMembers = useCallback(async (forceRefresh = false) => {
    if (!organisationId) { return }
    try {
      setLoading(true)
      const params = tagFilter === 'all' ? undefined : { tagId: tagFilter }
      const data = await api.get<Member[]>(
        `/organisations/${organisationId}/members`,
        params,
        forceRefresh ? { useCache: false } : { useCache: true, cacheTTL: 30000 },
      )
      setMembers(data.map((m) => ({ ...m, tags: m.tags ?? [] })))
    } catch {
      setMembers([])
    } finally {
      setLoading(false)
    }
  }, [organisationId, tagFilter])

  useEffect(() => {
    if (!organisationId || !user?.id) {
      setCanManageTags(null)
      return
    }
    let cancelled = false
    const run = async () => {
      try {
        const d = await api.get<{
          organisation: { created_by_id: string };
          myRole: { type: RoleType };
        }>(`/organisations/${organisationId}`, undefined, { useCache: true, cacheTTL: 60000 })
        if (cancelled) { return }
        const ownerLike =
          d.myRole.type === 'club_owner' || d.organisation.created_by_id === user.id
        setCanManageTags(ownerLike)
      } catch {
        if (!cancelled) { setCanManageTags(false) }
      }
    }
    void run()
    return () => { cancelled = true }
  }, [organisationId, user?.id])

  useEffect(() => {
    if (!organisationId || canManageTags !== true) {
      if (canManageTags === false) {
        setOrgTags([])
        setTagFilter('all')
      }
      return
    }
    void loadOrgTags('initial')
  }, [organisationId, canManageTags, loadOrgTags])

  useEffect(() => {
    if (!organisationId) { return }
    void loadMembers()
  }, [organisationId, tagFilter, loadMembers])

  useEffect(() => {
    if (!pageToast) { return undefined }
    const id = window.setTimeout(() => setPageToast(null), 6000)
    return () => clearTimeout(id)
  }, [pageToast])

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

  const handleExportCsv = async () => {
    if (!organisationId) { return }
    try {
      setExportLoading(true)
      const res = await api.get<{ csv: string; filename: string }>(
        `/organisations/${organisationId}/members/export`,
        undefined,
        { useCache: false },
      )
      const blob = new Blob([`\uFEFF${res.csv}`], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.filename || 'membres.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(getErrorMessage(err instanceof Error ? err : new Error(String(err))))
    } finally {
      setExportLoading(false)
    }
  }

  const handleCreateOrgTag = async () => {
    if (!organisationId || !newTagName.trim()) { return }
    const label = newTagName.trim()
    try {
      setTagCatalogLoading(true)
      setTagCatalogNotice(null)
      const created = await api.post<{ id: string; name: string; created_at?: string }>(
        `/organisations/${organisationId}/member-tags`,
        { name: label },
      )
      setNewTagName('')
      api.clearCache(`/organisations/${organisationId}/member-tags`)
      setOrgTags((prev) => {
        const next = [...prev.filter((x) => x.id !== created.id), { id: created.id, name: created.name }]
        next.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
        return next
      })
      await loadOrgTags('catalog')
      setTagCatalogNotice({ variant: 'success', message: `Le tag « ${created.name} » a été créé.` })
    } catch (e) {
      setTagCatalogNotice({
        variant: 'error',
        message: getErrorMessage(e instanceof Error ? e : new Error(String(e))),
      })
    } finally {
      setTagCatalogLoading(false)
    }
  }

  const handleDeleteOrgTag = async (tagId: string) => {
    if (!organisationId) { return }
    if (!window.confirm('Supprimer ce tag ? Il sera retiré de tous les membres.')) { return }
    try {
      await api.delete(`/organisations/${organisationId}/member-tags/${tagId}`)
      api.clearCache(`/organisations/${organisationId}/member-tags`)
      api.clearCache(`/organisations/${organisationId}/members`)
      await loadOrgTags('catalog')
      await loadMembers(true)
      if (tagFilter === tagId) { setTagFilter('all') }
      setTagCatalogNotice({ variant: 'success', message: 'Le tag a été supprimé.' })
    } catch (e) {
      setTagCatalogNotice({
        variant: 'error',
        message: getErrorMessage(e instanceof Error ? e : new Error(String(e))),
      })
    }
  }

  const openMemberTagsModal = (m: Member) => {
    setMemberTagEdit(m)
    setSelectedTagIds((m.tags ?? []).map((t) => t.id))
    setTagCatalogNotice(null)
    setMemberTagNotice(null)
    void loadOrgTags('member')
  }

  const toggleMemberTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    )
  }

  const saveMemberTags = async () => {
    if (!organisationId || !memberTagEdit) { return }
    const { firstname, lastname } = memberTagEdit
    try {
      setTagCatalogLoading(true)
      setMemberTagNotice(null)
      await api.put(`/organisations/${organisationId}/members/${memberTagEdit.id}/tags`, {
        tagIds: selectedTagIds,
      })
      api.clearCache(`/organisations/${organisationId}/members`)
      await loadMembers(true)
      setMemberTagEdit(null)
      setPageToast({
        variant: 'success',
        message: `Tags enregistrés pour ${firstname} ${lastname}.`,
      })
    } catch (e) {
      setMemberTagNotice({
        variant: 'error',
        message: getErrorMessage(e instanceof Error ? e : new Error(String(e))),
      })
    } finally {
      setTagCatalogLoading(false)
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
      {pageToast && (
        <div
          role="status"
          className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
            pageToast.variant === 'success'
              ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-950 dark:text-emerald-50'
              : 'border-destructive/35 bg-destructive/10 text-destructive'
          }`}
        >
          {pageToast.variant === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          )}
          <p className="font-medium flex-1 pt-0.5">{pageToast.message}</p>
          <button
            type="button"
            onClick={() => setPageToast(null)}
            className="shrink-0 rounded-lg p-1 text-foreground/60 hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Fermer la notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Membres</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {members.length} membre{members.length !== 1 ? 's' : ''} dans cette organisation
            {!orgTagsLoading && canManageTags === true && orgTags.length > 0 && (
              <span className="text-muted-foreground/80">
                {' '}
                · {orgTags.length} tag{orgTags.length !== 1 ? 's' : ''} club
              </span>
            )}
            {canManageTags === true && tagFilter !== 'all' && orgTags.find((t) => t.id === tagFilter) && (
              <span className="text-primary font-medium">
                {' '}
                — filtre&nbsp;: {orgTags.find((t) => t.id === tagFilter)?.name}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={exportLoading || members.length === 0}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
          >
            {exportLoading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Download className="w-4 h-4 shrink-0" />}
            Export CSV
          </button>
          {canManageTags === true && (
            <button
              type="button"
              onClick={openTagsCatalogModal}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              <Tag className="w-4 h-4 shrink-0" />
              Tags du club
              {!orgTagsLoading && orgTags.length > 0 && (
                <span className="text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-md bg-primary/15 text-primary">
                  {orgTags.length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Search + filtre tag */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Rechercher un membre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-9 pr-4 rounded-2xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        {canManageTags === true && (
          <div className="sm:w-56 shrink-0">
            <label htmlFor="member-tag-filter" className="sr-only">Filtrer par tag</label>
            <select
              id="member-tag-filter"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="w-full h-11 px-3 rounded-2xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="all">Tous les tags</option>
              {orgTags.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}
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
              {searchQuery
                ? 'Aucun membre ne correspond à votre recherche.'
                : tagFilter !== 'all'
                  ? 'Aucun membre ne correspond à ce tag.'
                  : 'Aucun membre dans cette organisation.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  {['Membre', 'Rôle', 'Tags', "Date d'adhésion", 'Actions'].map((col, i) => (
                    <th
                      key={col}
                      className={`px-5 py-3 text-[11px] uppercase tracking-wider text-muted-foreground font-bold ${i === 4 ? 'text-right' : 'text-left'}`}
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
                    <td className="px-5 py-4 max-w-[200px]">
                      <div className="flex flex-wrap gap-1 items-center">
                        {(member.tags ?? []).length === 0 ? (
                          <span className="text-xs text-muted-foreground italic">—</span>
                        ) : (
                          (member.tags ?? []).map((t) => (
                            <span
                              key={t.id}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                            >
                              {t.name}
                            </span>
                          ))
                        )}
                        {canManageTags === true && (
                          <button
                            type="button"
                            onClick={() => openMemberTagsModal(member)}
                            className="ml-1 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Modifier les tags"
                          >
                            <Tag className="w-3.5 h-3.5 shrink-0" />
                          </button>
                        )}
                      </div>
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

      {/* Modal — Tags du club */}
      {tagsCatalogOpen && (
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">Tags du club</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Liste des libellés du club (Débutant, Compétition, etc.). Créez-en de nouveaux puis assignez-les aux membres dans le tableau.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTagsCatalogOpen(false)
                  setTagCatalogNotice(null)
                }}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted shrink-0"
                aria-label="Fermer"
              >
                <X className="w-5 h-5 shrink-0" />
              </button>
            </div>

            {tagCatalogNotice && (
              <div
                role="status"
                className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm ${
                  tagCatalogNotice.variant === 'success'
                    ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-950 dark:text-emerald-50'
                    : 'border-destructive/35 bg-destructive/10 text-destructive'
                }`}
              >
                {tagCatalogNotice.variant === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span className="font-medium leading-snug">{tagCatalogNotice.message}</span>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Tags existants
                </h4>
                {!orgTagsLoading && (
                  <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                    {orgTags.length} tag{orgTags.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="rounded-xl border border-border bg-muted/20 min-h-[120px] max-h-52 overflow-y-auto">
                {orgTagsLoading && orgTags.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Chargement des tags…</span>
                  </div>
                ) : orgTags.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground leading-relaxed">
                    Aucun tag pour l&apos;instant. Utilisez le formulaire ci-dessous pour créer votre premier tag
                    (par ex. « Débutant »), puis validez avec <span className="font-semibold text-foreground">Ajouter</span>.
                  </p>
                ) : (
                  <ul className="divide-y divide-border p-1">
                    {orgTags.map((t) => (
                      <li
                        key={t.id}
                        className="flex items-center justify-between gap-2 py-2.5 px-3 rounded-lg hover:bg-muted/50"
                      >
                        <span className="text-sm font-medium text-foreground">{t.name}</span>
                        <button
                          type="button"
                          onClick={() => void handleDeleteOrgTag(t.id)}
                          className="text-xs font-semibold text-destructive hover:underline shrink-0"
                        >
                          Supprimer
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="border-t border-border pt-4 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nouveau tag</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Ex. Débutant, Compétition…"
                  className="flex-1 h-10 px-3 rounded-xl border border-border bg-background text-sm"
                  onKeyDown={(e) => { if (e.key === 'Enter') { void handleCreateOrgTag() } }}
                />
                <button
                  type="button"
                  onClick={() => void handleCreateOrgTag()}
                  disabled={tagCatalogLoading || !newTagName.trim()}
                  className="inline-flex items-center justify-center gap-2 min-w-[5.5rem] h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 shrink-0"
                >
                  {tagCatalogLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {tagCatalogLoading ? 'Envoi…' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Tags du membre */}
      {memberTagEdit && (
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">Tags du membre</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {memberTagEdit.firstname} {memberTagEdit.lastname}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setMemberTagEdit(null); setMemberTagNotice(null) }}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted shrink-0"
                aria-label="Fermer"
              >
                <X className="w-5 h-5 shrink-0" />
              </button>
            </div>

            {memberTagNotice && (
              <div
                role="alert"
                className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm ${
                  memberTagNotice.variant === 'success'
                    ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-950 dark:text-emerald-50'
                    : 'border-destructive/35 bg-destructive/10 text-destructive'
                }`}
              >
                {memberTagNotice.variant === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                )}
                <span className="font-medium leading-snug">{memberTagNotice.message}</span>
              </div>
            )}

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {orgTagsLoading && orgTags.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Chargement des tags du club…</span>
                </div>
              ) : orgTags.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  Créez d&apos;abord des tags via le bouton <span className="font-semibold text-foreground">Tags du club</span> sur la page Membres.
                </p>
              ) : (
                orgTags.map((t) => (
                  <label
                    key={t.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border cursor-pointer hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTagIds.includes(t.id)}
                      onChange={() => toggleMemberTag(t.id)}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-foreground">{t.name}</span>
                  </label>
                ))
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMemberTagEdit(null)}
                disabled={tagCatalogLoading}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-muted"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void saveMemberTags()}
                disabled={tagCatalogLoading || orgTags.length === 0}
                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                {tagCatalogLoading ? 'Enregistrement...' : 'Enregistrer'}
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
