import { blinkyAvailable, blinkyCommand, blinkyPathClear, inBlinkyNozzle } from './blinky'
import { attackPhase } from './frameData'
import type { FightSide, FightState } from './types'

/** An active Blinky suction takes free drops along its clear nozzle; that blood is lost. */
export function vacuumMaryDrops(state: FightState): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    const owner = side === 'player' ? 'opponent' : 'player'
    if (!sucking(next, side) || !next[owner].bloodyMary?.drops.length) continue
    const blood = next[owner].bloodyMary!
    const drops = blood.drops.filter(
      (drop) => !(inBlinkyNozzle(next[side], drop) && blinkyPathClear(next, side, drop)),
    )
    if (drops.length === blood.drops.length) continue
    next = {
      ...next,
      [owner]: {
        ...next[owner],
        bloodyMary: { ...blood, drops, returning: drops.length ? blood.returning : false },
      },
    }
  }
  return next
}

function sucking(state: FightState, side: FightSide): boolean {
  const fighter = state[side]
  return (
    blinkyAvailable(fighter) &&
    blinkyCommand(fighter) === 'suction' &&
    attackPhase(fighter) === 'active'
  )
}
