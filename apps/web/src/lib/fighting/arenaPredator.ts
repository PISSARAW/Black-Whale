import { arenaObjects } from './arenaActions'
import type { PredatorPrey } from './predatorPrey'
import type { PredatorPreyId } from './predatorTypes'
import type { FightSide, FightState } from './types'

/** Predator analyses the same Hatsu whether it is attached to a body or to scenery. */
export function withArenaPrey(prey: PredatorPrey): PredatorPrey {
  if (!['bungee-gum', 'nen-stitches', 'sun-and-moon'].includes(prey.id)) return prey
  return {
    ...prey,
    live: (state, side) => prey.live(state, side) || Boolean(arenaPreyPoint(state, side, prey.id)),
    point: (state, side) =>
      arenaPreyPoint(state, side, prey.id) ??
      prey.point?.(state, side) ?? { x: state[side].x, y: state[side].y + 7 },
    consume: (state, side) => consumeArenaPrey(prey.consume(state, side), side, prey.id),
  }
}

function arenaPreyPoint(state: FightState, side: FightSide, preyId: PredatorPreyId) {
  if (preyId === 'sun-and-moon') {
    const entry = arenaObjects(state).find(
      (object) => object.arena!.sun === side || object.arena!.moon === side,
    )
    return entry ? { x: entry.x, y: entry.y + 4 } : null
  }
  const tether = state.arena?.tether[side]
  const kind = preyId === 'bungee-gum' ? 'gum' : 'thread'
  if (tether?.kind !== kind) return null
  const entry = arenaObjects(state).find((object) => object.id === tether.objectId)
  return entry ? { x: (entry.x + state[side].x) / 2, y: 5 } : null
}

function consumeArenaPrey(state: FightState, side: FightSide, preyId: PredatorPreyId): FightState {
  if (!state.arena) return state
  if (preyId !== 'sun-and-moon')
    return {
      ...state,
      arena: { ...state.arena, tether: { ...state.arena.tether, [side]: undefined } },
    }
  if (!state.battlefield) return state
  return {
    ...state,
    battlefield: {
      ...state.battlefield,
      entities: state.battlefield.entities.map((entry) => {
        if (!entry.arena) return entry
        return {
          ...entry,
          arena: {
            ...entry.arena,
            sun: entry.arena.sun === side ? undefined : entry.arena.sun,
            moon: entry.arena.moon === side ? undefined : entry.arena.moon,
          },
        }
      }),
    },
  }
}
