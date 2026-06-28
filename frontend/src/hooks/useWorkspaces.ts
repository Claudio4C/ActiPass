import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '../lib/api'
import {
  buildWorkspacesFromMemberships,
  detectActiveWorkspaceId,
  type MyOrganisationItem,
  type Workspace,
} from '../lib/workspace'

export const useWorkspaces = () => {
  const location = useLocation()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.get<MyOrganisationItem[]>('/organisations/my', {}, { useCache: true, cacheTTL: 60000 })
      setWorkspaces(buildWorkspacesFromMemberships(data))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Impossible de charger vos espaces'
      setError(message)
      setWorkspaces(buildWorkspacesFromMemberships([]))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const refresh = () => { load() }
    window.addEventListener('organisation:updated', refresh)
    return () => window.removeEventListener('organisation:updated', refresh)
  }, [load])

  const activeWorkspaceId = useMemo(
    () => detectActiveWorkspaceId(location.pathname, workspaces),
    [location.pathname, workspaces],
  )

  const activeWorkspace = useMemo(
    () => workspaces.find(w => w.id === activeWorkspaceId) ?? null,
    [workspaces, activeWorkspaceId],
  )

  return {
    workspaces,
    activeWorkspace,
    activeWorkspaceId,
    loading,
    error,
    reload: load,
  }
}
