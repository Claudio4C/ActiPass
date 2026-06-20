import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'

const POLL_INTERVAL_MS = 20000

export const useUnreadCount = () => {
  const { user } = useAuth()
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    if (!user) { return }
    try {
      const data = await api.get<{ count: number }>('/notifications/unread-count', undefined, {
        useCache: false,
      })
      setCount(data.count)
    } catch {
      // silently ignore — polling will retry
    }
  }, [user])

  useEffect(() => {
    if (!user) { return }
    void refresh()
    const interval = setInterval(refresh, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [user, refresh])

  return { count, refresh }
}
