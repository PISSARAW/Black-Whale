import { historicalPartExists } from './historicalCopyLifetime'
import { physicalBodyAt } from './fightBodyIdentity'
import { paperAbilityAvailable } from './kallutoAccess'
import type { PreparedEntity } from './preparationTypes'
import type { ArcadeFighter, FightState } from './types'

export function advancePaperScatters(state: FightState): FightState {
  const field = state.battlefield
  if (!field) return state
  const entities = field.entities.map((entry) => advancePaperScatter(state, entry))
  return entities.some((entry, index) => entry !== field.entities[index])
    ? { ...state, battlefield: { ...field, entities } }
    : state
}

function advancePaperScatter(state: FightState, entry: PreparedEntity): PreparedEntity {
  const paper = entry.paperScatter
  if (!paper) return entry
  if (!historicalPartExists(state, paper.materialCopyId)) return expireScatter(entry)
  const actor = physicalBodyAt(state, paper.owner.owner, paper.owner.member)
  const controlled = Boolean(paper.controlled && actor && paperAbilityAvailable(actor, 'serpent'))
  const shot = state.projectiles.find(
    (held) =>
      held.paperScatterId === entry.id ||
      (held.paperBurstId === entry.id && held.id === paper.burst),
  )
  if (shot)
    return {
      ...entry,
      x: shot.x,
      y: shot.y,
      present: shot.paperScatterId !== entry.id,
      paperScatter: {
        ...paper,
        controlled,
        vacuum: undefined,
        flight: shot.paperScatterId === entry.id ? shot.id : undefined,
      },
    }
  return settleScatter(state, entry, controlled)
}

function expireScatter(entry: PreparedEntity): PreparedEntity {
  const paper = entry.paperScatter!
  if (entry.health === 0 && !entry.present && !paper.controlled && paper.flight === undefined)
    return entry
  return {
    ...entry,
    present: false,
    health: 0,
    paperScatter: { ...paper, controlled: false, flight: undefined },
  }
}
function settleScatter(
  state: FightState,
  entry: PreparedEntity,
  controlled: boolean,
): PreparedEntity {
  const paper = entry.paperScatter!
  if (paper.vacuum) return entry
  if (paper.flight && scatterHeld(state, entry.id))
    return controlled === paper.controlled
      ? entry
      : { ...entry, paperScatter: { ...paper, controlled } }
  if (paper.flight)
    return {
      ...entry,
      present: entry.health > 0,
      y: 0,
      paperScatter: { ...paper, controlled, flight: undefined },
    }
  return controlled === paper.controlled
    ? entry
    : { ...entry, y: 0, paperScatter: { ...paper, controlled } }
}

function scatterHeld(state: FightState, id: string): boolean {
  for (const side of ['player', 'opponent'] as const) {
    const count = state.teamMatch?.seats[side].members.length ?? 1
    for (let member = 0; member < count; member++) {
      const body = physicalBodyAt(state, side, member)
      if (body && bodyHoldsScatter(body, id)) return true
    }
  }
  return false
}
function bodyHoldsScatter(body: ArcadeFighter, id: string): boolean {
  return [body.gumCatch?.projectile, body.hatsuEffects.baton?.card, body.blinky?.lastObject].some(
    (shot) => shot?.paperScatterId === id,
  )
}
