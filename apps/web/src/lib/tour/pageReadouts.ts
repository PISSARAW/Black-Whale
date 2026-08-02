interface Evidence {
  name: string
  badge: string
  badgeClass: string
  source: string
}

export function locationReadout(options: {
  muted: boolean
  level: string
  outside: string
  room: Evidence | null
  copy: { active: boolean; badge: string; badgeClass: string; source: string }
}) {
  if (options.muted) return null
  const evidence = options.room
  return {
    level: options.level,
    room: evidence?.name ?? options.outside,
    badge: evidence ? (options.copy.active ? options.copy.badge : evidence.badge) : null,
    badgeClass: evidence
      ? options.copy.active
        ? options.copy.badgeClass
        : evidence.badgeClass
      : '',
    source: evidence ? (options.copy.active ? options.copy.source : evidence.source) : null,
  }
}

export function aimReadout(options: {
  muted: boolean
  color: string | null
  text: string
  evidence: Omit<Evidence, 'name'> | null
}) {
  if (options.muted || !options.color) return null
  return {
    color: options.color,
    text: options.text,
    badge: options.evidence?.badge ?? null,
    badgeClass: options.evidence?.badgeClass ?? '',
    source: options.evidence?.source ?? null,
  }
}

export function controlReadouts<T>(options: {
  hidden: boolean
  controls: readonly T[]
  keyOf: (control: T) => string
  actionOf: (control: T) => string
  color: string | null
}) {
  if (options.hidden) return []
  return options.controls.map((control) => ({
    key: options.keyOf(control),
    action: options.actionOf(control),
    color: options.color,
  }))
}

export const statusReadout = (options: {
  engaged: boolean
  touch: boolean
  engagedText: string
  touchText: string
  enterText: string
}) => options.engaged ? options.engagedText : options.touch ? options.touchText : options.enterText
