import type { UrgencyLevel } from '../../utils/urgency'
import { urgencyClassName } from '../../utils/urgency'

type UrgencyIndicatorProps = {
  animate?: boolean
  compact?: boolean
  icon?: string
  label: string
  level: UrgencyLevel
}

function UrgencyIndicator({
  animate = false,
  compact = false,
  icon = '!',
  label,
  level,
}: UrgencyIndicatorProps) {
  return (
    <span
      className={`${urgencyClassName({ level, animate })} urgency-indicator${compact ? ' compact' : ''}`}
      aria-label={label}
    >
      <span className="urgency-icon" aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </span>
  )
}

export default UrgencyIndicator
