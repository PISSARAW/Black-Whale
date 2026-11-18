import { beginFight, createFight, performAuraAttack } from '$lib/fighting/engine'
import { attackData, otherSide } from '$lib/fighting/frameData'
import { resolveFightImpacts } from '$lib/fighting/combatImpact'
import { performSweetHomeCommand } from '$lib/fighting/sweetHomeArsenal'
import { updateEntity } from '$lib/fighting/preparationWorld'
import type { FightSide, FightState } from '$lib/fighting/types'

export type SweetHomeScenario =
  | 'return'
  | 'absorb'
  | 'backlash'
  | 'object'
  | 'external-object'
  | 'broken-object'
  | 'no-contact'
  | 'stance'
const OBJECTS = new Set<SweetHomeScenario>(['object', 'external-object', 'broken-object'])
export function createSweetHomeScenario(
  mode: SweetHomeScenario,
  owner: FightSide = 'player',
): FightState {
  const objects = OBJECTS.has(mode),
    other = otherSide(owner)
  const base = beginFight(
    createFight(
      owner === 'player' ? 'terebellum' : 'hisoka',
      owner === 'opponent' ? 'terebellum' : 'hisoka',
      {
        mode: 'versus-local',
        formatId: 'knockout',
        environment: {
          stageId: 'heavens-arena',
          preparation: {
            mode: objects ? 'scenario' : 'duel',
            resources: objects ? ['objects'] : [],
            cohorts: [],
          },
        },
      },
    ),
  )
  const x = objects ? (owner === 'player' ? 25 : 82) : owner === 'player' ? 46 : 51
  let state: FightState = {
    ...base,
    [owner]: { ...base[owner], x, aura: 100, health: 60 },
    [other]: { ...base[other], x: x + base[owner].facing * 5, aura: 100 },
  }
  if (objects)
    state = performSweetHomeCommand(state, owner, {
      action: 'sweet-home-object',
      target: `${owner}:crate`,
    })
  if (mode === 'broken-object') state = updateEntity(state, `${owner}:crate`, { health: 0 })
  return state
}
/** Controlled contact snapshots use native moves at their real active frame, not invented wounds. */
function active(
  state: FightState,
  side: FightSide,
  c: { moveId: string; kind: 'light' | 'special' },
) {
  const next = performAuraAttack({
    state,
    side,
    kind: c.kind,
    moveId: c.moveId,
    auraCharged: false,
  })
  const fighter = next[side]
  if (!fighter.attack) throw new Error(`Cannot prepare ${c.moveId}`)
  return {
    ...next,
    [side]: {
      ...fighter,
      attack: { ...fighter.attack, frame: attackData(fighter.attack.kind, fighter).startup },
    },
  }
}
export function prepareSweetHomeContact(
  state: FightState,
  mode: SweetHomeScenario,
  owner: FightSide,
): FightState {
  const slot =
    mode === 'backlash'
      ? 'downSpecial'
      : mode === 'absorb' || mode === 'external-object'
        ? 'forwardSpecial'
        : 'neutralSpecial'
  let ready = active(state, owner, { moveId: `terebellum:${slot}`, kind: 'special' })
  if (mode === 'absorb' || mode === 'backlash' || mode === 'external-object') return ready
  // Its martial carrier is already spent; the posture's contact window remains active.
  ready = {
    ...ready,
    [owner]: { ...ready[owner], attack: { ...ready[owner].attack!, impacted: true } },
  }
  if (mode === 'stance') return ready
  if (mode === 'no-contact')
    ready = { ...ready, [owner]: { ...ready[owner], facing: ready[owner].facing === 1 ? -1 : 1 } }
  const other = otherSide(owner)
  return active(ready, other, { moveId: `${ready[other].id}:standingLight`, kind: 'light' })
}
export function resolveSweetHomeContact(state: FightState, mode: SweetHomeScenario): FightState {
  return mode === 'stance' ? state : resolveFightImpacts(state, [])
}
