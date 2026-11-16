import type { FightControls } from './fightingControls'

export function listenFightEvents(options: {
  controls: FightControls
  handleKey: (event: KeyboardEvent, active: boolean) => void
  release: () => void
  hidden: () => void
}) {
  const down = (event: KeyboardEvent) => options.controls.key(event, true, options.handleKey)
  const up = (event: KeyboardEvent) => options.controls.key(event, false, options.handleKey)
  const visibility = () => {
    if (document.hidden) options.hidden()
    options.release()
  }
  window.addEventListener('keydown', down)
  window.addEventListener('keyup', up)
  window.addEventListener('blur', options.release)
  document.addEventListener('visibilitychange', visibility)
  return () => {
    window.removeEventListener('keydown', down)
    window.removeEventListener('keyup', up)
    window.removeEventListener('blur', options.release)
    document.removeEventListener('visibilitychange', visibility)
  }
}
