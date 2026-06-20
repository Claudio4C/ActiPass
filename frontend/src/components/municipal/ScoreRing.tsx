import React from 'react'
import { cn } from '../../lib/utils'

interface Props {
  score: number
  label?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function scoreColor(score: number): string {
  if (score >= 85) return 'text-emerald-600'
  if (score >= 70) return 'text-amber-600'
  return 'text-destructive'
}

function ringColor(score: number): string {
  if (score >= 85) return 'stroke-emerald-500'
  if (score >= 70) return 'stroke-amber-500'
  return 'stroke-destructive'
}

const SIZES = { sm: 56, md: 80, lg: 112 }
const STROKES = { sm: 5, md: 6, lg: 8 }

const ScoreRing: React.FC<Props> = ({ score, label, size = 'md', className }) => {
  const dim = SIZES[size]
  const stroke = STROKES[size]
  const radius = (dim - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="-rotate-90">
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-muted/60"
          />
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn('transition-all duration-700', ringColor(score))}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-display font-bold', scoreColor(score), size === 'sm' ? 'text-sm' : size === 'md' ? 'text-xl' : 'text-3xl')}>
            {score}
          </span>
          {size !== 'sm' && <span className="text-[9px] text-muted-foreground font-medium">/100</span>}
        </div>
      </div>
      {label && <p className="text-xs font-medium text-muted-foreground text-center">{label}</p>}
    </div>
  )
}

export default ScoreRing
