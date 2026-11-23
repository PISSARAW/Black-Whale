interface ArenaKeyboardOptions {
  blocked: () => boolean
  panelOpen: () => boolean
  closePanel: () => void
  toggleManual: () => void
  start: () => void
  nenKey: (code: string) => boolean
  movementKey: (code: string) => boolean
}

export function handleArenaKey(event: KeyboardEvent, options: ArenaKeyboardOptions): void {
  if (modified(event)) return
  const global = globalAction(event, options)
  if (global) return handled(event, global)
  if (options.blocked() || options.nenKey(event.code)) return
  if (options.movementKey(event.code)) return options.start()
}

function modified(event: KeyboardEvent): boolean {
  return event.metaKey || event.ctrlKey
}

function globalAction(event: KeyboardEvent, options: ArenaKeyboardOptions): (() => void) | null {
  if (event.key === 'Escape' && options.panelOpen()) return options.closePanel
  return event.key === '?' ? options.toggleManual : null
}

function handled(event: KeyboardEvent, action: () => void): void {
  action()
  event.preventDefault()
}
