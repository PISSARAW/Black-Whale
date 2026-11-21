import { machiSourceActive } from './machiThread'
import type { ArsenalInvocation, ArsenalOption } from './retrospectiveTypes'
import type { ArcadeFighter, FightSide, FightState } from './types'

/**
 * Machi's threads exist physically. A finite spool is shared by every engaged
 * strand: the thread on the opponent, the anchor, a trap, a suture or a
 * reattachment. A cut strand is lost for the round. Lengths are duel tuning.
 */
export const MACHI_SPOOL = 64
export const MACHI_DEFAULT_THREAD = 16
export const MACHI_TRAP_THREAD = 8
export const MACHI_TRAP_SPAN = 4
export const MACHI_TREATMENT_THREAD = 6
export const MACHI_TRAP_LIMIT = 2

export interface MachiTrap {
  x: number
  length: number
}

declare module './types' {
  interface ArcadeFighter {
    machiTraps?: readonly MachiTrap[]
    machiSpoolLost?: number
  }
}

export const other = (side: FightSide): FightSide => (side === 'player' ? 'opponent' : 'player')

function threadOnTarget(state: FightState, side: FightSide): number {
  const thread = state[other(side)].machiThread
  return thread?.owner === side ? (thread.length ?? MACHI_DEFAULT_THREAD) : 0
}

/** Every strand currently out of Machi's hands, whatever it is doing. */
export function machiEngagedThread(state: FightState, side: FightSide): number {
  const actor = state[side]
  const anchor = actor.machiAnchor?.attached ? actor.machiAnchor.length : 0
  const treatment =
    (actor.machiSuture ? MACHI_TREATMENT_THREAD : 0) +
    (actor.machiReattachment ? MACHI_TREATMENT_THREAD : 0)
  const traps = (actor.machiTraps ?? []).reduce((sum, trap) => sum + trap.length, 0)
  return threadOnTarget(state, side) + anchor + treatment + traps
}

export function machiAvailableThread(state: FightState, side: FightSide): number {
  const lost = state[side].machiSpoolLost ?? 0
  return Math.max(0, MACHI_SPOOL - lost - machiEngagedThread(state, side))
}

/** Thread a command would newly take from the spool; strands it replaces are given back. */
function requestedThread(state: FightState, side: FightSide, invocation: ArsenalInvocation) {
  const { action, target } = invocation.command
  if (action === 'machi-suture' || action === 'machi-reattach') return MACHI_TREATMENT_THREAD
  if (action === 'machi-trap') return MACHI_TRAP_THREAD
  if (action === 'machi-length') return Number(target) - threadOnTarget(state, side)
  if (action !== 'machi-anchor') return 0
  const object = state.battlefield?.entities.find((entry) => entry.id === target)
  const held = state[side].machiAnchor?.attached ? state[side].machiAnchor!.length : 0
  return object ? Math.max(1, Math.abs(state[side].x - object.x)) - held : 0
}

export function machiSpoolAllows(invocation: ArsenalInvocation): boolean {
  const { state, side } = invocation
  return requestedThread(state, side, invocation) <= machiAvailableThread(state, side)
}

/** A new strike thread needs a default strand; it replaces Machi's previous one. */
export function machiStrikeThreadAvailable(state: FightState, side: FightSide): boolean {
  return MACHI_DEFAULT_THREAD - threadOnTarget(state, side) <= machiAvailableThread(state, side)
}

export function performMachiSpool({ state, side, command }: ArsenalInvocation): FightState {
  if (command.action === 'machi-trap') return layTrap(state, side)
  if (command.action === 'machi-cut') return cutOwnThread(state, side, command.target)
  return state
}

function layTrap(state: FightState, side: FightSide): FightState {
  const actor = state[side],
    traps = actor.machiTraps ?? []
  if (traps.length >= MACHI_TRAP_LIMIT || actor.y > 0) return state
  if (traps.some((trap) => Math.abs(trap.x - actor.x) < MACHI_TRAP_SPAN * 2)) return state
  if (machiAvailableThread(state, side) < MACHI_TRAP_THREAD) return state
  const trap = { x: actor.x, length: MACHI_TRAP_THREAD }
  return { ...state, [side]: { ...actor, machiTraps: [...traps, trap] } }
}

function cutOwnThread(state: FightState, side: FightSide, target?: string): FightState {
  const actor = state[side]
  if (target === 'trap') {
    const [first, ...rest] = actor.machiTraps ?? []
    if (!first) return state
    return { ...state, [side]: { ...lose(actor, first.length), machiTraps: rest } }
  }
  const victim = state[other(side)],
    length = threadOnTarget(state, side)
  if (!length) return state
  return {
    ...state,
    [side]: lose(actor, length),
    [other(side)]: {
      ...victim,
      machiThread: undefined,
      hatsuEffects: { ...victim.hatsuEffects, stitchedFrames: 0 },
    },
  }
}

export function lose(actor: ArcadeFighter, length: number): ArcadeFighter {
  return { ...actor, machiSpoolLost: (actor.machiSpoolLost ?? 0) + length }
}

export function machiSpoolOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (!machiSourceActive(state[side])) return []
  const entries = [
    {
      command: { action: 'machi-trap' as const },
      fr: 'Fil · Poser un piège',
      en: 'Thread · Lay a trap',
    },
    {
      command: { action: 'machi-cut' as const, target: 'thread' },
      fr: 'Fil · Couper le fil sur l’adversaire',
      en: 'Thread · Cut the thread on the opponent',
    },
    {
      command: { action: 'machi-cut' as const, target: 'trap' },
      fr: 'Fil · Couper le plus ancien piège',
      en: 'Thread · Cut the oldest trap',
    },
  ]
  const free = machiAvailableThread(state, side)
  return entries.map(({ command, fr, en }) => ({
    command,
    labelFr: fr,
    labelEn: en,
    ready: performMachiSpool({ state, side, command }) !== state,
    conditionFr: `Bobine finie : ${free} sur ${MACHI_SPOOL} disponibles. Un fil engagé ailleurs n’est plus disponible ; un fil coupé est perdu pour la manche. Le piège n’immobilise que si Machi le tient de près.`,
    conditionEn: `Finite spool: ${free} of ${MACHI_SPOOL} available. A strand engaged elsewhere is unavailable; a cut strand is lost for the round. A trap only holds while Machi keeps it short and in hand.`,
  }))
}
