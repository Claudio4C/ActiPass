import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Baby, Building2, Check, ChevronDown, Home, LayoutDashboard, Loader2, Users,
} from 'lucide-react'
import { useWorkspaces } from '../../hooks/useWorkspaces'
import {
  KIND_META,
  persistWorkspaceSelection,
  type Workspace,
  type WorkspaceKind,
} from '../../lib/workspace'
import { cn } from '../../lib/utils'

const KIND_ICON: Record<WorkspaceKind, React.ComponentType<{ className?: string }>> = {
  admin: Building2,
  member: Users,
  coach: LayoutDashboard,
  family: Baby,
}

interface Props {
  className?: string
  compact?: boolean
}

const WorkspaceSwitcher: React.FC<Props> = ({ className, compact = false }) => {
  const navigate = useNavigate()
  const { workspaces, activeWorkspace, activeWorkspaceId, loading } = useWorkspaces()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const grouped = useMemo(() => {
    const orgs = workspaces.filter(w => w.orgId)
    const extras = workspaces.filter(w => !w.orgId)
    return { orgs, extras }
  }, [workspaces])

  const handleSelect = (workspace: Workspace) => {
    persistWorkspaceSelection(workspace)
    setOpen(false)
    navigate(workspace.path)
  }

  const ActiveIcon = activeWorkspace ? KIND_ICON[activeWorkspace.kind] : Home
  const triggerLabel = activeWorkspace?.label ?? 'Choisir un espace'
  const triggerSubtitle = activeWorkspace?.subtitle ?? 'Où voulez-vous aller ?'

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center gap-2 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-muted/40 transition-colors text-left max-w-[min(100vw-8rem,320px)]',
          compact ? 'px-2.5 py-1.5' : 'px-3 py-2',
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <div className={cn(
          'rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0',
          compact ? 'w-7 h-7' : 'w-8 h-8',
        )}>
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ActiveIcon className={cn('shrink-0', compact ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
          )}
        </div>
        <div className="min-w-0 flex-1 hidden sm:block">
          <p className={cn('font-semibold text-foreground truncate', compact ? 'text-xs' : 'text-sm')}>
            {triggerLabel}
          </p>
          {!compact && (
            <p className="text-[11px] text-muted-foreground truncate">{triggerSubtitle}</p>
          )}
        </div>
        <ChevronDown className={cn('text-muted-foreground shrink-0 transition-transform', open && 'rotate-180', compact ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-[min(calc(100vw-2rem),360px)] rounded-2xl border border-border bg-card shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Changer d&apos;espace
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Club, gestion, coach ou famille — en un clic.
            </p>
          </div>

          <div className="max-h-[min(60vh,420px)] overflow-y-auto py-2">
            {grouped.orgs.length > 0 && (
              <div className="px-2 pb-1">
                <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Mes organisations
                </p>
                {grouped.orgs.map(workspace => (
                  <WorkspaceRow
                    key={workspace.id}
                    workspace={workspace}
                    active={workspace.id === activeWorkspaceId}
                    onSelect={() => handleSelect(workspace)}
                  />
                ))}
              </div>
            )}

            {grouped.extras.length > 0 && (
              <div className="px-2 pt-1 border-t border-border mt-1">
                <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Autres espaces
                </p>
                {grouped.extras.map(workspace => (
                  <WorkspaceRow
                    key={workspace.id}
                    workspace={workspace}
                    active={workspace.id === activeWorkspaceId}
                    onSelect={() => handleSelect(workspace)}
                  />
                ))}
              </div>
            )}

            {!loading && workspaces.length === 0 && (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                Aucun espace disponible pour le moment.
              </p>
            )}
          </div>

          <div className="border-t border-border px-2 py-2 bg-muted/20">
            <Link
              to="/home"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Home className="w-4 h-4 text-primary shrink-0" />
              Voir tous mes espaces
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

const WorkspaceRow: React.FC<{
  workspace: Workspace
  active: boolean
  onSelect: () => void
}> = ({ workspace, active, onSelect }) => {
  const Icon = KIND_ICON[workspace.kind]
  const meta = KIND_META[workspace.kind]

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors',
        active ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted',
      )}
    >
      <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden">
        {workspace.logoUrl ? (
          <img src={workspace.logoUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <Icon className={cn('w-4 h-4', meta.accent)} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground truncate">{workspace.label}</p>
        <p className="text-[11px] text-muted-foreground truncate">{workspace.subtitle}</p>
      </div>
      {active && <Check className="w-4 h-4 text-primary shrink-0" />}
    </button>
  )
}

export default WorkspaceSwitcher
