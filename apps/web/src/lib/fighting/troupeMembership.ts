import type { FighterId } from './types'
/** Current playable memberships: Hisoka’s false membership never satisfies a Troupe restriction. */
const MEMBERS = new Set<FighterId>([
  'chrollo',
  'feitan',
  'phinks',
  'franklin',
  'illumi',
  'machi',
  'kalluto',
  'bonolenov',
  'shizuku',
])
export function troupeMember(id: FighterId): boolean {
  return MEMBERS.has(id)
}
