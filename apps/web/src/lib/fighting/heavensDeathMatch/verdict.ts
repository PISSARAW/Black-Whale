import { FIGHT_FPS } from '../fightClock'
import type { FightSide } from '../types'
import type { DeathMatchBeat } from './acts'

/** About ten narrative minutes between the death and the arrival of the rescue teams. */
export const RESCUE_DELAY_FRAMES = 10 * 60 * FIGHT_FPS

export type DeathCause = 'asphyxia' | 'trauma'

/** The match verdict: declared once, never revised by what happens to the body afterwards. */
export interface MatchVerdict {
  winner: FightSide
  cause: DeathCause
  frame: number
}

export type HisokaCondition = 'fighting' | 'buried' | 'dead' | 'revived'

/** Survival after the match, kept apart from the verdict. */
export interface SurvivalState {
  hisoka: HisokaCondition
  deathFrame: number | null
  revivedFrame: number | null
}

export const INITIAL_SURVIVAL: SurvivalState = {
  hisoka: 'fighting',
  deathFrame: null,
  revivedFrame: null,
}

export interface VerdictContext {
  verdict: MatchVerdict | null
  survival: SurvivalState
  chrolloSide: FightSide
}

interface BeatAt {
  beat: DeathMatchBeat
  frame: number
}

/** Beats that only make sense once a given amount of narrative time has passed. */
export function beatTimingAllowed(context: VerdictContext, event: BeatAt): boolean {
  if (event.beat !== 'rescue-arrives') return true
  const died = context.survival.deathFrame
  return died !== null && event.frame - died >= RESCUE_DELAY_FRAMES
}

/** Applies a beat to the verdict and the survival track; other beats leave both unchanged. */
export function applyVerdictBeat(context: VerdictContext, event: BeatAt): VerdictContext {
  const survival = context.survival
  switch (event.beat) {
    case 'hisoka-buried':
      return { ...context, survival: { ...survival, hisoka: 'buried' } }
    case 'hisoka-asphyxiated':
      return { ...context, survival: { ...survival, hisoka: 'dead', deathFrame: event.frame } }
    case 'chrollo-declared-winner':
      return {
        ...context,
        verdict: { winner: context.chrolloSide, cause: 'asphyxia', frame: event.frame },
      }
    case 'resuscitation':
      return { ...context, survival: { ...survival, hisoka: 'revived', revivedFrame: event.frame } }
    default:
      return context
  }
}
