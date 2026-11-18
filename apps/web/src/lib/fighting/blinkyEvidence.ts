import { canAct } from './fightActorState'
import { blinkyAvailable } from './blinky'
import { storeArenaVacuum } from './arenaVacuum'
import { createArenaState } from './arenaTypes'
import { priorityLineOfSight } from './priorityOptics'
import { updateEntity } from './preparationWorld'
import type { ArsenalInvocation, ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'
import type { PreparedEntity } from './preparationTypes'

declare module './types' {
  interface ArcadeFighter {
    blinkyEvidence?: { target: string; frames: number; health: number }
  }
}
function evidenceTarget(
  state: FightState,
  side: FightSide,
  id?: string,
): PreparedEntity | undefined {
  const actor = state[side]
  return state.battlefield?.entities.find(
    (entry) =>
      entry.id === id &&
      entry.kind === 'corpse' &&
      entry.material === 'real' &&
      entry.present &&
      entry.health > 0 &&
      (entry.x - actor.x) * actor.facing >= 0 &&
      Math.hypot(entry.x - actor.x, entry.y - actor.y) <= 20,
  )
}
export function performBlinkyEvidence({ state, side, command }: ArsenalInvocation): FightState {
  const actor = state[side]
  if (
    command.action !== 'blinky-evidence' ||
    !blinkyAvailable(actor) ||
    !canAct(actor) ||
    actor.attack
  )
    return state
  if (actor.blinkyEvidence || actor.aura < 12 || !evidenceTarget(state, side, command.target))
    return state
  return {
    ...state,
    [side]: {
      ...actor,
      aura: actor.aura - 12,
      arenaRecovery: 24,
      blinkyEvidence: { target: command.target!, frames: 24, health: actor.health },
    },
  }
}
export function advanceBlinkyEvidence(state: FightState): FightState {
  for (const side of ['player', 'opponent'] as const) state = advanceEvidence(state, side)
  return state
}
function advanceEvidence(state: FightState, side: FightSide): FightState {
  const actor = state[side],
    pending = actor.blinkyEvidence
  if (!pending) return state
  const corpse = evidenceTarget(state, side, pending.target)
  if (!corpse || !suctionContinues(state, side, corpse))
    return { ...state, [side]: { ...actor, blinkyEvidence: undefined } }
  if (pending.frames > 1)
    return {
      ...state,
      [side]: { ...actor, blinkyEvidence: { ...pending, frames: pending.frames - 1 } },
    }
  const cleared = updateEntity(
    {
      ...state,
      arena: state.arena ?? createArenaState(),
      [side]: { ...actor, blinkyEvidence: undefined },
    },
    corpse.id,
    { controller: undefined, corpseOrder: undefined },
  )
  return storeArenaVacuum(cleared, side, corpse)
}
function suctionContinues(state: FightState, side: FightSide, corpse: PreparedEntity): boolean {
  const actor = state[side]
  return (
    blinkyAvailable(actor) &&
    actor.health >= actor.blinkyEvidence!.health &&
    actor.hitStun === 0 &&
    priorityLineOfSight(state, {
      x: actor.x,
      y: actor.y + 2,
      targetX: corpse.x,
      targetY: corpse.y + 2,
    })
  )
}
export function blinkyEvidenceOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (!blinkyAvailable(state[side])) return []
  return (state.battlefield?.entities ?? [])
    .filter((entry) => entry.kind === 'corpse' && entry.present)
    .map((entry) => {
      const command = { action: 'blinky-evidence' as const, target: entry.id }
      return {
        command,
        ready: performBlinkyEvidence({ state, side, command }) !== state,
        labelFr: 'Blinky · Effacer un cadavre réel',
        labelEn: 'Blinky · Remove a real corpse',
        conditionFr:
          'Matière morte réelle présente dans la scène, devant la buse et sans obstacle. Aspiration vulnérable ; aucune personne vivante ou copie de Nen. Le dernier objet seul reste restituable.',
        conditionEn:
          'Actual dead matter in the scene, ahead of the nozzle and without cover. Vulnerable suction; no living person or Nen copy. Only the last swallowed item can be returned.',
      }
    })
}
