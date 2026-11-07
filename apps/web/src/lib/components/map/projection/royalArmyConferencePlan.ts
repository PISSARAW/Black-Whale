import type { Vec2 } from '$lib/tour/types'

export const ROYAL_ARMY_VIEWBOX = { width: 1000, height: 700 }
export const ROYAL_ARMY_SCALE = 40 // 40 px per metre (800px / 20m, 600px / 15m)

/** Maps metric coordinates (X: -10 to 10, Z: -7.5 to 7.5) to local SVG box (1000 x 700). */
export function royalArmyConferencePoint([x, z]: Vec2): { x: number; y: number } {
  return {
    x: 100 + (x + 10) * ROYAL_ARMY_SCALE,
    y: 80 + (z + 7.5) * ROYAL_ARMY_SCALE,
  }
}

function spot(at: Vec2): { x: number; y: number } {
  const p = royalArmyConferencePoint(at)
  return {
    x: Number(((p.x / ROYAL_ARMY_VIEWBOX.width) * 100).toFixed(2)),
    y: Number(((p.y / ROYAL_ARMY_VIEWBOX.height) * 100).toFixed(2)),
  }
}

/** Chapter 380, p. 189: Mizaistom Nana and Royal Army officers in briefing. */
export const royalArmyConferenceSpotAnchors = {
  occupants: {
    'mizaistom-nana': spot([0.8, -3.25]),
  },
  seats: {
    'chair-01': spot([-2.8, -1.75]),
    'chair-02': spot([-1.4, -1.75]),
    'chair-03': spot([0, -1.75]),
    'chair-04': spot([1.4, -1.75]),
    'chair-05': spot([2.8, -1.75]),
    'chair-06': spot([-4.5, 0.5]),
    'chair-07': spot([-4.5, 1.6]),
    'chair-08': spot([-4.5, 2.7]),
    'chair-09': spot([-4.5, 3.8]),
    'chair-10': spot([4.5, 0.5]),
    'chair-11': spot([4.5, 1.6]),
    'chair-12': spot([4.5, 2.7]),
    'chair-13': spot([4.5, 3.8]),
    'chair-14': spot([-2.2, 4.5]),
    'chair-15': spot([2.2, 4.5]),
  },
  fallback: spot([0, 2.0]),
}
