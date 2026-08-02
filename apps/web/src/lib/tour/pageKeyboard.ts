export type TourShortcut = 'toggle-reveal' | 'turn-technique' | 'toggle-fullscreen' | 'toggle-plan'

interface ShortcutState {
  takesOrders: boolean
  immersive: boolean
  nativeFullscreen: boolean
  engaged: boolean
  planOpen: boolean
  finderOpen: boolean
}

const isEditable = (target: EventTarget | null): boolean =>
  typeof HTMLElement !== 'undefined' &&
  target instanceof HTMLElement &&
  (target.isContentEditable || target.closest('input, textarea, select') !== null)

const escapeIsAvailable = (state: ShortcutState): boolean =>
  state.immersive &&
  !state.nativeFullscreen &&
  !state.engaged &&
  !state.planOpen &&
  !state.finderOpen

export function tourShortcut(event: KeyboardEvent, state: ShortcutState): TourShortcut | null {
  if (event.metaKey || event.ctrlKey || event.altKey || isEditable(event.target)) return null
  const key = event.key.toLowerCase()
  if (key === 'g') return 'toggle-reveal'
  if (key === 'r') return state.takesOrders ? 'turn-technique' : null
  if (key === 'v') return 'toggle-fullscreen'
  if (key === 'escape') return escapeIsAvailable(state) ? 'toggle-fullscreen' : null
  if (key === 'm') return 'toggle-plan'
  return null
}
