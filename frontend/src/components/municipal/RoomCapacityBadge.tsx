import React from 'react'
import { Users } from 'lucide-react'
import { cn } from '../../lib/utils'

interface Props {
  capacity: number
  size?: 'sm' | 'md'
  className?: string
}

/** Badge « capacité maximale » pour une salle. */
const RoomCapacityBadge: React.FC<Props> = ({ capacity, size = 'sm', className }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 font-bold rounded-full border shrink-0',
      'bg-primary/10 text-primary border-primary/25',
      size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
      className,
    )}
    title={`Capacité maximale : ${capacity} personnes`}
  >
    <Users className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
    Max {capacity} pers.
  </span>
)

export function formatRoomCapacity(capacity: number): string {
  return `${capacity} pers. max`
}

export default RoomCapacityBadge
