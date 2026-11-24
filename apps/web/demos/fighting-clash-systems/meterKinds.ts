/** Which live engine gauges a shot draws (see Meters.svelte and RuleMeters.svelte). */
export type MeterKind =
  'psychology' | 'load' | 'ryu' | 'kameo' | 'burst' | 'rage' | 'clash' | 'body' | 'morale'
export const RULE_METERS: readonly MeterKind[] = ['burst', 'rage', 'clash', 'body', 'morale']
