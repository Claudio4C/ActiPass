import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

export interface MembershipRequest {
  id: string
  status: 'pending' | 'active' | 'banned'
  docs_status: 'missing' | 'in_review' | 'validated'
  payment_status: 'not_paid' | 'pending' | 'paid' | 'overdue'
  is_paid: boolean
  validated: boolean
  joined_at: string
  created_at: string
  updated_at?: string
  comment?: string | null
  user: {
    id: string
    firstname: string
    lastname: string
    email: string
    phone?: string | null
    birthdate?: string | null
    avatar_url?: string | null
  }
  role: {
    id: string
    name: string
    type: string
  }
}

export const useMemberships = (orgId: string | undefined) => {
  const [pending, setPending] = useState<MembershipRequest[]>([])
  const [recent, setRecent] = useState<MembershipRequest[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!orgId) { return }
    setLoading(true)
    try {
      const [pendingData, recentData] = await Promise.all([
        api.get<MembershipRequest[]>(`/organisations/${orgId}/memberships`, { status: 'pending' }, { useCache: false }),
        api.get<MembershipRequest[]>(`/organisations/${orgId}/memberships`, {}, { useCache: false }),
      ])
      setPending(pendingData ?? [])
      setRecent(recentData ?? [])
    } catch {
      setPending([])
      setRecent([])
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => { load() }, [load])

  const decide = useCallback(async (id: string, action: 'approve' | 'reject', reason?: string) => {
    if (!orgId) { return }
    await api.patch(`/organisations/${orgId}/memberships/${id}`, { action, reason })
    // Invalider le cache membres pour que la liste se rafraîchisse sans reload
    api.clearCache(`/organisations/${orgId}/members`)
    api.clearCache(`/organisations/${orgId}/memberships`)
    await load()
  }, [orgId, load])

  const bulkApprove = useCallback(async (ids: string[]) => {
    if (!orgId) { return }
    await api.patch(`/organisations/${orgId}/memberships/bulk-approve`, { ids })
    api.clearCache(`/organisations/${orgId}/members`)
    api.clearCache(`/organisations/${orgId}/memberships`)
    await load()
  }, [orgId, load])

  return { pending, recent, decide, bulkApprove, loading }
}
