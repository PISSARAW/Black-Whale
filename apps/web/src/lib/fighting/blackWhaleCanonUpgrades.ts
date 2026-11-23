import { FIGHT_FPS } from './fightClock'
import { nenMentalFatigueRatio } from './nenCognitiveLoad'
import { saiyuAudioCuesMuted } from './finalFiveUpgrades'
import type { ArcadeFighter, FighterId, FightInput, FightSide, FightState } from './types'

export const STEALTH_DOLPHIN_LIFE_DPS = 2.5
export const TSERRIEDNICH_MAX_LIES = 3
export const TSERRIEDNICH_PUNISH_ZETSU_FRAMES = 300
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

/** 1. Camilla: Cat's Name activates on fatal blow only if Camilla is in Zetsu (or TSK-17 poisoned). */
export function camillaCatsNameEligible(victim: ArcadeFighter): boolean {
  return victim.nen.mode === 'zetsu' || Boolean(victim.tskPoisoned)
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

/** 4. Benjamin: inherits a fallen/heavy-struck royal guard Kameo's Hatsu (Musse, Furykov, Rihan). */
export function inheritBenjaminGuardKameo(
  leader: ArcadeFighter,
  guardId: FighterId,
): ArcadeFighter {
  if ((leader.nenOwner ?? leader.id) !== 'benjamin') return leader
  if (!BENJAMIN_ROYAL_GUARDS.includes(guardId)) return leader
  const current = leader.benjaminInheritedHatsus ?? []
  if (current.includes(guardId)) return leader
  return { ...leader, benjaminInheritedHatsus: [...current, guardId] }
}

/** 5. Tserriednich: his Nen Beast marks liars (bluff call, Texture Surprise, In); 3 marks = Zetsu + seal. */
export function recordTserriednichLie(target: ArcadeFighter, frame: number): ArcadeFighter {
  if (target.tserriednichLastLieFrame === frame) return target
  const marks = Math.min(TSERRIEDNICH_MAX_LIES, (target.tserriednichLieMarks ?? 0) + 1)
  if (marks >= TSERRIEDNICH_MAX_LIES) {
    return {
      ...target,
      tserriednichLieMarks: marks,
      tserriednichLastLieFrame: frame,
      tserriednichBeastSealed: true,
      burstZetsuFrames: Math.max(target.burstZetsuFrames ?? 0, TSERRIEDNICH_PUNISH_ZETSU_FRAMES),
    }
  }
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
    const lied = Boolean(foeInput?.call || foe.textureSurprise || (foe.nen.in && foe.attack))
    if (lied) next = { ...next, [foeSide]: recordTserriednichLie(foe, next.frame) }
  }
  return next
}

/** 6. Voconte: crossing the Door threshold transitions the fight to another Black Whale room. */
export function triggerVoconteArenaTransition(
  state: FightState,
  targetArenaId = VOCONTE_DEFAULT_DESTINATION,
): FightState {
  return {
    ...state,
    arenaId: targetArenaId,
    voconteRoomTransitionCount: (state.voconteRoomTransitionCount ?? 0) + 1,
  }
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
