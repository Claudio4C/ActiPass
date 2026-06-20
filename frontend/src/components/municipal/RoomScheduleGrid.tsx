import React, { useMemo } from 'react'
import { Repeat } from 'lucide-react'
import {
  WEEKDAYS, SCHEDULE_HOUR_START, SCHEDULE_HOUR_END,
  parseTimeToMinutes, type TimeSlotAssignment, type Weekday,
} from '../../data/municipal/mockData'
import { cn } from '../../lib/utils'

const SPORT_STYLES: Record<string, string> = {
  Judo: 'bg-blue-500/20 border-blue-500/35 text-blue-950 dark:text-blue-100',
  Karaté: 'bg-violet-500/20 border-violet-500/35 text-violet-950 dark:text-violet-100',
  Basketball: 'bg-orange-500/20 border-orange-500/35 text-orange-950 dark:text-orange-100',
  Gymnastique: 'bg-pink-500/20 border-pink-500/35 text-pink-950 dark:text-pink-100',
  Danse: 'bg-fuchsia-500/20 border-fuchsia-500/35 text-fuchsia-950 dark:text-fuchsia-100',
  Tennis: 'bg-emerald-500/20 border-emerald-500/35 text-emerald-950 dark:text-emerald-100',
}

const DEFAULT_STYLE = 'bg-primary/15 border-primary/30 text-foreground'

const TOTAL_MINUTES = (SCHEDULE_HOUR_END - SCHEDULE_HOUR_START) * 60
const GRID_HEIGHT = 480

function slotPosition(start: string, end: string) {
  const startMin = parseTimeToMinutes(start) - SCHEDULE_HOUR_START * 60
  const endMin = parseTimeToMinutes(end) - SCHEDULE_HOUR_START * 60
  const top = Math.max(0, (startMin / TOTAL_MINUTES) * 100)
  const height = Math.min(100 - top, ((endMin - startMin) / TOTAL_MINUTES) * 100)
  return { top, height: Math.max(height, 4) }
}

interface Props {
  slots: TimeSlotAssignment[]
  compact?: boolean
  showTimeAxis?: boolean
}

const RoomScheduleGrid: React.FC<Props> = ({ slots, compact = false, showTimeAxis = true }) => {
  const slotsByDay = useMemo(() => {
    const map = new Map<Weekday, TimeSlotAssignment[]>()
    for (const day of WEEKDAYS) map.set(day, [])
    for (const slot of slots) {
      map.get(slot.day)?.push(slot)
    }
    for (const day of WEEKDAYS) {
      map.get(day)?.sort((a, b) => parseTimeToMinutes(a.start) - parseTimeToMinutes(b.start))
    }
    return map
  }, [slots])

  const hourLabels = useMemo(() => {
    const labels: string[] = []
    for (let h = SCHEDULE_HOUR_START; h <= SCHEDULE_HOUR_END; h++) {
      labels.push(`${String(h).padStart(2, '0')}h`)
    }
    return labels
  }, [])

  const gridH = compact ? 320 : GRID_HEIGHT

  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <div className={cn('flex gap-2 min-w-[640px]', showTimeAxis && 'pl-10')}>
        {showTimeAxis && (
          <div className="relative shrink-0 w-8 -ml-10" style={{ height: gridH }}>
            {hourLabels.map((label, i) => (
              <span
                key={label}
                className="absolute right-0 text-[9px] text-muted-foreground font-medium -translate-y-1/2 tabular-nums"
                style={{ top: `${(i / (hourLabels.length - 1)) * 100}%` }}
              >
                {label}
              </span>
            ))}
          </div>
        )}

        <div className="grid grid-cols-7 gap-1.5 flex-1">
          {WEEKDAYS.map(day => {
            const daySlots = slotsByDay.get(day) ?? []
            const isWeekend = day === 'Samedi' || day === 'Dimanche'
            return (
              <div key={day} className="min-w-0">
                <p className={cn(
                  'text-center text-[10px] font-bold uppercase tracking-wide mb-1.5 truncate',
                  isWeekend ? 'text-muted-foreground' : 'text-foreground',
                )}>
                  {compact ? day.slice(0, 3) : day}
                </p>
                <div
                  className="relative rounded-xl border border-border bg-muted/25 overflow-hidden"
                  style={{ height: gridH }}
                >
                  {hourLabels.map((_, i) => (
                    <div
                      key={i}
                      className="absolute left-0 right-0 border-t border-border/50"
                      style={{ top: `${(i / (hourLabels.length - 1)) * 100}%` }}
                    />
                  ))}

                  {daySlots.length === 0 && (
                    <p className="absolute inset-0 flex items-center justify-center text-[9px] text-muted-foreground/60 px-1 text-center">
                      Libre
                    </p>
                  )}

                  {daySlots.map(slot => {
                    const { top, height } = slotPosition(slot.start, slot.end)
                    const style = SPORT_STYLES[slot.sport] ?? DEFAULT_STYLE
                    return (
                      <div
                        key={slot.id}
                        className={cn(
                          'absolute left-0.5 right-0.5 rounded-md border px-1 py-0.5 overflow-hidden',
                          style,
                        )}
                        style={{ top: `${top}%`, height: `${height}%`, minHeight: compact ? 28 : 36 }}
                        title={`${slot.clubName} · ${slot.start}–${slot.end}`}
                      >
                        <p className={cn('font-semibold leading-tight truncate', compact ? 'text-[8px]' : 'text-[9px]')}>
                          {slot.clubName}
                        </p>
                        {!compact && (
                          <p className="text-[8px] opacity-80 tabular-nums mt-0.5">
                            {slot.start}–{slot.end}
                          </p>
                        )}
                        {slot.recurring && !compact && height > 8 && (
                          <Repeat className="w-2.5 h-2.5 absolute top-1 right-1 opacity-50" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default RoomScheduleGrid
