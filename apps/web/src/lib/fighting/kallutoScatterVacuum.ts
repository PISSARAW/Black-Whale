import { blinkyState, inBlinkyNozzle } from './blinky'
import { forgetArenaVacuum } from './arenaVacuum'
import { activePaperOwner } from './kallutoSurveillance'
import type { PreparedEntity } from './preparationTypes'
import type { FightProjectile, FightSide, FightState } from './types'

/** Loose real paper remains an admissible Blinky target; conjured copies do not. */
export function swallowPaperScatter(state: FightState, side: FightSide): FightState {
  const actor = state[side]
  if (blinkyState(actor).target !== 'card') return state
  const loose = (state.battlefield?.entities ?? [])
    .filter(
      (entry) =>
        entry.present &&
        entry.health > 0 &&
        entry.paperScatter &&
        entry.material === 'real' &&
        inBlinkyNozzle(actor, entry),
    )
    .sort((left, right) => Math.abs(left.x - actor.x) - Math.abs(right.x - actor.x))
  if (!loose.length) return state
  const vacuum = activePaperOwner(state, side)
  const swallowed = new Map(
    loose.map((entry, index) => [
      entry.id,
      {
        ...entry,
        present: false,
        paperScatter: {
          ...entry.paperScatter!,
          controlled: false,
          vacuum,
          flight: state.nextProjectileId + index,
        },
      },
    ]),
  )
  const next = forgetArenaVacuum(state, side)
  const last = paperScatterObject(
    loose[loose.length - 1],
    side,
    state.nextProjectileId + loose.length - 1,
  )
  return {
    ...next,
    nextProjectileId: state.nextProjectileId + loose.length,
    battlefield: {
      ...next.battlefield!,
      entities: next.battlefield!.entities.map((entry) => swallowed.get(entry.id) ?? entry),
    },
    [side]: {
      ...next[side],
      blinky: {
        ...blinkyState(next[side]),
        lastObject: last,
        lastArenaObject: undefined,
        lastWasBlood: false,
      },
    },
  }
}
function paperScatterObject(entry: PreparedEntity, side: FightSide, id: number): FightProjectile {
  return {
    id,
    owner: side,
    fighterId: 'shizuku',
    x: entry.x,
    y: entry.y,
    velocityX: 0,
    width: 1,
    height: 0.3,
    damage: 4,
    hitstun: 8,
    blockstun: 4,
    hitstop: 2,
    knockback: 1,
    targetZone: 'torso',
    shape: 'card',
    colour: '#f4e9e5',
    age: 0,
    lifetime: 120,
    matter: 'object',
    paperId: entry.paperScatter!.paperId,
    paperScatterId: entry.id,
  }
}
