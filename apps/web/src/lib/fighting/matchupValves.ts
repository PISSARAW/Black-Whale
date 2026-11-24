import { finishFight } from './combatVerdict'
import { lsdfJurisdiction } from './lsdf'
import { clearMusseOwl } from './musseWindowUpgrades'
import type { ArcadeFighter, FightInput, FightSide, FightState } from './types'

export const CAMILLA_CAPTURE_HP_THRESHOLD = 15
export const RIHAN_TACTICAL_DEFENCE_FACTOR = 1
export const YOKOTANI_DEFENSE_LINE_DISTANCE = 10
export const KURAPIKA_ACTIVE_CHAIN_DRAIN_FACTOR = 1.5

declare module './types' {
  interface ArcadeFighter {
    rihanTacticalRead?: boolean
    dowsingBluffDetected?: boolean
  }
  interface FightInput {
    subdue?: boolean
  }
}

/** 2. Camilla: if she enters Zetsu at <= 15% HP, opponent can subdue/capture her without waking Cat's Name. */
export function canSubdueCamilla(state: FightState, actorSide: FightSide): boolean {
  const foe = state[actorSide === 'player' ? 'opponent' : 'player']
  const isCamilla = (foe.nenOwner ?? foe.id) === 'camilla'
  return (
    state.phase === 'fighting' &&
    isCamilla &&
    foe.nen.mode === 'zetsu' &&
    foe.health > 0 &&
    foe.health <= CAMILLA_CAPTURE_HP_THRESHOLD
  )
}

export function subdueCamillaWithoutKill(state: FightState, actorSide: FightSide): FightState {
  if (!canSubdueCamilla(state, actorSide)) return state
  return finishFight(state, actorSide, 'technical-knockout')
}

/** Yokotani's jurisdiction uses the prepared hideout, Morena, and unlawful-intruder facts. */
export function yokotaniIntrusionBreached(state: FightState, intruderSide: FightSide): boolean {
  const yokotaniSide: FightSide = intruderSide === 'player' ? 'opponent' : 'player'
  return lsdfJurisdiction(state, yokotaniSide)
}

/** Legacy entry point: observation does not grant Rihan a generic defensive buff. */
export function activateRihanTacticalRead(state: FightState, rihanSide: FightSide): FightState {
  void rihanSide
  return state
}

export function rihanTacticalDefenceFactor(defender: ArcadeFighter): number {
  void defender
  return 1
}

/** 5. Tserriednich: Zetsu concentration is broken by Ren Malice, sound attacks, or active remote Kameo. */
export function tserriednichConcentrationBroken(state: FightState, tserSide: FightSide): boolean {
  const tser = state[tserSide]
  if ((tser.nenOwner ?? tser.id) !== 'tserriednich') return false
  if (tser.nen.mode !== 'zetsu') return false
  const foeSide: FightSide = tserSide === 'player' ? 'opponent' : 'player'
  const foe = state[foeSide]
  const soundThreat = [foe.melodyPerformance, foe.battleCantabile].some(Boolean)
  const kameoActing = state.kameos?.[foeSide]?.phase === 'acting'
  const fearStaggered = tser.hitStun > 0 && Boolean(tser.fearCooldownFrames)
  return [soundThreat, kameoActing, fearStaggered].some(Boolean)
}

/** 6. Kurapika: Dowsing Chain detects `call` bluffs outside the Troupe; active chains accelerate Emperor Time cost. */
export function kurapikaDowsingDetectsBluff(
  state: FightState,
  kurapikaSide: FightSide,
  opponentInput?: FightInput,
): boolean {
  const kura = state[kurapikaSide]
  return (kura.nenOwner ?? kura.id) === 'kurapika' && Boolean(opponentInput?.call)
}

export function kurapikaChainDrainMultiplier(fighter: ArcadeFighter): number {
  return fighter.chainJail || fighter.drainingChain ? KURAPIKA_ACTIVE_CHAIN_DRAIN_FACTOR : 1
}

/** Golden Rule: Burst or exhaustion-forced Zetsu clears absolute binary locks so no 9-1 deadlock persists. */
export function releaseUniversalLocksOnBurst(state: FightState, side: FightSide): FightState {
  const f = state[side]
  if (!((f.burstZetsuFrames ?? 0) > 0 || f.auraExhausted)) return state
  let next: FightState = {
    ...state,
    [side]: {
      ...f,
      tserriednichBeastSealed: undefined,
      halkenburgSwappedFrames: undefined,
      illumiNeedleOrder: undefined,
      needlePuppet: undefined,
      hinrighCuffed: undefined,
      biohazardRestraint: undefined,
      hatsuEffects: { ...f.hatsuEffects, senseSeals: 0, possessedFrames: 0 },
    },
  }
  if (next.musseOwl?.target === side) next = clearMusseOwl(next)
  return next
}

export function advanceMatchupValves(
  state: FightState,
  inputs: { player: FightInput; opponent?: FightInput },
): FightState {
  if (state.phase !== 'fighting') return state
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    next = releaseUniversalLocksOnBurst(next, side)
    const foeSide: FightSide = side === 'player' ? 'opponent' : 'player'
    if (inputs[side]?.context && canSubdueCamilla(next, side)) {
      return subdueCamillaWithoutKill(next, side)
    }
    if (kurapikaDowsingDetectsBluff(next, side, inputs[foeSide])) {
      next = { ...next, [side]: { ...next[side], dowsingBluffDetected: true } }
    }
    if (tserriednichConcentrationBroken(next, side)) {
      next = {
        ...next,
        [side]: { ...next[side], attack: null, hitStun: Math.max(next[side].hitStun, 8) },
      }
    }
  }
  return next
}
