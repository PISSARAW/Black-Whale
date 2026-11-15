import { buildManifest } from '@black-whale/ability-sdk'
import { INFECTION_STEPS, type dealTheGame } from './game.js'
import {
  COHORT_ID,
  GAME_DISCRIMINATOR,
  GAME_REVEALED_AT,
  KILL_VALUES,
  MEMBER_ZERO_LEVEL,
  NETWORK_CAPACITY,
  UNIQUE_ABILITY_LEVEL,
} from './limits.js'

export function isEligibleInfectionGame(
  game: ReturnType<typeof dealTheGame> | undefined,
  effectIsLive: boolean,
): boolean {
  if (!game) return false
  return [
    effectIsLive,
    !game.proxied,
    game.kissed,
    game.verdict === 'infected' || game.verdict === 'forced',
  ].every(Boolean)
}

export const contagionManifest = buildManifest('contagion', {
  // Infection is a sequence, not a click: game, kiss, witnessed murder.
  inputMode: 'SEQUENCE',
  allowedTargets: ['CHARACTER'],
  overlays: ['CONTROL_LINK', 'RANGE'],
  entryActions: ['open-network', 'infect'],
  requiredState: ['isConscious', 'canUseNen'],
  perspectiveTransition: {
    canChangeBody: false,
    canChangeConsciousness: false,
    canFollowAura: true,
  },
  customComponent: 'ContagionDashboard',
})

export const CONTAGION_LIMITS = {
  cohortId: COHORT_ID,
  capacity: NETWORK_CAPACITY,
  uniqueAbilityLevel: UNIQUE_ABILITY_LEVEL,
  memberZeroLevel: MEMBER_ZERO_LEVEL,
  infectionSteps: INFECTION_STEPS,
  killValues: KILL_VALUES,
  /** Where a running negotiation is stored, for anything reading the branch. */
  gameDiscriminator: GAME_DISCRIMINATOR,
  gameRevealedAtChapter: GAME_REVEALED_AT,
}
