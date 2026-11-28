import type { Structure, Vec2 } from './types'

export const CASINO_SPACE = 'tier-1-vip-casino'
export const CASINO_APPROACH = 'tier-1-vvip-casino-approach'
export const CASINO_STAIR_ROOM = 'tier-1-vip-casino-emergency-room'
export const CASINO_STAIR_LANDING = 'tier-1-vip-casino-emergency-stair'
export const CASINO_LOWER_HALL = 'tier-1-vip-casino-lower-hall'

export function isCasinoGamingSurface({ id, kind, spaceId }: Structure): boolean {
  return spaceId === CASINO_SPACE && kind === 'platform' && !id.includes('-mezzanine-')
}

/** The drawing has lateral supports; the old grid planted a post in SWAMP BALL. */
export function casinoColumnPositions(): Vec2[] {
  return [-54.7, -43.3].flatMap((x) =>
    Array.from({ length: 5 }, (_, index): Vec2 => [x, 6.75 + index * 11.5]),
  )
}

/** Only these solids receive a complete model in place of their coarse envelope. */
export function hasCasinoModel(structure: Structure): boolean {
  if (structure.spaceId !== CASINO_SPACE) return false
  return (
    structure.id.includes('-gaming-table-') ||
    structure.id.includes('-machine-island-') ||
    structure.id.endsWith('-swamp-ball') ||
    structure.kind === 'seat' ||
    structure.id.endsWith('-lounge-table')
  )
}
