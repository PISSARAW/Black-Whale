import {
  performMachiReattachment,
  advanceMachiReattachment,
  machiReattachmentOptions,
} from './machiReattachment'
import { canAct } from './fightActorState'
import { machiSourceActive, MACHI_SUTURE_HEAL } from './machiThread'
import { isBiscuitTrueForm } from './biscuitForm'
import type { ArsenalInvocation, ArsenalOption } from './retrospectiveTypes'
import type { ArcadeFighter, FightSide, FightState } from './types'

declare module './types' {
  interface ArcadeFighter {
    machiAnchor?: { objectId: string; length: number; attached: boolean }
    machiSuture?: { target: FightSide; frames: number; x: number; y: number; health: number }
  }
}

/** Monotonic duel tuning: shorter attached strands hold more; detached strands weaken. */
export function machiThreadStrength(target: ArcadeFighter): number {
  const thread = target.machiThread
  if (!thread) return 0
  return (16 / Math.max(1, thread.length ?? 16)) * (thread.attached === false ? 0.1 : 1)
}
export function machiMaterialHolds(owner: ArcadeFighter, target: ArcadeFighter): boolean {
  const thread = target.machiThread
  if (!thread || thread.attached === false) return false
  const length = thread.length ?? 16
  const resistance = isBiscuitTrueForm(target) ? 4 : 1
  return (
    Math.hypot(owner.x - target.x, owner.y - target.y) <= length &&
    machiThreadStrength(target) >= resistance
  )
}

export function sutureWound(fighter: ArcadeFighter): ArcadeFighter {
  if (fighter.health <= 0 || (fighter.openWounds ?? 0) <= 0) return fighter
  return {
    ...fighter,
    openWounds: Math.max(0, (fighter.openWounds ?? 0) - 1),
    health: Math.min(fighter.maxHealth, fighter.health + MACHI_SUTURE_HEAL),
  }
}

export function performMachiMaterial({ state, side, command }: ArsenalInvocation): FightState {
  if (command.action === 'machi-reattach') return performMachiReattachment({ state, side, command })
  if (!machiMaterialReady(state, side)) return state
  if (command.action === 'machi-suture') return startSuture(state, side, command.target)
  if (command.action === 'machi-anchor') return anchorObject(state, side, command.target)
  if (command.action === 'machi-pull') return pullObject(state, side)
  return adjustThread({ state, side, command })
}
function machiMaterialReady(state: FightState, side: FightSide): boolean {
  const actor = state[side]
  return (
    state.phase === 'fighting' &&
    !state.catsName &&
    canAct(actor) &&
    !actor.attack &&
    !actor.machiSuture &&
    !actor.machiReattachment &&
    machiSourceActive(actor)
  )
}
function adjustThread({ state, side, command }: ArsenalInvocation): FightState {
  const actor = state[side]
  const target = side === 'player' ? 'opponent' : 'player'
  const thread = state[target].machiThread
  if (!thread || thread.owner !== side) return state
  if (command.action === 'machi-length') {
    const length = Number(command.target)
    const distance = Math.hypot(actor.x - state[target].x, actor.y - state[target].y)
    if (!Number.isFinite(length) || length < distance || length < 1 || length > 80) return state
    return { ...state, [target]: { ...state[target], machiThread: { ...thread, length } } }
  }
  if (command.action === 'machi-detach')
    return {
      ...state,
      [target]: {
        ...state[target],
        machiThread: { ...thread, kind: 'mark', attached: false },
        hatsuEffects: { ...state[target].hatsuEffects, stitchedFrames: 0 },
      },
    }
  return state
}

function startSuture(state: FightState, side: FightSide, requested?: string): FightState {
  if (requested !== 'player' && requested !== 'opponent') return state
  const actor = state[side],
    target = state[requested]
  if (target.health <= 0 || !target.openWounds || actor.aura < 20) return state
  if (requested !== side && !target.supportConsent) return state
  if (Math.hypot(actor.x - target.x, actor.y - target.y) > 5) return state
  return {
    ...state,
    [side]: {
      ...actor,
      aura: actor.aura - 20,
      machiSuture: {
        target: requested,
        frames: 30,
        x: target.x,
        y: target.y,
        health: target.health,
      },
    },
  }
}

function anchorObject(state: FightState, side: FightSide, id?: string): FightState {
  const actor = state[side]
  const object = state.battlefield?.entities.find(
    (entry) =>
      entry.id === id &&
      (entry.arena || entry.kind === 'crate') &&
      entry.present &&
      entry.health > 0 &&
      entry.material === 'real',
  )
  if (!object || actor.aura < 8 || Math.hypot(actor.x - object.x, actor.y - object.y) > 6)
    return state
  return {
    ...state,
    [side]: {
      ...actor,
      aura: actor.aura - 8,
      machiAnchor: {
        objectId: object.id,
        length: Math.max(1, Math.abs(actor.x - object.x)),
        attached: true,
      },
    },
  }
}

