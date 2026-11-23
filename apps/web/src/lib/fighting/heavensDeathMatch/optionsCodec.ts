import type { DeathMatchOptions } from './scenario'

type Check = (value: unknown) => boolean

const oneOf =
  (...values: readonly string[]): Check =>
  (value) =>
    typeof value === 'string' && values.includes(value)

const CHECKS: Record<keyof DeathMatchOptions, Check> = {
  playMode: oneOf('scripted', 'semi-free', 'free'),
  difficulty: oneOf('normal', 'canonical', 'free'),
  chrolloSide: oneOf('player', 'opponent'),
  deductionAssists: (value) => typeof value === 'boolean',
}

/**
 * Reads the scenario options stored in a replay's environment. Absent gives undefined;
 * anything malformed gives null, which the replay codec rejects as a whole.
 */
export function parseDeathMatchOptions(
  value: unknown,
): Partial<DeathMatchOptions> | null | undefined {
  if (value === undefined) return undefined
  if (!value || typeof value !== 'object') return null
  const entry = value as Record<string, unknown>
  const options: Record<string, unknown> = {}
  for (const [key, check] of Object.entries(CHECKS)) {
    if (entry[key] === undefined) continue
    if (!check(entry[key])) return null
    options[key] = entry[key]
  }
  return options as Partial<DeathMatchOptions>
}
