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

/** Attach all scene controls as one disposable resource. */
export function listenToSceneInput(
  canvas: HTMLCanvasElement,
  handlers: SceneInputHandlers,
): () => void {
  canvas.addEventListener('mousedown', handlers.mouseDown)
  canvas.addEventListener('touchstart', handlers.touchStart, { passive: true })
  canvas.addEventListener('touchmove', handlers.touchMove, { passive: true })
  canvas.addEventListener('touchend', handlers.touchEnd)
  canvas.addEventListener('touchcancel', handlers.touchCancel)
  window.addEventListener('mousemove', handlers.mouseMove)
  window.addEventListener('mouseup', handlers.mouseUp)
  window.addEventListener('keydown', handlers.keyDown)
  window.addEventListener('keyup', handlers.keyUp)
  document.addEventListener('pointerlockchange', handlers.pointerLockChange)

  return () => {
    canvas.removeEventListener('mousedown', handlers.mouseDown)
    canvas.removeEventListener('touchstart', handlers.touchStart)
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
