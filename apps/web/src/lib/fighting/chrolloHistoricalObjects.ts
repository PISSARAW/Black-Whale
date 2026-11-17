import { historicalCopyExpired } from './historicalCopyLifetime'
import { sleepingBody } from './hanzoProjection'
import { createArenaState } from './arenaTypes'
import { chrolloHasActivePage } from './chrolloBook'
import { battleAppearance } from './battleCantabileRules'
import { updateEntity } from './preparationWorld'
import { canSpeak } from './saiyuSenses'
import { resolveHistoricalContact } from './historicalContact'
import type { PreparedEntity } from './preparationTypes'
import type { HistoricalCopy } from './chrolloHistoricalTypes'
import type { FightSide, FightState } from './types'

export { GALLERY_FAKE_LIFETIME, historicalCopyExpired } from './historicalCopyLifetime'

export function copyHistoricalObject(
  state: FightState,
  side: FightSide,
  targetId?: string,
): FightState {
  if (!chrolloHasActivePage(state[side], 'gallery-fake') || state[side].chrolloBook?.open)
    return state // Left touches; right creates the copy.
  const source = copySource(state, side, targetId)
  if (!source || state[side].aura < 20) return state
  const id = nextCopyId(state, side)
  const copy: PreparedEntity = {
    ...source,
    id,
    owner: side,
    x: copySpawnX(state, side),
    present: true,
    material: 'nen',
    health: 40,
    ...replicaMaterials(source, id),
    consenting: false,
    controller: undefined,
    copy: {
      owner: side,
      inertDeviceForm: source.device?.form?.kind,
      originalId: source.id,
      createdAt: state.frame,
      headAttached: true,
      headHealth: 15,
      ...copyAppearance(source),
    },
  }
  const field = copyField(state)
  return {
    ...state,
    arena: state.arena ?? createArenaState(),
    [side]: { ...state[side], aura: state[side].aura - 20, arenaRecovery: 18 },
    battlefield: { ...field, entities: [...field.entities, copy] },
  }
}

function nextCopyId(state: FightState, side: FightSide): string {
  const count =
    state.battlefield?.entities.filter((entry) => entry.copy?.owner === side).length ?? 0
  return `gallery:${side}:${state.frame}:${count}`
}
function replicaMaterials(source: PreparedEntity, id: string): Partial<PreparedEntity> {
  return {
    writingKit: source.writingKit
      ? { ...source.writingKit, sourceId: id, copyId: id, serial: 0, integrity: 40 }
      : undefined,
    weakSpirit: undefined,
    device: source.device
      ? {
          ...source.device,
          carrier: undefined,
          carrierMember: undefined,
          hand: undefined,
          swallowed: false,
          form: undefined,
          transforming: undefined,
        }
      : undefined,
    arena: source.arena
      ? { width: source.arena.width, height: source.arena.height }
      : { width: 2.2, height: 13 },
  }
}

function copySpawnX(state: FightState, side: FightSide): number {
  const behind = state[side].x - state[side].facing * 5
  return behind >= 7 && behind <= 93 ? behind : state[side].x + state[side].facing * 5
}

function copySource(state: FightState, side: FightSide, targetId?: string): PreparedEntity | null {
  const target = targetId ?? (side === 'player' ? 'opponent' : 'player')
  const caster = state[side]
  if (target === 'player' || target === 'opponent') {
    const body = sleepingBody(state[target])
    if (Math.hypot(body.x - caster.x, body.y - caster.y) > 6) return null
    return {
      id: target,
      kind: 'puppet',
      owner: target,
      x: body.x,
      y: body.y,
      present: true,
      material: 'real',
      health: 40,
      copy: {
        owner: side,
        originalId: target,
        createdAt: state.frame,
        appearance: battleAppearance(body),
        headAttached: true,
      },
    }
  }
  return (
    state.battlefield?.entities.find(
      (entry) =>
        entry.id === target &&
        entry.present &&
        !entry.weakSpirit &&
        Math.hypot(entry.x - caster.x, entry.y - caster.y) <= 6,
    ) ?? null
  )
}

export function stampHistoricalPuppet(state: FightState, side: FightSide, id?: string): FightState {
  if (
    !canSpeak(state[side]) ||
    state[side].aura < 10 ||
    !chrolloHasActivePage(state[side], 'order-stamp')
  )
    return state
  const puppet = state.battlefield?.entities.find(
    (entry) =>
      entry.kind === 'puppet' &&
      entry.copy?.headAttached &&
      entry.present &&
      entry.health > 0 &&
      (!id || entry.id === id) &&
      Math.hypot(entry.x - state[side].x, entry.y - state[side].y) <= 8,
  )
  if (!puppet?.copy) return state
  const changed = updateEntity(state, puppet.id, {
    copy: {
      ...puppet.copy,
      owner: side,
      order: 'attack',
      target: side === 'player' ? 'opponent' : 'player',
    },
  })
  return {
    ...changed,
    [side]: { ...changed[side], aura: changed[side].aura - 10, arenaRecovery: 18 },
  }
}

export function orderHistoricalPuppets(
  state: FightState,
  side: FightSide,
  order: 'attack' | 'wait',
): FightState {
  if (
    !canSpeak(state[side]) ||
    !chrolloHasActivePage(state[side], 'order-stamp') ||
    !state.battlefield
  )
    return state
  return {
    ...state,
    battlefield: {
      ...state.battlefield,
      entities: state.battlefield.entities.map((entry) =>
        entry.copy?.owner === side && entry.copy.order
          ? { ...entry, copy: { ...entry.copy, order } }
          : entry,
      ),
    },
  }
}

/** Marks keep a copy in existence after Gallery Fake is closed, until its destruction. */
export function advanceHistoricalCopies(state: FightState): FightState {
  if (!state.battlefield) return state
  let next = state
  for (const entry of state.battlefield.entities) {
    if (!entry.copy || !entry.present) continue
    if (historicalCopyExpired(state, entry)) {
      next = updateEntity(next, entry.id, { present: false })
      continue
    }
    if (!entry.copy.headAttached || entry.health <= 0) continue
    next = advancePuppet(next, entry)
  }
  return next
}

function advancePuppet(state: FightState, entry: PreparedEntity): FightState {
  const copy = entry.copy!
  if (
    copy.order !== 'attack' ||
    !copy.target ||
    !chrolloHasActivePage(state[copy.owner], 'order-stamp')
  )
    return state
  const body = state[copy.target]
  const gap = body.x - entry.x
  if (Math.abs(gap) > 6) return updateEntity(state, entry.id, { x: entry.x + Math.sign(gap) * 0.2 })
  const cooldown = Math.max(0, (copy.cooldown ?? 0) - 1)
  if (cooldown) return updateEntity(state, entry.id, { copy: { ...copy, cooldown } })
  // Ordinary material contact: guard, distance, height and vulnerability still matter.
  if (body.y > 10 || body.knockdownFrames > 0 || body.wakeupInvulnerableFrames > 0) return state
  const next = updateEntity(state, entry.id, { copy: { ...copy, cooldown: 45 } })
  return resolveHistoricalContact(next, {
    owner: copy.owner,
    target: copy.target,
    x: entry.x,
    y: entry.y,
    damage: 8,
  })
}

function copyField(state: FightState) {
  return (
    state.battlefield ?? {
      entities: [],
      interactionHeld: { player: false, opponent: false },
      completed: { player: 0, opponent: 0 },
    }
  )
}
function copyAppearance(source: PreparedEntity): Partial<HistoricalCopy> {
  return source.kind === 'puppet' ? { appearance: source.copy?.appearance } : {}
}
