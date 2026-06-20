import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Loader2 } from 'lucide-react'

import { useUnreadCount } from '../../hooks/useUnreadCount'
import { api } from '../../lib/api'
import {
  fmtRelativeDate,
  getNotificationIcon,
  getNotificationIconClass,
  type AppNotification,
} from '../../lib/notifications'

const NotificationBell: React.FC = () => {
  const { count, refresh } = useUnreadCount()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<AppNotification[]>([])
  const ref = useRef<HTMLDivElement | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) { return }
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false) }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleToggle = async () => {
    const next = !open
    setOpen(next)
    if (next) {
      setLoading(true)
      try {
        const data = await api.get<AppNotification[]>('/notifications', { limit: 5 }, { useCache: false })
        setItems(data)
      } catch {
        setItems([])
      } finally {
        setLoading(false)
      }
    }
  }

  const handleClickNotification = async (notif: AppNotification) => {
    setOpen(false)
    if (!notif.read) {
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
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors active:scale-95"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 shrink-0" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-2xl border border-border bg-card shadow-xl overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Aucune notification pour le moment
              </p>
            ) : (
              items.map((notif) => {
                const Icon = getNotificationIcon(notif.type)
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleClickNotification(notif)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted transition-colors ${
                      notif.read ? '' : 'bg-primary/5'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${getNotificationIconClass(notif.type)}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{notif.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.body}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{fmtRelativeDate(notif.created_at)}</p>
                    </div>
                    {!notif.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />}
                  </button>
                )
              })
            )}
          </div>
          <button
            onClick={() => {
              setOpen(false)
              navigate('/notifications')
            }}
            className="w-full py-2.5 text-center text-sm font-semibold text-primary hover:bg-muted transition-colors border-t border-border"
          >
            Voir tout
          </button>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
