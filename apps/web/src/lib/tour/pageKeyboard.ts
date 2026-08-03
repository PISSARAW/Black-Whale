export type TourShortcut =
  'toggle-reveal' | 'turn-technique' | 'toggle-fullscreen' | 'toggle-plan' | 'examine'

interface ShortcutState {
  takesOrders: boolean
  immersive: boolean
  nativeFullscreen: boolean
  engaged: boolean
  planOpen: boolean
  finderOpen: boolean
}

interface ShortcutActions {
  read: () => ShortcutState
  toggleReveal: () => void
  turnTechnique: () => void
  toggleFullscreen: () => void
  togglePlan: () => void
  /** Hand over the evidence for whatever is down the reticle. */
  examine: () => void
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
  // P for proof. Deliberately not E, which takes the door in front of you: the
  // one gesture must never be a near-miss of the other, and being handed a card
  // when you meant to walk through a bulkhead is exactly that.
  if (key === 'p') return 'examine'
  return null
}

export class TourKeyboardController {
  constructor(private readonly actions: ShortcutActions) {}

  onKeydown = (event: KeyboardEvent) => {
    const action = tourShortcut(event, this.actions.read())
    if (!action) return
    event.preventDefault()
    if (action === 'toggle-reveal') this.actions.toggleReveal()
    else if (action === 'turn-technique') this.actions.turnTechnique()
    else if (action === 'toggle-fullscreen') this.actions.toggleFullscreen()
    else if (action === 'examine') this.actions.examine()
    else this.actions.togglePlan()
  }
}
