import type { Vec2 } from '$lib/tour/types'

export const CAMILLA_VIEWBOX = { width: 800, height: 800 }
export const CAMILLA_SCALE = 700 / 21 // 33.333 px per metre

/** Maps room-1002 metric coordinates (X: -10.5 to 10.5, Z: -10.2 to 10.2) to SVG box. */
export const camillaPoint = ([x, z]: Vec2) => ({
  x: 50 + (x + 10.5) * CAMILLA_SCALE,
  y: 82 + (z + 10.2) * CAMILLA_SCALE,
})

function spot(at: Vec2) {
  const p = camillaPoint(at)
  return {
    x: Number(((p.x / CAMILLA_VIEWBOX.width) * 100).toFixed(2)),
    y: Number(((p.y / CAMILLA_VIEWBOX.height) * 100).toFixed(2)),
  }
}

/** Chapter 389: Have-Nots gathered in salon; Chapter 366: Camilla & Duazul dining, Musse at entrance. */
export const camillaSpotAnchors = {
  occupants: {
    'prince-camilla': spot([-5.5, 2.0]),
    'duazul-hui-guo-rou': spot([7.35, -2.7]),
    musse: spot([0.4, -6.5]),
    lisamsetta: spot([-8.2, 0.2]),
    meshush: spot([-8.2, 1.8]),
    mozbe: spot([-8.2, 3.4]),
    sarahell: spot([-3.8, 4.7]),
    umanma: spot([-1.2, 4.7]),
    fukataki: spot([1.4, 4.7]),
    kako: spot([4.0, 4.7]),
    moswana: spot([-6.4, 4.7]),
  },
}

export const camillaLivingSpotAnchors = {
  occupants: {
    'prince-camilla': spot([-5.5, 2.0]),
    lisamsetta: spot([-8.2, 0.2]),
    meshush: spot([-8.2, 1.8]),
    mozbe: spot([-8.2, 3.4]),
    sarahell: spot([-3.8, 4.7]),
    umanma: spot([-1.2, 4.7]),
    fukataki: spot([1.4, 4.7]),
    kako: spot([4.0, 4.7]),
    moswana: spot([-6.4, 4.7]),
  },
}

export const camillaDiningSpotAnchors = {
  occupants: {
    'prince-camilla': spot([4.65, -2.7]),
    'duazul-hui-guo-rou': spot([7.35, -2.7]),
  },
}

export const camillaEntranceSpotAnchors = {
  occupants: {
    musse: spot([0.4, -6.5]),
  },
}
