import { beginCatsName } from './camillaCat'
import { finishFight } from './combatVerdict'
import { FIGHT_FPS } from './fightClock'
import type { ArcadeFighter, FightSide, FightState } from './types'

export const TSK17_BASE_DPS = 6
export const TSK17_ZETSU_MULTIPLIER = 1.45

export interface Tsk17State {
  releasedBy: FightSide
  frame: number
}

declare module './types' {
  interface ArcadeFighter {
    tskPoisoned?: boolean
    tskPoisonSource?: FightSide
  }
  interface FightState {
    tsk17?: Tsk17State
  }
}

const isBenjamin = (fighter: ArcadeFighter) => (fighter.nenOwner ?? fighter.id) === 'benjamin'
const isCamilla = (fighter: ArcadeFighter) => (fighter.nenOwner ?? fighter.id) === 'camilla'

export function canReleaseTsk17(state: FightState, side: FightSide): boolean {
  return (
    state.phase === 'fighting' &&
    !state.tsk17 &&
    !state.catsName &&
    isBenjamin(state[side]) &&
    state[side].health > 0
  )
}

/** Releases the TSK-17 biological weapon, poisoning both fighters simultaneously. */
export function releaseTsk17(state: FightState, side: FightSide): FightState {
  if (!canReleaseTsk17(state, side)) return state
  return {
    ...state,
    tsk17: { releasedBy: side, frame: state.frame },
    player: { ...state.player, tskPoisoned: true, tskPoisonSource: side },
    opponent: { ...state.opponent, tskPoisoned: true, tskPoisonSource: side },
  }
}

/** Per-frame poison damage; Zetsu removes Nen protection (x1.45). */
export function tsk17TickDamage(fighter: ArcadeFighter): number {
  if (!fighter.tskPoisoned || fighter.health <= 0) return 0
  const factor = fighter.nen.mode === 'zetsu' ? TSK17_ZETSU_MULTIPLIER : 1
  const catalyst = (fighter.erigeronCatalystFrames ?? 0) > 0 ? 2 : 1
  return (TSK17_BASE_DPS * factor * catalyst) / FIGHT_FPS
}

function poisonFighter(fighter: ArcadeFighter): ArcadeFighter {
  const damage = tsk17TickDamage(fighter)
  if (damage <= 0) return fighter
  const health = Math.max(0, fighter.health - damage)
  return { ...fighter, health }
}

function findSide(state: FightState, predicate: (f: ArcadeFighter) => boolean): FightSide | null {
  if (predicate(state.player)) return 'player'
  if (predicate(state.opponent)) return 'opponent'
  return null
}

/**
 * Deterministic TSK-17 resolution for Benjamin vs Camilla (and general poison KO):
 * - Benjamin reaches 0 HP first (or same frame as Camilla): Benjamin wins (Cat's Name has no live target).
 * - Camilla reaches 0 HP first while Benjamin is alive: Cat's Name executes Benjamin and revives Camilla,
 *   keeping `tskPoisoned: true` on Camilla for the next round.
 */
function resolveTsk17Outcome(state: FightState): FightState {
  const benjaminSide = findSide(state, isBenjamin)
  const camillaSide = findSide(state, isCamilla)
  if (benjaminSide && camillaSide) {
    return resolveBenjaminVsCamilla(state, benjaminSide, camillaSide)
  }
  const deadPlayer = state.player.health <= 0 && Boolean(state.player.tskPoisoned)
  const deadOpponent = state.opponent.health <= 0 && Boolean(state.opponent.tskPoisoned)
  if (!deadPlayer && !deadOpponent) return state
  if (deadPlayer && deadOpponent) return finishFight(state, state.tsk17?.releasedBy ?? 'player', 'knockout')
  const deadSide: FightSide = deadPlayer ? 'player' : 'opponent'
  const otherSide: FightSide = deadSide === 'player' ? 'opponent' : 'player'
  if (isCamilla(state[deadSide])) return beginCatsName(state, deadSide, otherSide)
  return finishFight(state, otherSide, 'knockout')
}

function resolveBenjaminVsCamilla(
  state: FightState,
  benjaminSide: FightSide,
  camillaSide: FightSide,
): FightState {
  const benjaminDead = state[benjaminSide].health <= 0
  const camillaDead = state[camillaSide].health <= 0
  if (!benjaminDead && !camillaDead) return state
  if (benjaminDead) {
    // Same-frame death OR Benjamin dies first: Cat's Name fails without a living target; Benjamin wins.
    if (state[camillaSide].tskPoisoned) return finishFight(state, benjaminSide, 'knockout')
    return finishFight(state, camillaSide, 'knockout')
  }
  // Camilla reaches 0 HP first while Benjamin is still alive: Cat's Name triggers.
  return beginCatsName(state, camillaSide, benjaminSide)
}

/** Advances TSK-17 poison damage once per frame and resolves fatal ticks deterministically. */
export function advanceTsk17(state: FightState): FightState {
  if (state.phase !== 'fighting' || state.catsName || state.gumResuscitation) return state
  if (!state.player.tskPoisoned && !state.opponent.tskPoisoned) return state
  const next: FightState = {
    ...state,
    player: poisonFighter(state.player),
    opponent: poisonFighter(state.opponent),
  }
  return resolveTsk17Outcome(next)
}

/** Persists TSK-17 poisoning on Camilla across rounds after a Cat's Name resurrection. */
export function carryTskPoison(fighter: ArcadeFighter, previous: ArcadeFighter): ArcadeFighter {
  if (!previous.tskPoisoned || !isCamilla(fighter)) return fighter
  return { ...fighter, tskPoisoned: true, tskPoisonSource: previous.tskPoisonSource }
}
