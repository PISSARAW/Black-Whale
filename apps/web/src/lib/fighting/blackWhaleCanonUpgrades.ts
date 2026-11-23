import { FIGHT_FPS } from './fightClock'
import { nenMentalFatigueRatio } from './nenCognitiveLoad'
import { saiyuAudioCuesMuted } from './finalFiveUpgrades'
import type { FightStageId } from './stages'
import type { ArcadeFighter, FighterId, FightInput, FightSide, FightState } from './types'

export const STEALTH_DOLPHIN_LIFE_DPS = 2.5
/** Two warnings are shown in the published material; the third effect remains unknown. */
export const TSERRIEDNICH_MAX_LIES = 2
export const BENJAMIN_ROYAL_GUARDS: readonly FighterId[] = ['musse', 'furykov', 'rihan']
export const VOCONTE_DEFAULT_DESTINATION = 'heilly-hideout'

export interface MelodyHeartbeatReading {
  bluffing: boolean
  onNearCritical: boolean
  mentalFatigueHigh: boolean
  seiyakuActive: boolean
}

declare module './types' {
  interface ArcadeFighter {
    benjaminInheritedHatsus?: FighterId[]
    tserriednichLieMarks?: number
    tserriednichBeastSealed?: boolean
    tserriednichLastLieFrame?: number
  }
  interface FightState {
    voconteRoomTransitionCount?: number
  }
}

/** Cat's Name is post-mortem Nen. Zetsu was Camilla's tactic, not a revealed condition. */
export function camillaCatsNameEligible(_victim: ArcadeFighter): boolean {
  return true
}

/** 2. Kurapika: holding an unused stolen Hatsu traps him in Emperor Time with continuous life drain. */
export function kurapikaDolphinTrapped(fighter: ArcadeFighter): boolean {
  return Boolean(fighter.kurapika?.held && !fighter.kurapika.held.used)
}

export function stepKurapikaDolphinDrain(fighter: ArcadeFighter): ArcadeFighter {
  if (!kurapikaDolphinTrapped(fighter) || fighter.health <= 1) return fighter
  return {
    ...fighter,
    health: Math.max(1, fighter.health - STEALTH_DOLPHIN_LIFE_DPS / FIGHT_FPS),
    kurapika: fighter.kurapika ? { ...fighter.kurapika, emperorTime: true } : fighter.kurapika,
  }
}

/** 3. Melody: passive heartbeat reading (no Gyo) detects bluffs, critical On, mental fatigue, and Seiyaku. */
export function readMelodyHeartbeat(
  state: FightState,
  melodySide: FightSide,
  opponentInput?: FightInput,
): MelodyHeartbeatReading | null {
  const melody = state[melodySide]
  if ((melody.nenOwner ?? melody.id) !== 'melody' || saiyuAudioCuesMuted(melody)) return null
  const foe = state[melodySide === 'player' ? 'opponent' : 'player']
  return {
    bluffing: Boolean(opponentInput?.call),
    onNearCritical: Boolean(foe.nen.on || foe.health <= 30),
    mentalFatigueHigh: nenMentalFatigueRatio(foe) >= 0.35,
    seiyakuActive: Boolean(foe.seiyaku),
  }
}

/** Benjamin inherits only after an eligible loyal private-army soldier actually dies. */
export function inheritBenjaminGuardKameo(
  leader: ArcadeFighter,
  guardId: FighterId,
  guardDead = false,
): ArcadeFighter {
  if ((leader.nenOwner ?? leader.id) !== 'benjamin') return leader
  if (!guardDead || !BENJAMIN_ROYAL_GUARDS.includes(guardId)) return leader
  const current = leader.benjaminInheritedHatsus ?? []
  if (current.includes(guardId)) return leader
  return { ...leader, benjaminInheritedHatsus: [...current, guardId] }
}

/**
 * Tserriednich's Guardian Spirit Beast records the two published warnings.
 * The consequence of a third lie is deliberately not simulated because it has not been revealed.
 */
export function recordTserriednichLie(target: ArcadeFighter, frame: number): ArcadeFighter {
  if (target.tserriednichLastLieFrame === frame) return target
  const marks = Math.min(TSERRIEDNICH_MAX_LIES, (target.tserriednichLieMarks ?? 0) + 1)
  return { ...target, tserriednichLieMarks: marks, tserriednichLastLieFrame: frame }
}

function stepTserriednichBeast(
  state: FightState,
  inputs: { player: FightInput; opponent?: FightInput },
): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    if ((next[side].nenOwner ?? next[side].id) !== 'tserriednich') continue
    const foeSide: FightSide = side === 'player' ? 'opponent' : 'player'
    const foe = next[foeSide]
    const foeInput = inputs[foeSide]
    const lied = Boolean(foeInput?.call)
    if (lied) next = { ...next, [foeSide]: recordTserriednichLie(foe, next.frame) }
  }
  return next
}

/** Legacy entry point; real frame traversal is handled by the Door arena system. */
export function triggerVoconteArenaTransition(
  state: FightState,
  targetArenaId: FightStageId = VOCONTE_DEFAULT_DESTINATION,
): FightState {
  void targetArenaId
  return state
}

export function advanceBlackWhaleCanonUpgrades(
  state: FightState,
  inputs: { player: FightInput; opponent?: FightInput },
): FightState {
  if (state.phase !== 'fighting') return state
  let next = stepTserriednichBeast(state, inputs)
  next = {
    ...next,
    player: stepKurapikaDolphinDrain(next.player),
    opponent: stepKurapikaDolphinDrain(next.opponent),
  }
  return next
}
