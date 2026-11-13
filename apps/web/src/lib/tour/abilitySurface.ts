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
  concealed: boolean
  bodyHolds: number
  worldHolds: number
  reasons: TourAbilitySurfaceReasons
  execute: (command: TourAbilityCommand) => void
}

export function tourCommandFor(abilityId: string, actionId: string): TourAbilityCommand | null {
  if (abilityId === 'bungee-gum') {
    if (actionId === 'attach' || actionId === 'set-trap') return 'cast-primary'
    if (actionId === 'detach' || actionId === 'release') return 'release-world'
    return null
  }
  if (abilityId === 'illumi-needle-people') {
    if (actionId === 'plant-needle') return 'cast-body'
    if (actionId === 'remove-needle') return 'release-bodies'
  }
  return null
}

export function tourActionAvailability(
  options: Pick<
    TourAbilitySurfaceOptions,
    'presentation' | 'targetId' | 'concealed' | 'bodyHolds' | 'worldHolds' | 'reasons'
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
    'targetId' | 'concealed' | 'bodyHolds' | 'worldHolds' | 'reasons'
  >,
  actionId: string,
  command: TourAbilityCommand,
): AbilitySurfaceActionAvailability {
  if (actionId === 'set-trap' && !options.concealed)
    return { executable: false, reason: options.reasons.inRequired }
  if (command === 'cast-body' || command === 'cast-primary')
    return options.targetId
      ? { executable: true }
      : { executable: false, reason: options.reasons.targetRequired }
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
      },
    }),
    availability: (actionId) => tourActionAvailability(options, actionId),
    dispatch: (actionId) => {
      const state = tourActionAvailability(options, actionId)
      const command = tourCommandFor(options.presentation.abilityId, actionId)
      if (state.executable && command) options.execute(command)
    },
  })
}
