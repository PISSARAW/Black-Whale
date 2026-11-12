import type { BanquetDetailBuilder } from './banquetDetailBuilder'
import {
  ARMY_FRAME,
  ARMY_TABLE,
  ARMY_TABLE_EDGE,
  ARMY_SEAT,
  RoyalArmyConferenceSurface,
} from './royalArmyConferenceDetailSurface'
import type { Structure } from './types'

/** The simple rectangular, open-backed chairs visible around the committee and in the audience. */
export function dressConferenceChair(
  into: BanquetDetailBuilder,
  structure: Structure,
  floor: number,
): void {
  const surface = new RoyalArmyConferenceSurface(into, structure, floor)
  const [w, d] = structure.size
  const h = structure.height
  const backZ = -d / 2 + 0.045
  surface.box([w - 0.04, 0.065, d - 0.06], [0, 0.45, 0], ARMY_SEAT)
  for (const x of [-w / 2 + 0.05, w / 2 - 0.05]) {
    surface.box([0.055, 0.44, 0.055], [x, 0.22, d / 2 - 0.06], ARMY_FRAME)
    surface.box([0.055, h, 0.055], [x, h / 2, backZ], ARMY_FRAME)
    surface.box([0.05, 0.035, d - 0.12], [x, 0.2, 0], ARMY_FRAME)
  }
  surface.box([w, 0.07, 0.07], [0, h - 0.035, backZ], ARMY_FRAME)
  surface.box([w - 0.12, 0.18, 0.045], [0, h - 0.16, backZ], ARMY_SEAT)
}

/** Pale joined table sections with a vertically lined apron; bare tops in the inspected panels. */
export function dressConferenceTable(
  into: BanquetDetailBuilder,
  structure: Structure,
  floor: number,
): void {
  const surface = new RoyalArmyConferenceSurface(into, structure, floor)
  const [w, d] = structure.size
  const h = structure.height
  surface.box([w, 0.055, d], [0, h - 0.0275, 0], ARMY_TABLE)
  surface.box([w - 0.04, 0.055, d - 0.04], [0, h - 0.08, 0], ARMY_TABLE_EDGE)
  const alongX = w > d
  const length = alongX ? w : d
  const pitch = length / Math.max(1, Math.round(length / 0.16))
  for (const side of [-1, 1]) {
    const depth = side * ((alongX ? d : w) / 2 - 0.06)
    surface.box(
      alongX ? [w - 0.08, h - 0.15, 0.055] : [0.055, h - 0.15, d - 0.08],
      alongX ? [0, (h - 0.15) / 2, depth] : [depth, (h - 0.15) / 2, 0],
      ARMY_TABLE,
    )
    for (let at = -length / 2 + pitch / 2; at < length / 2; at += pitch)
      surface.box(
        alongX ? [0.012, h - 0.2, 0.008] : [0.008, h - 0.2, 0.012],
        alongX
          ? [at, (h - 0.2) / 2, depth + side * 0.03]
          : [depth + side * 0.03, (h - 0.2) / 2, at],
        ARMY_TABLE_EDGE,
      )
  }
}

/** The small plain box lectern to Mizaistom’s left, including its open shelf on the speaker side. */
export function dressLectern(
  into: BanquetDetailBuilder,
  structure: Structure,
  floor: number,
): void {
  const surface = new RoyalArmyConferenceSurface(into, structure, floor)
  const [w, d] = structure.size
  const h = structure.height
  surface.box([w, 0.07, d], [0, h - 0.035, 0], ARMY_TABLE)
  surface.box([w, 0.06, d], [0, 0.03, 0], ARMY_TABLE)
  for (const x of [-1, 1]) surface.box([0.06, h, d], [x * (w / 2 - 0.03), h / 2, 0], ARMY_TABLE)
  surface.box([w, h, 0.055], [0, h / 2, d / 2 - 0.0275], ARMY_TABLE)
  surface.box([w - 0.1, 0.04, d - 0.06], [0, h * 0.46, 0], ARMY_TABLE_EDGE)
}

/** A shallow, walkable platform, now shared with collisions rather than drawn as a floating stage. */
export function dressConferencePlatform(
  into: BanquetDetailBuilder,
  structure: Structure,
  floor: number,
): void {
  const surface = new RoyalArmyConferenceSurface(into, structure, floor)
  surface.box(
    [structure.size[0], structure.height, structure.size[1]],
    [0, structure.height / 2, 0],
    ARMY_TABLE,
  )
}
