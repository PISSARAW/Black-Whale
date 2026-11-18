import type { createVictoryPlayback, VictoryFrame } from './playback'

export function mountVictoryClock(options: {
  playback: ReturnType<typeof createVictoryPlayback>
  paused: () => boolean
}) {
  let current: VictoryFrame | null = null,
    last = performance.now(),
    request = 0
  let hidden = document.hidden,
    held = false
  const unsubscribe = options.playback.subscribe((value) => {
    current = value
  })
  const visibility = () => {
    hidden = document.hidden
    last = performance.now()
  }
  const key = (event: KeyboardEvent) => {
    if (!current?.active || options.paused() || event.repeat) return
    const element = event.target as HTMLElement | null
    const background = !element?.closest('input, textarea, select, button, [contenteditable=true]')
    if (event.key !== 'Escape' && !(background && ['Enter', ' '].includes(event.key))) return
    event.preventDefault()
    event.stopPropagation()
    options.playback.skip()
  }
  const tick = (now: number) => {
    options.playback.advance(Math.min(0.1, Math.max(0, (now - last) / 1000)), hidden || options.paused())
    last = now
    const pressed = Boolean(navigator.getGamepads?.()[0]?.buttons[0]?.pressed)
    if (current?.active && pressed && !held && !options.paused()) options.playback.skip()
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
