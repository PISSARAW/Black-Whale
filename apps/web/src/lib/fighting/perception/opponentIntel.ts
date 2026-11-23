import { senseDeprived } from '../saiyuSenses'
import type { ArcadeFighter, FightSide, FightState } from '../types'

export type ObservedCondition =
  | 'painPacker'
  | 'cyclotron'
  | 'seiyaku'
  | 'tsk17'
  | 'emperorTime'
  | 'catsName'

export interface OpponentIntel {
  /** Clean unblocked hits landed on the opponent during the current round. */
  cleanHitsLanded: number
  /** Sequence number of the last impact already accounted for. */
  lastImpactSequence: number
  /** Whether the opponent has visibly manifested active Nen (Ren/Ken/Ko/Ryu/Hatsu). */
  auraObserved: boolean
  /** Whether the opponent has been seen spending their defensive Burst this round. */
  burstUsedSeen: boolean
  /** Whether the opponent's Kameo partner has entered the stage at least once. */
  kameoRevealed: boolean
  /** Hatsu conditions or charges observed in action during the match. */
  revealedConditions: readonly ObservedCondition[]
}

declare module '../types' {
  interface FightState {
    /** Per-observer match intel accumulated deterministically from observable events. */
    opponentIntel?: Record<FightSide, OpponentIntel>
  }
}

export function createOpponentIntel(): OpponentIntel {
  return {
    cleanHitsLanded: 0,
    lastImpactSequence: 0,
    auraObserved: false,
    burstUsedSeen: false,
    kameoRevealed: false,
    revealedConditions: [],
  }
}

export function createFightIntel(): Record<FightSide, OpponentIntel> {
  return {
    player: createOpponentIntel(),
    opponent: createOpponentIntel(),
  }
}

/**
 * Carries structural match deductions across rounds (revealed Kameo, observed aura style,
 * discovered Hatsu conditions) while resetting round-local counters (Burst, clean hits).
 */
export function carryOpponentIntel(
  previous?: Record<FightSide, OpponentIntel>,
): Record<FightSide, OpponentIntel> {
  if (!previous) return createFightIntel()
  return {
    player: carrySideIntel(previous.player),
    opponent: carrySideIntel(previous.opponent),
  }
}

function carrySideIntel(previous: OpponentIntel): OpponentIntel {
  return {
    cleanHitsLanded: 0,
    lastImpactSequence: 0,
    auraObserved: previous.auraObserved,
    burstUsedSeen: false,
    kameoRevealed: previous.kameoRevealed,
    revealedConditions: [...previous.revealedConditions],
  }
}

/** Updates both sides' opponent intel deterministically at the end of a simulated frame. */
export function advanceOpponentIntel(state: FightState): FightState {
  if (state.phase !== 'fighting') return state
  const current = state.opponentIntel ?? createFightIntel()
  const playerIntel = updateSideIntel(state, 'player', current.player)
  const opponentIntel = updateSideIntel(state, 'opponent', current.opponent)
  if (
    state.opponentIntel &&
    playerIntel === current.player &&
    opponentIntel === current.opponent
  ) {
    return state
  }
  return {
    ...state,
    opponentIntel: { player: playerIntel, opponent: opponentIntel },
  }
}

function updateSideIntel(
  state: FightState,
  observerSide: FightSide,
  prev: OpponentIntel,
): OpponentIntel {
  const observer = state[observerSide]
  const targetSide: FightSide = observerSide === 'player' ? 'opponent' : 'player'
  const target = state[targetSide]
  const blinded = senseDeprived(observer, 'sight')

  const impactHit = detectCleanHit(state, observerSide, prev.lastImpactSequence)
  const next: OpponentIntel = {
    cleanHitsLanded: impactHit ? prev.cleanHitsLanded + 1 : prev.cleanHitsLanded,
    lastImpactSequence: impactHit ? state.impact!.sequence : prev.lastImpactSequence,
    auraObserved: prev.auraObserved || (!blinded && hasVisibleActiveNen(target)),
    burstUsedSeen: prev.burstUsedSeen || (!blinded && state.burst?.side === targetSide),
    kameoRevealed: prev.kameoRevealed || (!blinded && isKameoVisible(state, targetSide)),
    revealedConditions: blinded
      ? prev.revealedConditions
      : mergeObservedConditions(prev.revealedConditions, state, targetSide),
  }
  return intelUnchanged(prev, next) ? prev : next
}

function intelUnchanged(prev: OpponentIntel, next: OpponentIntel): boolean {
  return (
    prev.cleanHitsLanded === next.cleanHitsLanded &&
    prev.lastImpactSequence === next.lastImpactSequence &&
    prev.auraObserved === next.auraObserved &&
    prev.burstUsedSeen === next.burstUsedSeen &&
    prev.kameoRevealed === next.kameoRevealed &&
    prev.revealedConditions === next.revealedConditions
  )
}

function detectCleanHit(state: FightState, observerSide: FightSide, lastSeq: number): boolean {
  const impact = state.impact
  if (!impact || impact.sequence <= lastSeq) return false
  if (impact.attacker !== observerSide) return false
  return !impact.blocked && !impact.avoided && !impact.invulnerable && impact.damage > 0
}

function hasVisibleActiveNen(target: ArcadeFighter): boolean {
  if (target.nen.in || target.nen.mode === 'zetsu') return false
  return Boolean(
    target.nen.mode === 'ren' ||
      target.nen.ken ||
      target.nen.ko ||
      target.nen.en ||
      target.attack?.hatsuSource,
  )
}

function isKameoVisible(state: FightState, targetSide: FightSide): boolean {
  const slot = state.kameos?.[targetSide]
  return Boolean(slot && slot.phase !== 'reserve')
}

function mergeObservedConditions(
  existing: readonly ObservedCondition[],
  state: FightState,
  targetSide: FightSide,
): readonly ObservedCondition[] {
  const target = state[targetSide]
  const discovered = collectActiveConditions(state, target)
  const added = discovered.filter((item) => !existing.includes(item))
  return added.length > 0 ? [...existing, ...added] : existing
}

function collectActiveConditions(state: FightState, target: ArcadeFighter): ObservedCondition[] {
  const found: ObservedCondition[] = []
  if (target.hatsuEffects.painPacker?.sun) found.push('painPacker')
  if (target.cyclotronWindup) found.push('cyclotron')
  if (target.tskPoisoned) found.push('tsk17')
  if (target.kurapika?.emperorTime) found.push('emperorTime')
  if (state.catsName) found.push('catsName')
  return found
}
