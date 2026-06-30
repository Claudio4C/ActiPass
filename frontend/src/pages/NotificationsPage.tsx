import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, BellRing, X } from 'lucide-react'

import { useUnreadCount } from '../hooks/useUnreadCount'
import { api } from '../lib/api'
import { isPushSupportedAndConfigured, requestPushPermission, listenForegroundMessages } from '../lib/firebase'
import { cn } from '../lib/utils'
import {
  fmtRelativeDate,
  getNotificationIcon,
  getNotificationIconClass,
  type AppNotification,
} from '../lib/notifications'

type Filter = 'all' | 'unread'

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate()
  const { count, refresh } = useUnreadCount()
  const [filter, setFilter] = useState<Filter>('all')
  const [pushStatus, setPushStatus] = useState<'idle' | 'loading' | 'granted' | 'denied'>(() =>
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
      ? 'granted'
      : 'idle',
  )
  const [items, setItems] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (f: Filter) => {
    setLoading(true)
    try {
      const data = await api.get<AppNotification[]>(
        '/notifications',
        f === 'unread' ? { unread_only: 'true' } : undefined,
        { useCache: false },
      )
      setItems(data)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load(filter) }, [filter, load])

  const handleMarkAllRead = async () => {
    await api.post('/notifications/read-all')
    void refresh()
    void load(filter)
  }

  const handleClearAll = async () => {
    if (!window.confirm('Effacer toutes les notifications ?')) { return }
    await api.delete('/notifications')
    void refresh()
    void load(filter)
  }

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id))
    try {
      await api.delete(`/notifications/${id}`)
      void refresh()
    } catch {
      void load(filter)
    }
  }

  const handleEnablePush = async () => {
    setPushStatus('loading')
    const ok = await requestPushPermission()
    if (ok) { listenForegroundMessages() }
    setPushStatus(ok ? 'granted' : 'denied')
  }

  const handleClick = async (notif: AppNotification) => {
    if (!notif.read) {
      setItems((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)))
      try {
        await api.patch(`/notifications/${notif.id}/read`)
        void refresh()
      } catch {
        // ignore
      }
    }
    if (notif.link) { navigate(notif.link) }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Notifications</h1>
        <div className="flex items-center gap-2">
          {count > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Tout marquer comme lu
            </button>
          )}
          {items.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-sm font-medium text-destructive hover:text-destructive/80 transition-colors"
            >
              Tout effacer
            </button>
          )}
        </div>
      </div>

      {isPushSupportedAndConfigured() && pushStatus !== 'granted' && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-primary/20 bg-primary/5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <BellRing className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Activer les notifications push</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Recevez une alerte instantanée même quand l'app est fermée.
            </p>
          </div>
          <button
            onClick={handleEnablePush}
            disabled={pushStatus === 'loading'}
            className="shrink-0 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
          >
            {pushStatus === 'loading' ? 'Activation…' : pushStatus === 'denied' ? 'Réessayer' : 'Activer'}
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        {(['all', 'unread'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-semibold transition-colors',
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground',
            )}
          >
            {f === 'all' ? 'Toutes' : 'Non lues'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-border rounded-3xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Bell className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Aucune notification pour le moment</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((notif) => {
            const Icon = getNotificationIcon(notif.type)
            return (
              <div
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={cn(
                  'flex items-start gap-3 p-4 rounded-2xl border transition-colors cursor-pointer',
                  notif.read ? 'bg-card border-border' : 'bg-primary/5 border-primary/20',
                )}
              >
                <div
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                    getNotificationIconClass(notif.type),
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{notif.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{notif.body}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{fmtRelativeDate(notif.created_at)}</p>
                </div>
                {!notif.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    void handleDelete(notif.id)
                  }}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default NotificationsPage
