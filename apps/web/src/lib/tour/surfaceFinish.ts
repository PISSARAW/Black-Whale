import type { StructureKind } from './types'

/**
 * Share of the deck steel's grazing sheen carried by each solid.
 *
 * A solid kind often stands for a composite object, so the value follows its
 * largest visible surface: a telephone is matte plastic even though its tiny
 * display is glass, and a camera is a painted housing even though its lens is
 * reflective. Those small parts need their own geometry before they can
 * honestly receive a stronger finish.
 */
export const STRUCTURE_SHEEN: Readonly<Record<StructureKind, number>> = {
  spring: 0.8,
  casket: 0.42,
  platform: 0.08,
  counter: 0.12,
  table: 0.08,
  bed: 0,
  seat: 0,
  cabinet: 0.1,
  basin: 0.34,
  painting: 0,
  // The pane is drawn separately. This is only its frame.
  window: 0.28,
  lifeboat: 0.26,
  pillar: 0.55,
  bars: 0.68,
  manacle: 0.85,
  camera: 0.06,
  telephone: 0,
  mobile: 0.12,
  duct: 0.34,
  vent: 0.3,
}

export const structureSheenOf = (kind: StructureKind): number => STRUCTURE_SHEEN[kind]
