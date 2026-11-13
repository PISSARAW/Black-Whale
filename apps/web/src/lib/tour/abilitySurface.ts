import type { AbilityPresentationProjection } from '@black-whale/nen-engine'
import {
  liveSurfaceAdapter,
  type AbilitySurfaceActionAvailability,
  type AbilitySurfaceAdapter,
} from '$lib/nen/abilityPresentation'

export type TourAbilityCommand = 'cast-primary' | 'cast-body' | 'release-world' | 'release-bodies'

export interface TourAbilitySurfaceReasons {
  unsupported: string
  targetRequired: string
  inRequired: string
  nothingHeld: string
}

interface TourAbilitySurfaceOptions {
  presentation: AbilityPresentationProjection
  name: string
  owner: string
  reducedMotion: boolean
  targetId: string | null
  bodyTargetId: string | null
  bodyRefusal: string | null
  concealed: boolean
  bodyHolds: number
  worldHolds: number
  reasons: TourAbilitySurfaceReasons
  execute: (command: TourAbilityCommand) => void
}

const TOUR_COMMANDS = {
  'bungee-gum': {
    attach: 'cast-primary',
    'set-trap': 'cast-primary',
    detach: 'release-world',
    release: 'release-world',
  },
  'illumi-needle-people': {
    'plant-needle': 'cast-body',
    'remove-needle': 'release-bodies',
  },
  'theta-aura-projectile': { test: 'cast-body' },
  'yomotsu-hegui': { consummate: 'cast-body' },
  'body-and-soul': { interrogate: 'cast-body' },
  'damage-sweet-home': { link: 'cast-body' },
  'stand-by-me': { lend: 'cast-body' },
  'bohemian-rhapsody': { merge: 'cast-body' },
} as const satisfies Record<string, Record<string, TourAbilityCommand>>

export function tourCommandFor(abilityId: string, actionId: string): TourAbilityCommand | null {
  const commands = TOUR_COMMANDS[abilityId as keyof typeof TOUR_COMMANDS]
  return (commands as Record<string, TourAbilityCommand> | undefined)?.[actionId] ?? null
}

export const tourSupportsAbility = (abilityId: string): boolean => abilityId in TOUR_COMMANDS

const TARGET_FIELD_BY_COMMAND: Partial<Record<TourAbilityCommand, 'targetId' | 'bodyTargetId'>> = {
  'cast-primary': 'targetId',
  'cast-body': 'bodyTargetId',
}

export function tourActionAvailability(
  options: Pick<
    TourAbilitySurfaceOptions,
    | 'presentation'
    | 'targetId'
    | 'bodyTargetId'
    | 'bodyRefusal'
    | 'concealed'
    | 'bodyHolds'
    | 'worldHolds'
    | 'reasons'
  >,
  actionId: string,
): AbilitySurfaceActionAvailability {
  const command = tourCommandFor(options.presentation.abilityId, actionId)
  if (!command) return { executable: false, reason: options.reasons.unsupported }
  return availabilityForCommand(options, actionId, command)
}

function availabilityForCommand(
  options: Pick<
    TourAbilitySurfaceOptions,
    | 'targetId'
    | 'bodyTargetId'
    | 'bodyRefusal'
    | 'concealed'
    | 'bodyHolds'
    | 'worldHolds'
    | 'reasons'
  >,
  actionId: string,
  command: TourAbilityCommand,
): AbilitySurfaceActionAvailability {
  if (actionId === 'set-trap' && !options.concealed)
    return { executable: false, reason: options.reasons.inRequired }
  const targetField = TARGET_FIELD_BY_COMMAND[command]
  if (targetField && !options[targetField])
    return { executable: false, reason: options.reasons.targetRequired }
  if (command === 'cast-body' && options.bodyRefusal)
    return { executable: false, reason: options.bodyRefusal }
  return releaseAvailability(options, command)
}

function releaseAvailability(
  options: Pick<TourAbilitySurfaceOptions, 'bodyHolds' | 'worldHolds' | 'reasons'>,
  command: TourAbilityCommand,
): AbilitySurfaceActionAvailability {
  if (command === 'release-bodies')
    return options.bodyHolds
      ? { executable: true }
      : { executable: false, reason: options.reasons.nothingHeld }
  if (command === 'release-world')
    return options.bodyHolds + options.worldHolds
      ? { executable: true }
      : { executable: false, reason: options.reasons.nothingHeld }
  return { executable: true }
}

/** The live bridge between module actions and the tour's existing reducers. */
export function tourAbilitySurfaceAdapter(
  options: TourAbilitySurfaceOptions,
): AbilitySurfaceAdapter {
  return liveSurfaceAdapter({
    name: options.name,
    owner: options.owner,
    reducedMotion: options.reducedMotion,
    snapshot: () => ({
      targets: options.targetId ? [options.targetId] : [],
      metrics: {
        bodyHolds: options.bodyHolds,
        worldHolds: options.worldHolds,
        concealed: options.concealed,
        bodyRefused: options.bodyRefusal !== null,
      },
    }),
    availability: (actionId) => tourActionAvailability(options, actionId),
    supports: (actionId) => tourCommandFor(options.presentation.abilityId, actionId) !== null,
    dispatch: (actionId) => {
      const state = tourActionAvailability(options, actionId)
      const command = tourCommandFor(options.presentation.abilityId, actionId)
      if (state.executable && command) options.execute(command)
    },
  })
}
