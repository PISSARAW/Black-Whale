import { guestProjection, mergeGuestProjection } from './rosterGuests'
import { finishFight } from './combatVerdict'
import { wakeHanzoBody } from './hanzoProjection'
import type { FightDeathCause } from './fightDeaths'
import type { ArcadeFighter, FightSide, FightState } from './types'

export const CAT_SUMMON_END = 24
export const CAT_CAPTURE_END = 48
export const CAT_ABSORB_END = 84
export const CATS_NAME_FRAMES = 120
export type CatsNamePhase = 'summon' | 'capture' | 'absorb' | 'revive'
export interface CatsNameSequence {
  killerBody?: string
  victimBody?: string
  victimSide: FightSide
  killerSide: FightSide
  frame: number
}

export interface CatsNameFatality {
  victimSide: FightSide
  killerSide: FightSide
  cause: FightDeathCause
  zetsu: boolean
  ten?: true
}

export function catsNamePhase(frame: number): CatsNamePhase {
  if (frame < CAT_SUMMON_END) return 'summon'
  if (frame < CAT_CAPTURE_END) return 'capture'
  return frame < CAT_ABSORB_END ? 'absorb' : 'revive'
}

/** Post-mortem Nen works without live aura or a mandatory Zetsu condition (ch. 373). */
function ordinaryTen(victim: FightState['player']): boolean {
  const { nen } = victim
  return (
    nen.mode === 'ten' &&
    !nen.ken &&
    !nen.ko &&
    !nen.on &&
    !nen.in &&
    !victim.auraExhausted &&
    victim.aura > 0
  )
}

export function beginCatsName(
  state: FightState,
  {
    victimSide,
    killerSide,
    cause = state.deaths?.find(
      (death) => death.victimSide === victimSide && death.killerSide === killerSide,
    )?.cause,
  }: { victimSide: FightSide; killerSide: FightSide; cause?: FightDeathCause },
): FightState {
  if (state.catsName || state[victimSide].health > 0) return state
  if (victimSide === killerSide || state[killerSide].health <= 0) return state
  const victim = state[victimSide]
  return {
    ...state,
    catsName: { victimSide, killerSide, frame: 0 },
    catsNameConsumed: undefined,
    catsNameFatality: cause
      ? {
          victimSide,
          killerSide,
          cause,
          zetsu: victim.nen.mode === 'zetsu',
          ...(ordinaryTen(victim) ? { ten: true } : {}),
        }
      : undefined,
    deaths: undefined,
    hitstop: 0,
    player: freezeBody(state.player),
    opponent: freezeBody(state.opponent),
    projectiles: [],
    bungeeGum: null,
    gumNetwork: undefined,
    lsdf: undefined,
  }
}

function freezeBody(fighter: ArcadeFighter): ArcadeFighter {
  const body = wakeHanzoBody(fighter)
  return {
    ...body,
    attack: null,
    bufferedAttack: null,
    blocking: false,
    guardFrames: 0,
    hitStun: CATS_NAME_FRAMES,
    blockStun: 0,
    velocityY: 0,
    motion: undefined,
    pose: body.health <= 0 ? 'ko' : 'hit',
  }
}

/** Only the deterministic simulation advances the cat. Combat hazards stay frozen;
 * the living Emperor Time clock is advanced by the caller. */
export function advanceCatsName(state: FightState): FightState {
  const cat = state.catsName
  const guest = state.rosterGuests?.find(
    (entry) => entry.id === cat?.killerBody || entry.id === cat?.victimBody,
  )
  if (!guest) return advanceCatsNameBody(state)
  const view = guestProjection(state, guest)
  return mergeGuestProjection(state, advanceCatsNameBody(view), guest)
}

function advanceCatsNameBody(state: FightState): FightState {
  const cat = state.catsName
  if (!cat) return state
  const frame = cat.frame + 1
  const killer = state[cat.killerSide]
  const next = {
    ...state,
    frame: state.frame + 1,
    hitstop: 0,
    catsName: { ...cat, frame },
    catsNameConsumed: frame >= CAT_ABSORB_END ? cat.killerSide : undefined,
    [cat.killerSide]:
      frame >= CAT_CAPTURE_END ? { ...killer, health: 0, pose: 'ko' as const } : killer,
  }
  return frame >= CATS_NAME_FRAMES ? finishCatsName(next) : next
}

function finishCatsName(state: FightState): FightState {
  const cat = state.catsName!
  const restored = {
    ...state,
    catsName: undefined,
    catsNameFatality:
      state.mode !== 'training' && !cat.killerBody && !cat.victimBody
        ? state.catsNameFatality
        : undefined,
    deaths: undefined,
    player: releaseBody(state.player),
    opponent: releaseBody(state.opponent),
    [cat.victimSide]: {
      ...releaseBody(state[cat.victimSide]),
      health: state[cat.victimSide].maxHealth,
      openWounds: 0,
      gumWoundSeals: undefined,
      pluggingWounds: false,
      judgmentChain: undefined,
    },
    [cat.killerSide]: { ...releaseBody(state[cat.killerSide]), health: 0, pose: 'ko' as const },
  }
  // The killer is consumed while Camilla is still dead: there is no living victim for a mirror loop.
  if (state.mode !== 'training') return finishFight(restored, cat.victimSide, 'knockout')
  return {
    ...restored,
    catsNameConsumed: undefined,
    [cat.killerSide]: {
      ...restored[cat.killerSide],
      health: state[cat.killerSide].maxHealth,
      pose: 'idle' as const,
    },
    impact: null,
  }
}

function releaseBody(fighter: ArcadeFighter): ArcadeFighter {
  return {
    ...fighter,
    hitStun: 0,
    blockStun: 0,
    knockdownFrames: 0,
    wakeupInvulnerableFrames: 0,
    reversalWindow: 0,
    pose: 'idle',
  }
}
