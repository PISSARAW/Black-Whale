export type TourShortcut = 'toggle-reveal' | 'toggle-fullscreen' | 'toggle-plan' | 'examine'

interface ShortcutState {
  immersive: boolean
  nativeFullscreen: boolean
  engaged: boolean
  planOpen: boolean
  finderOpen: boolean
}

interface ShortcutActions {
  read: () => ShortcutState
  toggleReveal: () => void
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
  // L lifts the veil. Deliberately not G: G is Gyo, and this listener and the
  // walk's both sit on `window`, so a shared letter is not a choice between
  // two meanings — it is both of them at once, every press.
  if (key === 'l') return 'toggle-reveal'
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
    else if (action === 'toggle-fullscreen') this.actions.toggleFullscreen()
    else if (action === 'examine') this.actions.examine()
    else this.actions.togglePlan()
  }
}
