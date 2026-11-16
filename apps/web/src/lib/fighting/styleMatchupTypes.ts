export type StyleRole = 'mobile' | 'pressure' | 'control' | 'ranged' | 'preparation' | 'support'
export interface StyleMatchup {
  role: StyleRole
  plan: readonly [string, string]
  counter: readonly [string, string]
}
export const entry = (
  role: StyleRole,
  plan: StyleMatchup['plan'],
  counter: StyleMatchup['counter'],
): StyleMatchup => ({ role, plan, counter })

/** Describes the implemented duel, without adding powers or unknown manga conditions. */
