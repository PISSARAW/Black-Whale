interface ArenaKeyboardOptions {
  blocked: () => boolean
  panelOpen: () => boolean
  closePanel: () => void
  toggleManual: () => void
  start: () => void
  finished: () => boolean
  nenKey: (code: string) => boolean
  movementKey: (code: string) => boolean
  light: () => void
  heavy: () => void
  special: () => void
  guard: () => void
  feint: () => void
  evade: (side: -1 | 1) => void
}

export function handleArenaKey(event: KeyboardEvent, options: ArenaKeyboardOptions): void {
  if (modified(event)) return
  const global = globalAction(event, options)
  if (global) return handled(event, global)
  if (options.blocked() || options.nenKey(event.code)) return
  if (options.movementKey(event.code)) return options.start()
  if (inactive(event, options)) return

  const action = keyAction(event.code, options)
  if (action) handled(event, action)
}

function modified(event: KeyboardEvent): boolean {
  return event.metaKey || event.ctrlKey
}

function globalAction(event: KeyboardEvent, options: ArenaKeyboardOptions): (() => void) | null {
  if (event.key === 'Escape' && options.panelOpen()) return options.closePanel
  return event.key === '?' ? options.toggleManual : null
}

function inactive(event: KeyboardEvent, options: ArenaKeyboardOptions): boolean {
  return event.repeat || options.finished()
}

function keyAction(code: string, options: ArenaKeyboardOptions): (() => void) | null {
  if (code === 'Space') return options.light
  if (code === 'KeyX') return options.heavy
  if (code === 'KeyC') return options.special
  if (code === 'ShiftLeft' || code === 'ShiftRight') return options.guard
  if (code === 'KeyV') return options.feint
  if (code === 'KeyJ') return () => options.evade(-1)
  if (code === 'KeyL') return () => options.evade(1)
  return null
}

function handled(event: KeyboardEvent, action: () => void): void {
  action()
  event.preventDefault()
}
