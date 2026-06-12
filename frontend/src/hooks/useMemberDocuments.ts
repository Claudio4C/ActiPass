import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

export type MemberDocStatus = 'pending' | 'approved' | 'rejected'

export interface MemberDocument {
  id: string
  /** FK direct — toujours présent, plus fiable que required_document.id */
  required_document_id: string
  original_name: string
  mime_type: string
  size_bytes: number
  status: MemberDocStatus
  uploaded_at: string
  expires_at: string | null
  rejection_reason: string | null
  user?: {
    id: string
    firstname: string
    lastname: string
    email: string
    avatar_url: string | null
  }
  required_document: {
    id: string
    name: string
    category: string
    expires_after_months?: number | null
  }
}

/** Flat shape consumed by AdminDocumentsPage "À valider" tab */
export interface SubmittedDocView {
  id: string
  memberName: string
  memberInitials: string
  docType: string
  fileName: string
  sizeKo: number
  isImage: boolean
  submittedAt: string
}

const toView = (doc: MemberDocument): SubmittedDocView => ({
  id:             doc.id,
  memberName:     doc.user ? `${doc.user.firstname} ${doc.user.lastname}` : 'Inconnu',
  memberInitials: doc.user
    ? `${doc.user.firstname.charAt(0)}${doc.user.lastname.charAt(0)}`.toUpperCase()
    : '??',
  docType:     doc.required_document.name,
  fileName:    doc.original_name,
  sizeKo:      Math.round(doc.size_bytes / 1024),
  isImage:     doc.mime_type.startsWith('image/'),
  submittedAt: doc.uploaded_at,
})

export const useMemberDocuments = (
  orgId: string | undefined,
  scope: 'mine' | 'all' = 'mine',
  statusFilter?: MemberDocStatus,
) => {
  const [raw, setRaw]         = useState<MemberDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!orgId) { return }
    setLoading(true)
    setError(null)
    try {
      const url = scope === 'mine'
        ? `/organisations/${orgId}/members/me/documents`
        : `/organisations/${orgId}/documents`
      const params = scope === 'all' && statusFilter ? { status: statusFilter } : undefined
      const data = await api.get<MemberDocument[]>(url, params, { useCache: false })
      setRaw(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
      setRaw([])
    } finally {
      setLoading(false)
    }
  }, [orgId, scope, statusFilter])

  useEffect(() => { void refetch() }, [refetch])

  /** Items as raw MemberDocument (for member view) */
  const items = raw

  /** Items mapped to flat view (for admin "À valider" tab) */
  const views = raw.map(toView)

  const getSignedUrl = useCallback(async (docId: string): Promise<string> => {
    if (!orgId) { throw new Error('orgId manquant') }
    const res = await api.get<{ url: string; expiresAt: string }>(
      `/organisations/${orgId}/documents/${docId}/signed-url`,
      undefined,
      { useCache: false },
    )
    return res.url
  }, [orgId])

  const review = useCallback(async (
    docId: string,
    action: 'approve' | 'reject',
    rejectionReason?: string,
  ) => {
    if (!orgId) { return }
    await api.patch(`/organisations/${orgId}/documents/${docId}/review`, {
      action,
      ...(rejectionReason ? { rejectionReason } : {}),
    })
    api.clearCache(`/organisations/${orgId}/documents`)
    await refetch()
  }, [orgId, refetch])

  return { items, views, loading, error, refetch, getSignedUrl, review }
}
