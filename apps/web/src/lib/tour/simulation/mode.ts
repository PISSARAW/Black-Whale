export type TourWorldMode = 'CANONICAL_VISIT' | 'FREE_LIFE' | 'ALTERNATE_SIMULATION'

export interface TourModePolicy {
  mode: TourWorldMode
  canonical: boolean
  persistentConsequences: boolean
  mayAlterNamedCharacters: boolean
}

export function tourModePolicy(mode: TourWorldMode): TourModePolicy {
  if (mode === 'CANONICAL_VISIT') {
    return { mode, canonical: true, persistentConsequences: false, mayAlterNamedCharacters: false }
  }
  return {
    mode,
    canonical: false,
    persistentConsequences: true,
    mayAlterNamedCharacters: mode === 'ALTERNATE_SIMULATION',
  }
}

export function tourWorldMode(value: string | null | undefined): TourWorldMode {
  if (value === 'free') return 'FREE_LIFE'
  if (value === 'alternative') return 'ALTERNATE_SIMULATION'
  return 'CANONICAL_VISIT'
}

export function assertTourMutationAllowed(mode: TourWorldMode): void {
  if (!tourModePolicy(mode).persistentConsequences)
    throw new Error('Canonical Tour is read-only; choose Free Life or Alternative Simulation')
}
