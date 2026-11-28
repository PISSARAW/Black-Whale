/**
 * The visit's foreground is opened like a fourth wall for the side-on camera.
 * Furniture crosses the full-width lanes in the burial rotunda and VIP casino.
 * Keep their models behind the fighters and clear the foreground for the duel.
 */
export function roomCutDepth(spaceId: string): number {
  return spaceId === 'tier-1-princes-burial-chamber-rotunda' || spaceId === 'tier-1-vip-casino'
    ? -FIGHT_BODY_HALF_WIDTH
    : 1
}

/** Includes the broadest standing rigs, not just Biscuit's height. */
export const FIGHT_BODY_HALF_WIDTH = 1.2
