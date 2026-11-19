import { arsenalMindAvailable } from './arsenalMind'
import { physicalBodyKey } from './fightBodyIdentity'
import { historicalHandsReady } from './historicalHands'
import {
  ownsMachiReattachment,
  machiReattachmentUsed,
  spendMachiReattachment,
  machiReattachmentOriginLive,
} from './machiReattachmentAccess'
import { withDolphinSupply } from './dolphinSupply'
import { machiSutureNeedleReady, sutureNeedleId } from './machiSutureNeedle'
import { newGumSource, type GumSource } from './bungeeSource'
import { canAct } from './fightActorState'
import type { PreparedEntity } from './preparationTypes'
import type { ArsenalInvocation, ArsenalOption } from './retrospectiveTypes'
import type { ArcadeFighter, FightSide, FightState } from './types'

/** Preparation, cost and contact distances are duel tuning, not manga measurements. */
const FRAMES = 90
declare module './types' {
  interface ArcadeFighter {
    machiReattachment?: {
      origin?: GumSource
      target: FightSide
      bodyKey: string
      entityId: string
      needleId: string
      frames: number
      health: number
      casterHealth: number
      x: number
      y: number
    }
  }
}

function patientReady(state: FightState, side: FightSide): boolean {
  const actor = state[side]
  return (
    arsenalMindAvailable(actor) &&
    !actor.hanzoProjection &&
    !actor.attack &&
    Boolean(actor.supportConsent) &&
    relaxedArmAura(actor)
  )
}
function relaxedArmAura(actor: ArcadeFighter): boolean {
  return actor.nen.mode === 'zetsu' || Boolean(actor.nen.ko && actor.nen.ko !== 'hands')
}
function originalPart(state: FightState, target: FightSide, id?: string) {
  return state.battlefield?.entities.find(
    (entry) =>
      entry.id === id &&
      entry.present &&
      entry.health > 0 &&
      entry.material === 'real' &&
      entry.detachedForearm?.bodyKey === physicalBodyKey(state, target) &&
      state[target].bodyDamage?.parts.includes(entry.detachedForearm.part),
  )
}
function patientFor(state: FightState, entry?: PreparedEntity): FightSide | undefined {
  return (['player', 'opponent'] as const).find(
    (side) => entry?.detachedForearm?.bodyKey === physicalBodyKey(state, side),
  )
}
export function performMachiReattachment({ state, side, command }: ArsenalInvocation): FightState {
  const actor = state[side]
  const entry = state.battlefield?.entities.find((part) => part.id === command.target)
  const target = patientFor(state, entry)
  if (!target || target === side || !patientReady(state, target)) return state
  if (!originalPart(state, target, entry?.id) || !reattachmentCasterReady(state, side)) return state
  if (!withinWorkplace({ state, side, target, entry: entry! })) return state
  const paid = spendMachiReattachment(state, side)
  return {
    ...paid,
    [side]: {
      ...paid[side],
      arenaRecovery: FRAMES + 1,
      machiReattachment: {
        origin: newGumSource(actor),
        target,
        bodyKey: physicalBodyKey(state, target),
        entityId: entry!.id,
        needleId: sutureNeedleId(state, side),
        frames: FRAMES,
        health: state[target].health,
        casterHealth: actor.health,
        x: state[target].x,
        y: state[target].y,
      },
    },
  }
}
function reattachmentCasterReady(state: FightState, side: FightSide): boolean {
  const actor = state[side]
  return (
    state.phase === 'fighting' &&
    !state.catsName &&
    canAct(actor) &&
    !actor.attack &&
    !actor.hanzoProjection &&
    actor.aura >= 20 &&
    machiSutureNeedleReady(state, side) &&
    ownsMachiReattachment(actor) &&
    !machiReattachmentUsed(actor) &&
    historicalHandsReady(state, side, ['left', 'right'])
  )
}
function withinWorkplace({
  state,
  side,
  target,
  entry,
}: {
  state: FightState
  side: FightSide
  target: FightSide
  entry: PreparedEntity
}) {
  const actor = state[side],
    patient = state[target]
  return (
    Math.hypot(actor.x - patient.x, actor.y - patient.y) <= 5 &&
    Math.hypot(actor.x + Math.sign(entry.x - actor.x) * 2 - entry.x, actor.y - entry.y) <= 6
  )
}
function interrupted(state: FightState, side: FightSide): boolean {
  const actor = state[side],
    work = actor.machiReattachment!,
    patient = state[work.target]
  if (!patientReady(state, work.target) || physicalBodyKey(state, work.target) !== work.bodyKey)
    return true
  if (casterInterrupted(state, side) || !machiSutureNeedleReady(state, side, work.needleId))
    return true
  const part = originalPart(state, work.target, work.entityId)
  return (
    !part ||
    !withinWorkplace({ state, side, target: work.target, entry: part }) ||
    Math.hypot(patient.x - work.x, patient.y - work.y) > 1 ||
    !historicalHandsReady(state, side, ['left', 'right'])
  )
}
function casterInterrupted(state: FightState, side: FightSide): boolean {
  const actor = state[side],
    work = actor.machiReattachment!
  return (
    !arsenalMindAvailable(actor) ||
    actor.health < work.casterHealth ||
    state[work.target].health < work.health ||
    actor.hitStun > 0 ||
    Boolean(actor.attack) ||
    actor.knockdownFrames > 0 ||
    !machiReattachmentOriginLive(state, side, work.origin)
  )
}
export function advanceMachiReattachment(state: FightState): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    const actor = next[side],
      work = actor.machiReattachment
    if (!work) continue
    const failed = interrupted(next, side)
    if (failed || work.frames <= 1) {
      next = { ...next, [side]: { ...actor, machiReattachment: undefined } }
      if (!failed) next = reconnectOriginal(next, work.target, work.entityId)
    } else
      next = {
        ...next,
        [side]: {
          ...actor,
          pose: 'special',
          machiReattachment: { ...work, frames: work.frames - 1 },
        },
      }
  }
  return next
}
function reconnectOriginal(state: FightState, target: FightSide, id: string): FightState {
  const part = originalPart(state, target, id)!.detachedForearm!.part
  const actor = state[target]
  return {
    ...state,
    [target]: {
      ...actor,
      bodyDamage: { parts: actor.bodyDamage!.parts.filter((lost) => lost !== part) },
    },
    battlefield: {
      ...state.battlefield!,
      entities: state.battlefield!.entities.map((entry) =>
        entry.id === id ? { ...entry, present: false } : entry,
      ),
    },
  }
}
export function machiReattachmentOptions(state: FightState, side: FightSide): ArsenalOption[] {
  let options: ArsenalOption[] = []
  withDolphinSupply(state, side, (prepared) => {
    options = suppliedReattachmentOptions(prepared, side)
    return prepared
  })
  return options
}
function suppliedReattachmentOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (!ownsMachiReattachment(state[side])) return []
  return (state.battlefield?.entities ?? [])
    .filter((entry) => entry.detachedForearm && entry.present)
    .map((entry) => {
      const command = { action: 'machi-reattach' as const, target: entry.id }
      return {
        command,
        labelFr: `Nen Stitches · Rattacher l’avant-bras ${entry.detachedForearm!.part === 'left-forearm' ? 'gauche' : 'droit'} · ${patientFor(state, entry) === 'player' ? 'P1' : 'P2'}`,
        labelEn: `Nen Stitches · Reattach ${entry.detachedForearm!.part === 'left-forearm' ? 'left' : 'right'} forearm · ${patientFor(state, entry) === 'player' ? 'P1' : 'P2'}`,
        ready: performMachiReattachment({ state, side, command }) !== state,
        conditionFr:
          'Avant-bras original, patient vivant et consentant, aura des bras relâchée (Zetsu ou Ko ailleurs), aiguille physique, deux mains libres et contact continu. Aucun PV ni tissu recréé. Ménager les bras après la suture.',
        conditionEn:
          'Original forearm, living consenting patient, relaxed arm aura (Zetsu or Ko elsewhere), a physical needle, two free hands and continuous contact. No HP or tissue regrown. Rest the arms after stitching.',
      }
    })
}
