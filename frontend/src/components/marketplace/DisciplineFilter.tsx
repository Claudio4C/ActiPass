import React from 'react'
import { cn } from '../../lib/utils'

interface Props {
  options: readonly string[]
  value: string
  onChange: (value: string) => void
}

const DisciplineFilter: React.FC<Props> = ({ options, value, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {options.map(option => (
      <button
        key={option}
        type="button"
        onClick={() => onChange(option)}
        className={cn(
          'px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
          value === option
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-card text-muted-foreground border-border hover:border-primary/40',
        )}
      >
        {option}
      </button>
    ))}
  </div>
)

export default DisciplineFilter
