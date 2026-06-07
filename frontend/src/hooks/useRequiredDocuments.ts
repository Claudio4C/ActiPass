import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

export type DocCategory = 'identity' | 'medical' | 'administrative' | 'other'

export interface RequiredDocument {
  id: string
  name: string
  description: string | null
  required: boolean
  category: DocCategory
  expires_after_months: number | null
  created_at: string
}

export const useRequiredDocuments = (orgId: string | undefined) => {
  const [items, setItems]     = useState<RequiredDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!orgId) { return }
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<RequiredDocument[]>(
        `/organisations/${orgId}/required-documents`,
        undefined,
        { useCache: false },
      )
      setItems(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => { void refetch() }, [refetch])

  const create = useCallback(async (payload: {
    name: string
    description?: string
    required?: boolean
    category?: DocCategory
    expiresAfterMonths?: number
  }) => {
    if (!orgId) { return }
    await api.post(`/organisations/${orgId}/required-documents`, payload)
    api.clearCache(`/organisations/${orgId}/required-documents`)
    await refetch()
  }, [orgId, refetch])

  const update = useCallback(async (id: string, patch: Partial<{
    name: string
    description: string
    required: boolean
    category: DocCategory
    expiresAfterMonths: number
  }>) => {
    if (!orgId) { return }
    await api.patch(`/organisations/${orgId}/required-documents/${id}`, patch)
    api.clearCache(`/organisations/${orgId}/required-documents`)
    await refetch()
  }, [orgId, refetch])

  const remove = useCallback(async (id: string) => {
    if (!orgId) { return }
    await api.delete(`/organisations/${orgId}/required-documents/${id}`)
    api.clearCache(`/organisations/${orgId}/required-documents`)
    await refetch()
  }, [orgId, refetch])

  const seedDefaults = useCallback(async (): Promise<{ created: number }> => {
    if (!orgId) { return { created: 0 } }
    const res = await api.post<{ created: number }>(
      `/organisations/${orgId}/required-documents/seed-defaults`,
      {},
    )
    api.clearCache(`/organisations/${orgId}/required-documents`)
    await refetch()
    return res
  }, [orgId, refetch])

  return { items, loading, error, refetch, create, update, remove, seedDefaults }
}
