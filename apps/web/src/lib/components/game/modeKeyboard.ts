function nativeControlOwnsKey(event: KeyboardEvent): boolean {
  const target = event.target
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable || target.closest('input, select, textarea, [role="textbox"]'))
    return true
  // Keep native activation when the player has tabbed to a control.
  return (
    ['Enter', 'Space', 'ArrowLeft', 'ArrowRight'].includes(event.code) &&
    !!target.closest('button, a, summary, [role="button"], [role="tab"]')
  )
}

function shiftedShortcut(code: string): string | null {
  return code === 'Enter' ? 'Shift+Enter' : null
}

export function modeShortcut(event: KeyboardEvent): string | null {
  if (event.defaultPrevented || event.repeat || event.altKey || event.ctrlKey || event.metaKey)
    return null

  if (nativeControlOwnsKey(event) && event.key !== 'Escape') return null
  if (event.key === '?') return '?'
  if (event.shiftKey) return shiftedShortcut(event.code)
  return event.code
}

export function runModeCommand(event: KeyboardEvent, command: () => void): void {
  event.preventDefault()
  command()
}

/** Use physical number keys so action slots also work on an AZERTY keyboard. */
export function modeNumberSlot(code: string | null): number {
  return code && /^Digit[1-9]$/.test(code) ? Number(code.slice(-1)) - 1 : -1
}
