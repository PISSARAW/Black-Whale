import { MAX_NEN_PSYCHOLOGY, nenPsychologyOf, type NenPsychologicalState } from '../nenPsychology'
import type { FightState, FighterId } from '../types'
import { isCareerDuel } from './eligibility'
import type { CareerMatch, CareerProfile } from './types'

export type CareerMoraleKind = 'apprehension' | 'resolve'

export interface CareerMoraleState {
  kind: CareerMoraleKind
  sourceMatchId: string
}

declare module '../types' {
  interface FightState {
    /** Residue from this fighter's latest decisive career result. */
    careerMorale?: CareerMoraleState
  }
}

const APPREHENSION_BONUS = 1_800
const RESOLVE_BONUS = 1_800

/** A severe loss or clear win means a 0-2 or 2-0 match for this profile's fighter. */
export function careerMoraleFor(
  profile: CareerProfile,
  fighter: FighterId,
): CareerMoraleState | null {
  const latest = profile.history
    .filter((match) => match.player === fighter)
    .sort((left, right) => right.at - left.at || left.id.localeCompare(right.id))[0]
  if (!latest) return null
  if (profile.moraleSeen.includes(latest.id)) return null
  if (decisiveResult(latest, 'opponent')) return { kind: 'apprehension', sourceMatchId: latest.id }
  if (decisiveResult(latest, 'player')) return { kind: 'resolve', sourceMatchId: latest.id }
  return null
}

/** Applies the residue once to the opening state; normal psychology recovery then dissipates it. */
export function applyCareerMorale(state: FightState, profile: CareerProfile): FightState {
  if (!isCareerDuel(state)) return state
  const morale = careerMoraleFor(profile, state.player.id)
  if (!morale) return state
  const psychology = nenPsychologyOf(state.player)
  return {
    ...state,
    careerMorale: morale,
    player: {
      ...state.player,
      nenPsychology: shiftedPsychology(psychology, morale.kind),
    },
  }
}

export function careerMoraleLabel(morale: CareerMoraleState, language: 'fr' | 'en'): string {
  if (morale.kind === 'apprehension')
    return language === 'fr'
      ? 'Fatigue morale · appréhension du combat précédent'
      : 'Morale fatigue · apprehension from the previous match'
  return language === 'fr'
    ? 'Élan moral · résolution du combat précédent'
    : 'Morale momentum · resolve from the previous match'
}

function decisiveResult(match: CareerMatch, winner: 'player' | 'opponent'): boolean {
  const loser = winner === 'player' ? 'opponent' : 'player'
  return match.winner === winner && match.rounds[winner] === 2 && match.rounds[loser] === 0
}

function shiftedPsychology(
  psychology: NenPsychologicalState,
  kind: CareerMoraleKind,
): NenPsychologicalState {
  return {
    ...psychology,
    [kind]: Math.min(
      MAX_NEN_PSYCHOLOGY,
      psychology[kind] + (kind === 'apprehension' ? APPREHENSION_BONUS : RESOLVE_BONUS),
    ),
  }
}
