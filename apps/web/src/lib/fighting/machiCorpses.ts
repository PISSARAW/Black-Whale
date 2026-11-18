import { canAct } from './fightActorState'
import { machiSourceActive } from './machiThread'
import { priorityLineOfSight } from './priorityOptics'
import { updateEntity } from './preparationWorld'
import type { PreparedEntity } from './preparationTypes'
import type { FightSide, FightState, FightProjectile } from './types'
import type { ArsenalInvocation, ArsenalOption } from './retrospectiveTypes'

declare module './types' {
  interface ArcadeFighter {
    corpseStrings?: { id: string; length: number }[]
    corpseStringPreparation?: { id: string; frames: number; health: number }
  }
  interface FightProjectile {
    corpseGun?: string
  }
}
declare module './preparationTypes' {
  interface PreparedEntity {
    corpseGunRounds?: number
  }
}
function materialCorpse(body: PreparedEntity): boolean {
  return body.kind === 'corpse' && body.material === 'real' && body.present && body.health > 0
}
function freeStrings(state: FightState, side: FightSide): boolean {
  const actor = state[side]
  return (
    state.phase === 'fighting' &&
    !state.catsName &&
    canAct(actor) &&
    !actor.attack &&
    machiSourceActive(actor)
  )
}
export function performMachiCorpse({ state, side, command }: ArsenalInvocation): FightState {
  if (!freeStrings(state, side)) return state
  const actor = state[side],
    body = state.battlefield?.entities.find((e) => e.id === command.target && materialCorpse(e))
  if (!body) return state
  if (command.action === 'machi-corpse-fire') return fireCorpse(state, side, body)
  if (command.action !== 'machi-corpse' || !canAttachCorpse(state, side, body)) return state
  return {
    ...state,
    [side]: {
      ...actor,
      aura: actor.aura - 12,
      arenaRecovery: 24,
      corpseStringPreparation: { id: body.id, frames: 24, health: actor.health },
    },
  }
}
function canAttachCorpse(state: FightState, side: FightSide, body: PreparedEntity): boolean {
  const actor = state[side]
  return (
    !body.controller &&
    !actor.corpseStringPreparation &&
    (actor.corpseStrings?.length ?? 0) < 2 &&
    actor.aura >= 12 &&
    corpseReach(state, side, { body, range: 6 })
  )
}
function corpseReach(
  state: FightState,
  side: FightSide,
  { body, range }: { body: PreparedEntity; range: number },
): boolean {
  const actor = state[side]
  return (
    Math.hypot(actor.x - body.x, actor.y - body.y) <= range &&
    priorityLineOfSight(state, { x: actor.x, y: actor.y + 6, targetX: body.x, targetY: body.y + 2 })
  )
}
function fireCorpse(state: FightState, side: FightSide, body: PreparedEntity): FightState {
  const actor = state[side]
  if (body.controller?.source !== 'machi' || body.controller.side !== side || !body.corpseGunRounds)
    return state
  if (
    !actor.corpseStrings?.some((s) => s.id === body.id) ||
    !corpseReach(state, side, { body, range: 16 })
  )
    return state
  const shot: FightProjectile = {
    id: state.nextProjectileId,
    owner: side,
    fighterId: 'machi',
    corpseGun: body.id,
    x: body.x + actor.facing * 2,
    y: body.y + 6,
    velocityX: actor.facing * 104,
    width: 0.45,
    height: 0.25,
    damage: 12,
    hitstun: 13,
    blockstun: 9,
    hitstop: 3,
    knockback: 1,
    targetZone: 'torso',
    guard: 'mid',
    shape: 'bullet',
    matter: 'object',
    colour: '#e2e8f0',
    age: 0,
    lifetime: 120,
    nenPower: 1,
    hatsuPower: 1,
  }
  return updateEntity(
    {
      ...state,
      nextProjectileId: state.nextProjectileId + 1,
      projectiles: [...state.projectiles, shot],
      [side]: { ...actor, arenaRecovery: 18 },
    },
    body.id,
    { corpseGunRounds: body.corpseGunRounds - 1 },
  )
}
export function advanceMachiCorpses(state: FightState): FightState {
  for (const side of ['player', 'opponent'] as const) {
    state = advanceStringPreparation(state, side)
    state = maintainStrings(state, side)
  }
  return state
}
function advanceStringPreparation(state: FightState, side: FightSide): FightState {
  const actor = state[side],
    pending = actor.corpseStringPreparation
  if (!pending) return state
  const body = state.battlefield?.entities.find((e) => e.id === pending.id && materialCorpse(e))

  const cleared = { ...state, [side]: { ...actor, corpseStringPreparation: undefined } }
  if (!stringPreparationValid(state, side, body)) return cleared
  if (pending.frames > 1)
    return {
      ...state,
      [side]: { ...actor, corpseStringPreparation: { ...pending, frames: pending.frames - 1 } },
    }
  return updateEntity(
    {
      ...cleared,
      [side]: {
        ...cleared[side],
        corpseStrings: [...(actor.corpseStrings ?? []), { id: body.id, length: 16 }],
      },
    },
    body.id,
    {
      controller: { side, source: 'machi' },
      y: 2,
      arena: body.arena ? { ...body.arena, height: 12 } : undefined,
    },
  )
}
function stringPreparationValid(
  state: FightState,
  side: FightSide,
  body?: PreparedEntity,
): body is PreparedEntity {
  const actor = state[side],
    pending = actor.corpseStringPreparation!
  return Boolean(
    body &&
    !body.controller &&
    actor.health >= pending.health &&
    actor.hitStun === 0 &&
    machiSourceActive(actor) &&
    corpseReach(state, side, { body, range: 6 }),
  )
}
function maintainStrings(state: FightState, side: FightSide): FightState {
  const actor = state[side]
  if (!actor.corpseStrings?.length) return state
  const kept: NonNullable<typeof actor.corpseStrings> = []
  for (const link of actor.corpseStrings) {
    const body = state.battlefield?.entities.find((e) => e.id === link.id)
    if (body && stringHolds(state, side, { body, length: link.length })) kept.push(link)
    else if (controlledByMachi(body, side))
      state = updateEntity(state, body.id, {
        controller: undefined,
        y: 0,
        arena: body.arena ? { ...body.arena, height: 3 } : undefined,
      })
  }
  return { ...state, [side]: { ...state[side], corpseStrings: kept } }
}
function controlledByMachi(
  body: PreparedEntity | undefined,
  side: FightSide,
): body is PreparedEntity {
  return body?.controller?.source === 'machi' && body.controller.side === side
}
function stringHolds(
  state: FightState,
  side: FightSide,
  { body, length }: { body: PreparedEntity; length: number },
): boolean {
  const actor = state[side]
  return (
    materialCorpse(body) &&
    body.controller?.source === 'machi' &&
    body.controller.side === side &&
    machiSourceActive(actor) &&
    actor.hitStun === 0 &&
    !actor.attack &&
    corpseReach(state, side, { body, range: length })
  )
}
export function machiCorpseOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (state[side].id !== 'machi') return []
  return (state.battlefield?.entities ?? []).filter(materialCorpse).flatMap((body) => {
    const action =
      body.controller?.source === 'machi'
        ? ('machi-corpse-fire' as const)
        : ('machi-corpse' as const)
    const command = { action, target: body.id }
    return [
      {
        command,
        ready: performMachiCorpse({ state, side, command }) !== state,
        labelFr:
          action === 'machi-corpse'
            ? 'Fils · Suspendre un corps matériel'
            : 'Fils · Faire tirer l’arme du corps',
        labelEn:
          action === 'machi-corpse'
            ? 'Threads · Suspend a physical body'
            : 'Threads · Fire the body’s weapon',
        conditionFr:
          'York Shin, ch. 97. Deux corps de scénario au maximum, fils au contact et maintien manuel. Le corps armé dépense ses propres cartouches ; ni conscience, ni souvenirs, ni Hatsu du défunt. Perte du Nen, coup reçu, mains occupées ou fil hors de portée : chute du corps. Coûts, portée et délais : réglages de duel.',
        conditionEn:
          'Yorknew, ch. 97. At most two scenario bodies, contact strings and manual maintenance. An armed corpse spends its own rounds; no consciousness, memories or personal Hatsu. Nen loss, a received hit, occupied hands or an out-of-reach thread drops the body. Costs, reach and timing are duel tuning.',
      },
    ]
  })
}
