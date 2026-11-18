import type { FutureFrame } from './parallelFutureTypes'
import type { FightState } from './types'

/** A predicted network and its compatibility projection must come from the same frame. */
export function futureGumState(frame: FutureFrame): Pick<FightState, 'gumNetwork' | 'bungeeGum'> {
  return { gumNetwork: frame.scene?.gumNetwork, bungeeGum: frame.scene?.bungeeGum ?? null }
}
