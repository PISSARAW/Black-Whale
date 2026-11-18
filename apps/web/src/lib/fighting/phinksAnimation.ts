import type {
  ArcadeFighter,
  AttackKind,
  FighterId,
  FightImpact,
  FightSide,
  FightState,
} from './types'

export const PHINKS_TURN_ACCENT_FRAMES = 18
export const PHINKS_HIT_ACCENT_FRAMES = 24
export const PHINKS_IMPACT_FRAMES = 84
export const PHINKS_IMPACT_EVENT = 'phinks.charged-impact'
export interface PhinksAttackSnapshot {
  kind?: AttackKind
  source?: FighterId | null
  cyclotronTurns: number
}
export interface PhinksImpactSnapshot {
  impact: number | undefined
  actors: readonly PhinksAttackSnapshot[]
  cyclotronContacts?: readonly string[]
}
export interface PhinksChargedHit {
  id: string
  sequence: number
  owner: FightSide
  target: FightSide
  turns: number
  damage: number
}
export function phinksAttackSnapshot(fighter: ArcadeFighter): PhinksAttackSnapshot {
  return {
    kind: fighter.attack?.kind,
    source: fighter.attack?.hatsuSource,
    cyclotronTurns: fighter.attack?.cyclotronTurns ?? 0,
  }
}
function capturedTurns(attack: PhinksAttackSnapshot | undefined) {
  if (!attack || attack.kind !== 'special' || attack.source !== 'phinks') return 0
  return attack.cyclotronTurns
}
/** The current attack wins over an old charge; fallback only handles a same-frame trade. */
export function committedPhinksTurns(state: FightState, before: PhinksImpactSnapshot) {
  const hit = state.impact
  if (!hit) return 0
  const fighter = state[hit.attacker]
  const attack = fighter.attack
    ? phinksAttackSnapshot(fighter)
    : before.actors[hit.attacker === 'player' ? 0 : 1]
  return capturedTurns(attack)
}
function directWound(hit: FightImpact) {
  return (
    hit.kind === 'special' &&
    hit.projectileId === null &&
    hit.damage > 0 &&
    !hit.transfer &&
    !hit.objectTransfer
  )
}
function connected(hit: FightImpact) {
  return !hit.blocked && !hit.parried && !hit.avoided && !hit.invulnerable
}
export function phinksChargedHit(
  state: FightState,
  before: PhinksImpactSnapshot,
): PhinksChargedHit | null {
  const hit = state.impact
  if (!hit || hit.sequence === before.impact || !directWound(hit) || !connected(hit)) return null
  const turns = committedPhinksTurns(state, before)
  if (turns <= 0) return null
  return {
    id: `${hit.attacker}:cyclotron-hit:${hit.sequence}`,
    sequence: hit.sequence,
    owner: hit.attacker,
    target: hit.attacker === 'player' ? 'opponent' : 'player',
    turns,
    damage: hit.damage,
  }
}

/** Prefer exact recorded contacts. Legacy snapshots retain the direct-impact fallback. */
export function phinksChargedHits(
  state: FightState,
  before: PhinksImpactSnapshot,
): PhinksChargedHit[] {
  if (state.cyclotronContacts)
    return Object.values(state.cyclotronContacts).filter(
      (hit) => hit.round === state.roundNumber && !before.cyclotronContacts?.includes(hit.id),
    )
  const hit = phinksChargedHit(state, before)
  return hit ? [hit] : []
}
export function cyclotronContactKeys(state: FightState): string[] {
  return Object.values(state.cyclotronContacts ?? {}).map((hit) => hit.id)
}
