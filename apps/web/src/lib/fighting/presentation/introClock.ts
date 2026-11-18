import type { IntroFrame, IntroPlayback } from './introPlayback'

export function mountIntroClock(options: { playback: IntroPlayback; paused: () => boolean }) {
  let frame: IntroFrame | null = null
  let last = performance.now()
  let request = 0
  let held = true
  const unsubscribe = options.playback.subscribe((value) => (frame = value))
  const visibility = () => (last = performance.now())
  const key = (event: KeyboardEvent) => {
    if (!frame || document.hidden || options.paused() || event.repeat) return
    if (!['Enter', ' '].includes(event.key)) return
    const target = event.target as HTMLElement | null
    if (target?.closest('input, textarea, select, button, [contenteditable=true]')) return
    event.preventDefault()
    event.stopImmediatePropagation()
    options.playback.skip()
  }
  const tick = (now: number) => {
    const blocked = document.hidden || options.paused()
    options.playback.advance(Math.min(0.1, (now - last) / 1000), blocked)
    last = now
    const pressed = Array.from(navigator.getGamepads?.() ?? []).some(
      (pad) => pad?.buttons[0]?.pressed,
    )
    if (frame && pressed && !held && !blocked) options.playback.skip()
    held = pressed
    request = requestAnimationFrame(tick)
  }
  document.addEventListener('visibilitychange', visibility)
  window.addEventListener('keydown', key, true)
  request = requestAnimationFrame(tick)
  return () => {
    cancelAnimationFrame(request)
    unsubscribe()
    document.removeEventListener('visibilitychange', visibility)
    window.removeEventListener('keydown', key, true)
  }
}
