export type NenRefusalCode =
  | 'RESERVE_TOO_LOW'
  | 'NODES_SHUT'
  | 'ZETSU_HAS_NO_AURA'
  | 'RADIUS_MUST_BE_POSITIVE'
  | 'RYU_DISTRIBUTION_EMPTY'
  | 'ON_FORCES_RYU'

export const isNenRefusalCode = (value: unknown): value is NenRefusalCode =>
  typeof value === 'string' &&
  [
    'RESERVE_TOO_LOW',
    'NODES_SHUT',
    'ZETSU_HAS_NO_AURA',
    'RADIUS_MUST_BE_POSITIVE',
    'RYU_DISTRIBUTION_EMPTY',
    'ON_FORCES_RYU',
  ].includes(value)
