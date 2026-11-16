import type { FightState } from '../types'
import type { FighterHatsu } from './contract'

const MIN_X = 7
const MAX_X = 93

/** Gap, in lane units, at which the retracted gum goes slack — just inside Hisoka's reach. */
export const BUNGEE_REST_DISTANCE = 8
/** Share of the remaining stretch recovered each frame: the further, the harder the pull. */
const ELASTIC_RECOVERY = 0.14
/** The last stretch still closes in a few frames instead of crawling asymptotically. */
const MIN_PULL = 0.6

/**
 * Bungee Gum — rubber and gum at once (Heavens Arena).
 *
 * The gum sticks on an unblocked Hatsu hit and stays attached. A later Hatsu
 * puts it under tension: the target is reeled in over several frames, faster
 * the more the line is stretched, until it goes slack at rest length. It is a
 * pull, never a teleport. The canon ten-metre limit on emitted strands is not
 * modelled because the lane itself is under ten metres wide.
 */
export const hisokaHatsu: FighterHatsu = {
  id: 'hisoka',
  onTrigger: ({ state, side }) =>
    state.bungeeGum?.owner === side
      ? { ...state, bungeeGum: { ...state.bungeeGum, retracting: true } }
      : state,
  onImpact: ({ state, side, defenderSide, blocked, concealed }) =>
    blocked
      ? state
      : {
          ...state,
          bungeeGum: { owner: side, target: defenderSide, hidden: concealed, retracting: false },
        },
  onFrame: reelIn,
}

function reelIn(state: FightState): FightState {
  const gum = state.bungeeGum
  if (!gum?.retracting) return state
  const owner = state[gum.owner]
  const target = state[gum.target]
  const stretch = Math.abs(target.x - owner.x) - BUNGEE_REST_DISTANCE
  if (stretch <= 0) return { ...state, bungeeGum: { ...gum, retracting: false } }
  const pull = Math.min(stretch, Math.max(MIN_PULL, stretch * ELASTIC_RECOVERY))
  const direction = target.x >= owner.x ? -1 : 1
  return {
    ...state,
    [gum.target]: { ...target, x: clamp(target.x + direction * pull, MIN_X, MAX_X) },
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}
