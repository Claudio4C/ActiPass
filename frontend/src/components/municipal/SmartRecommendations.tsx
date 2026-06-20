import React from 'react'
import { Link } from 'react-router-dom'
import { BarChart2, TrendingUp, Users, Wrench, Sparkles } from 'lucide-react'
import type { SmartRecommendation } from '../../types/municipal'
import { cn } from '../../lib/utils'

const TYPE_ICON = {
  underuse: BarChart2,
  overload: TrendingUp,
  inactive: Users,
  revenue: Sparkles,
  maintenance: Wrench,
}

interface Props {
  items: SmartRecommendation[]
}

const SmartRecommendations: React.FC<Props> = ({ items }) => (
  <section className="rounded-2xl border border-border bg-card shadow-sm">
    <div className="px-5 py-4 border-b border-border">
      <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
        Analyse prédictive
      </p>
      <h2 className="font-display text-lg font-bold text-foreground">Recommandations</h2>
    </div>
    <div className="p-4 grid gap-3 sm:grid-cols-2">
      {items.map(item => {
        const Icon = TYPE_ICON[item.type]
        const card = (
          <div
            className={cn(
              'rounded-xl border border-border p-4 h-full transition-colors',
              item.href && 'hover:border-primary/30 hover:bg-muted/30 cursor-pointer',
            )}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.description}</p>
                {item.impact && (
                  <p className="text-xs font-semibold text-emerald-700 mt-2">{item.impact}</p>
                )}
              </div>
            </div>
          </div>
        )
        return item.href ? (
          <Link key={item.id} to={item.href}>{card}</Link>
        ) : (
          <div key={item.id}>{card}</div>
        )
      })}
    </div>
  </section>
)

export default SmartRecommendations
