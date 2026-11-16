import type { ArcadeFighter } from './types'
import type { FightSoundEvent } from './audio/events'

export function illumiSoundTransitions(
  previous: ArcadeFighter,
  fighter: ArcadeFighter,
): [unknown, unknown, FightSoundEvent['kind']][] {
  return [
    [previous.needlePuppet, fighter.needlePuppet, 'hatsu'],
    [previous.illumi?.disguised, fighter.illumi?.disguised, 'transform'],
  ]
}
