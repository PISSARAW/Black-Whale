import type { Graph } from '$lib/audio/ambient/mixer'
import { rush, startsAt, swept } from '$lib/audio/hatsu/synth'
import type { FightSoundEvent } from './events'
import { materialStrike } from './voices'
import { playRosterEasterEggSound } from './easterEggRoster'

/** Short, quiet cues only; nothing keeps sounding after a scene is interrupted. */
export function playEasterEggSound(g: Graph, event: FightSoundEvent): void {
  if (playRosterEasterEggSound(g, event)) return
  if (event.fighter === 'hisoka') {
    materialStrike(g, { material: 'paper', force: event.value ? 0.35 : 0.2, light: true })
  } else if (event.fighter === 'kurapika') {
    materialStrike(g, { material: 'steel', force: 0.15, light: true })
  } else if (event.fighter === 'leorio') {
    materialStrike(g, {
      material: event.moveId === '1' ? 'glass' : 'wood',
      force: 0.18,
      light: true,
    })
    if (event.moveId === '4' && event.value)
      swept(g, startsAt(g), {
        type: 'sine',
        from: 440,
        to: 280,
        peak: 0.015,
        duration: 0.1,
        release: 0.08,
      })
  } else {
    rush(g, startsAt(g), { peak: 0.009, cutoff: 1200, duration: 0.025, release: 0.03 })
  }
}
