/**
 * The visit's foreground is opened like a fourth wall for the side-on camera.
 * The burial rotunda has floor relays across every full-width chord: keep its
 * complete ceremonial model behind the fighters rather than standing in it.
 */
export function roomCutDepth(spaceId: string): number {
  return spaceId === 'tier-1-princes-burial-chamber-rotunda' ? -1.2 : 1
}

/** Includes the broadest standing rigs, not just Biscuit's height. */
export const FIGHT_BODY_HALF_WIDTH = 1.2