function pullObject(state: FightState, side: FightSide): FightState {
  const actor = state[side],
    anchor = actor.machiAnchor
  if (!anchor?.attached || actor.aura < 2) return state
  const object = attachedObject(state, anchor.objectId)
  if (!object || Math.abs(actor.x - object.x) > anchor.length || object.material !== 'real')
    return state
  const gap = actor.x - object.x
  if (Math.abs(gap) <= 4) return state
  const x = object.x + Math.sign(gap) * Math.min(2, Math.abs(gap) - 4)
  const enemy = state[side === 'player' ? 'opponent' : 'player']
  if (Math.abs(enemy.x - x) < 4) return state
  return {
    ...state,
    [side]: { ...actor, aura: actor.aura - 2 },
    battlefield: {
      ...state.battlefield!,
      entities: state.battlefield!.entities.map((entry) =>
        entry.id === object.id ? { ...entry, x } : entry,
      ),
    },
  }
}

function attachedObject(state: FightState, id: string) {
  return state.battlefield?.entities.find(
    (entry) => entry.id === id && entry.present && entry.health > 0,
  )
}
function sutureInterrupted(actor: ArcadeFighter, target: ArcadeFighter): boolean {
  const suture = actor.machiSuture!
  return (
    !machiSourceActive(actor) ||
    actor.hitStun > 0 ||
    Boolean(actor.attack) ||
    Math.hypot(target.x - suture.x, target.y - suture.y) > 1 ||
    target.health < suture.health ||
    (actor !== target && !target.supportConsent)
  )
}

export function advanceMachiMaterial(state: FightState): FightState {
  let next = advanceMachiReattachment(clearBrokenAnchors(state))
  for (const side of ['player', 'opponent'] as const) {
    const actor = next[side],
      suture = actor.machiSuture
    if (!suture) continue
    const target = next[suture.target]
    const interrupted = sutureInterrupted(actor, target)
    const frames = suture.frames - 1
    if (interrupted || frames <= 0) {
      next = { ...next, [side]: { ...actor, machiSuture: undefined } }
      if (!interrupted) next = { ...next, [suture.target]: sutureWound(next[suture.target]) }
    } else
      next = { ...next, [side]: { ...actor, pose: 'special', machiSuture: { ...suture, frames } } }
  }
  return next
}

function clearBrokenAnchors(state: FightState): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    const actor = next[side],
      anchor = actor.machiAnchor
    if (!anchor) continue
    const object = attachedObject(next, anchor.objectId)
    if (!object || !machiSourceActive(actor))
      next = { ...next, [side]: { ...actor, machiAnchor: undefined } }
  }
  return next
}

export function machiMaterialOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (!machiSourceActive(state[side])) return machiReattachmentOptions(state, side)
  const entries: { command: ArsenalInvocation['command']; fr: string; en: string }[] = [
    ...(['player', 'opponent'] as const).map((target) => ({
      command: { action: 'machi-suture' as const, target },
      fr: `Suturer une plaie · ${target === side ? 'Moi' : 'Autrui consentant'}`,
      en: `Suture a wound · ${target === side ? 'Self' : 'Consenting recipient'}`,
    })),
    {
      command: { action: 'machi-detach' },
      fr: 'Fil · Détacher des doigts',
      en: 'Thread · Detach from fingers',
    },
    {
      command: { action: 'machi-pull' },
      fr: 'Fil · Tirer l’objet attaché',
      en: 'Thread · Pull attached object',
    },
    ...[4, 8, 16, 32].map((length) => ({
      command: { action: 'machi-length' as const, target: String(length) },
      fr: `Longueur du fil · ${length}`,
      en: `Thread length · ${length}`,
    })),
    ...(state.battlefield?.entities ?? [])
      .filter(
        (entry) => (entry.arena || entry.kind === 'crate') && entry.present && entry.health > 0,
      )
      .map((entry) => ({
        command: { action: 'machi-anchor' as const, target: entry.id },
        fr: `Attacher le fil · ${entry.id}`,
        en: `Attach thread · ${entry.id}`,
      })),
  ]
  return [
    ...machiReattachmentOptions(state, side),
    ...entries.map(({ command, fr, en }) => ({
      command,
      labelFr: fr,
      labelEn: en,
      ready: performMachiMaterial({ state, side, command }) !== state,
      conditionFr:
        'Fil court plus résistant ; détaché des doigts, il s’affaiblit et ne maintient plus la ligature. La suture exige une plaie réelle, du temps et le consentement d’autrui. Elle ne recrée aucun membre. Longueurs, force et soin : réglages du duel.',
      conditionEn:
        'Shorter threads are stronger; detaching from fingers weakens them and releases the bind. Suturing requires a real wound, time and consent from another recipient. It cannot regrow a limb. Lengths, force and healing are duel tuning.',
    })),
  ]
}
