import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

export interface ComplianceRow {
  userId: string
  displayName: string
  avatarUrl: string | null
  ok: boolean
  approved: string[]
  missing: string[]
  expired: string[]
  pending: string[]
  rejected: string[]
}

/** Flat shape consumed by AdminDocumentsPage "Conformité" tab */
export interface ComplianceMemberView {
  id: string
  name: string
  initials: string
  documents: { type: string; status: 'validated' | 'pending' | 'missing' | 'rejected' | 'expired' }[]
}

export interface ComplianceStats {
  total: number
  compliant: number
  pending: number
  incomplete: number
}

const toInitials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('')

const toView = (row: ComplianceRow): ComplianceMemberView => {
  const documents = [
    ...row.approved.map((type) => ({ type, status: 'validated' as const })),
    ...row.pending.map((type) => ({ type, status: 'pending' as const })),
    ...row.missing.map((type) => ({ type, status: 'missing' as const })),
    ...row.rejected.map((type) => ({ type, status: 'rejected' as const })),
    ...row.expired.map((type) => ({ type, status: 'expired' as const })),
  ].sort((a, b) => a.type.localeCompare(b.type, 'fr'))

  return {
    id:         row.userId,
    name:       row.displayName,
    initials:   toInitials(row.displayName),
    documents,
  }
}

export const useClubCompliance = (orgId: string | undefined) => {
  const [rows, setRows]         = useState<ComplianceRow[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!orgId) { return }
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<ComplianceRow[]>(
        `/organisations/${orgId}/compliance`,
        undefined,
        { useCache: false },
      )
      setRows(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => { void refetch() }, [refetch])

  const views: ComplianceMemberView[] = rows.map(toView)

  const stats: ComplianceStats = {
    total:      rows.length,
    compliant:  rows.filter((r) => r.ok).length,
    pending:    rows.filter((r) => r.pending.length > 0).length,
    incomplete: rows.filter((r) => r.missing.length > 0 || r.expired.length > 0 || r.rejected.length > 0).length,
  }

  return { rows, views, stats, loading, error, refetch }
}
