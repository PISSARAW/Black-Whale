/** DOM event boundary for the first-person scene. */
export interface SceneInputHandlers {
  mouseDown: (event: MouseEvent) => void
  mouseMove: (event: MouseEvent) => void
  mouseUp: () => void
  touchStart: (event: TouchEvent) => void
  touchMove: (event: TouchEvent) => void
  touchEnd: (event: TouchEvent) => void
  touchCancel: (event: TouchEvent) => void
  keyDown: (event: KeyboardEvent) => void
  keyUp: (event: KeyboardEvent) => void
  pointerLockChange: () => void
}

/** Page controls keep their keys; the focusable canvas owns its walking arrows. */
export function sceneKeyIsForElsewhere(event: KeyboardEvent, canvas: EventTarget | null): boolean {
  const target = event.target
  if (target === canvas || !(target instanceof HTMLElement)) return false
  if (target.isContentEditable || target.closest('input, textarea, select') !== null) return true
  if (target.closest('a, button, [role="button"], [tabindex]') === null) return false
  return ['Space', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)
}

/** Attach all scene controls as one disposable resource. */
export function listenToSceneInput(
  canvas: HTMLCanvasElement,
  handlers: SceneInputHandlers,
): () => void {
  // Clicking a non-focusable drawing used to leave the deck selector focused,
  // so its keyboard guard swallowed movement even after entering the scene.
  const mouseDown = (event: MouseEvent) => {
    canvas.focus({ preventScroll: true })
    handlers.mouseDown(event)
  }
  const touchStart = (event: TouchEvent) => {
    canvas.focus({ preventScroll: true })
    handlers.touchStart(event)
  }
  canvas.addEventListener('mousedown', mouseDown)
  canvas.addEventListener('touchstart', touchStart, { passive: true })
  canvas.addEventListener('touchmove', handlers.touchMove, { passive: true })
  canvas.addEventListener('touchend', handlers.touchEnd)
  canvas.addEventListener('touchcancel', handlers.touchCancel)
  window.addEventListener('mousemove', handlers.mouseMove)
  window.addEventListener('mouseup', handlers.mouseUp)
  window.addEventListener('keydown', handlers.keyDown)
  window.addEventListener('keyup', handlers.keyUp)
  document.addEventListener('pointerlockchange', handlers.pointerLockChange)

  return () => {
    canvas.removeEventListener('mousedown', mouseDown)
    canvas.removeEventListener('touchstart', touchStart)
    canvas.removeEventListener('touchmove', handlers.touchMove)
    canvas.removeEventListener('touchend', handlers.touchEnd)
    canvas.removeEventListener('touchcancel', handlers.touchCancel)
    window.removeEventListener('mousemove', handlers.mouseMove)
    window.removeEventListener('mouseup', handlers.mouseUp)
    window.removeEventListener('keydown', handlers.keyDown)
    window.removeEventListener('keyup', handlers.keyUp)
    document.removeEventListener('pointerlockchange', handlers.pointerLockChange)
  }
}
