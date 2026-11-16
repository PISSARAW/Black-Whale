import type { Graph } from '$lib/audio/ambient/mixer'
import { startsAt, swept } from '$lib/audio/hatsu/synth'
import { easterEggDefinition } from '../easterEggCatalogue'
import type { EasterEggSlot, EggPropKind } from '../easterEggTypes'
import type { FightSoundEvent } from './events'
import { FIGHTER_SOUNDS } from './profiles'
import type { SoundMaterial } from './profileTypes'
import { materialStrike } from './voices'

const PROP_SOUNDS: Record<EggPropKind, SoundMaterial> = {
  fan: 'paper',
  paper: 'paper',
  letter: 'paper',
  map: 'paper',
  owlNote: 'paper',
  ticket: 'paper',
  cloth: 'silk',
  ribbon: 'silk',
  bandage: 'silk',
  gem: 'glass',
  bottle: 'glass',
  coin: 'steel',
  pencil: 'wood',
  ruler: 'wood',
  stamp: 'wood',
  notebook: 'paper',
  leaf: 'silk',
}

/** Uses each fighter's existing timbre; never plays the cue of an actual Hatsu. */
export function playRosterEasterEggSound(g: Graph, event: FightSoundEvent): boolean {
  if (!event.fighter) return false
  const definition = easterEggDefinition(event.fighter, Number(event.moveId) as EasterEggSlot)
  if (!definition?.motion) return false
  const profile = FIGHTER_SOUNDS[event.fighter]
  const material = definition.prop ? PROP_SOUNDS[definition.prop.kind] : 'silk'
  materialStrike(g, { material, force: 0.12 * definition.motion.energy, light: true })
  if (event.moveId === '4' && event.value) {
    const root = Math.max(100, profile.breath * 2)
    swept(g, startsAt(g), {
      type: 'sine',
      from: root,
      to: root * 0.8,
      peak: 0.009,
      duration: 0.07,
      release: 0.06,
    })
  }
  return true
}
