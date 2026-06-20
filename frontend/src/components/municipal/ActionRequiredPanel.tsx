import React from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, AlertTriangle, Sparkles, ChevronRight } from 'lucide-react'
import type { RequiredAction, ActionPriority } from '../../types/municipal'
import { cn } from '../../lib/utils'

const PRIORITY_CONFIG: Record<ActionPriority, {
  icon: typeof AlertCircle
  dot: string
  border: string
  bg: string
}> = {
  critical: {
    icon: AlertCircle,
    dot: 'bg-destructive',
    border: 'border-destructive/25',
    bg: 'bg-destructive/[0.04]',
  },
  warning: {
    icon: AlertTriangle,
    dot: 'bg-amber-500',
    border: 'border-amber-500/25',
    bg: 'bg-amber-500/[0.04]',
  },
  opportunity: {
    icon: Sparkles,
    dot: 'bg-emerald-500',
    border: 'border-emerald-500/25',
    bg: 'bg-emerald-500/[0.04]',
  },
}

interface Props {
  actions: RequiredAction[]
  maxItems?: number
}

const ActionRequiredPanel: React.FC<Props> = ({ actions, maxItems = 6 }) => {
  const visible = actions.slice(0, maxItems)

  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
            Priorité
          </p>
          <h2 className="font-display text-lg font-bold text-foreground">Actions requises</h2>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-destructive/10 text-destructive">
          {actions.filter(a => a.priority === 'critical').length} urgentes
        </span>
      </div>

      <ul className="divide-y divide-border">
        {visible.map(action => {
          const cfg = PRIORITY_CONFIG[action.priority]
          const Icon = cfg.icon
          const content = (
            <div
              className={cn(
                'flex items-start gap-3 px-5 py-4 transition-colors',
                action.href && 'hover:bg-muted/40',
                cfg.bg,
              )}
            >
              <span className={cn('w-2 h-2 rounded-full mt-2 shrink-0', cfg.dot)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground leading-snug">{action.title}</p>
                  {action.dueLabel && (
                    <span className={cn('text-[10px] font-bold uppercase px-2 py-0.5 rounded-md shrink-0 border', cfg.border)}>
                      {action.dueLabel}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{action.description}</p>
              </div>
              <Icon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              {action.href && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />}
            </div>
          )

          return (
            <li key={action.id}>
              {action.href ? <Link to={action.href}>{content}</Link> : content}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default ActionRequiredPanel
