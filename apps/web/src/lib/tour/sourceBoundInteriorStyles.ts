export interface SourceBoundInteriorStyle {
  locationId: string
  name: string
  floor: number
  wall: number
  ceiling: number
  wood: number
  metal: number
  fabric: number
  accent: number
  floorPattern: 'bands' | 'grid' | 'plates'
  ceilingPattern: 'beams' | 'coffers' | 'services'
}

const STYLES: SourceBoundInteriorStyle[] = [
  {
    locationId: 'tier-1-soldiers-living-quarters',
    name: 'soldiers-quarters',
    floor: 0x303733,
    wall: 0x59635c,
    ceiling: 0x303733,
    wood: 0x4a4231,
    metal: 0x7d8780,
    fabric: 0x596257,
    accent: 0x9c8b55,
    floorPattern: 'plates',
    ceilingPattern: 'services',
  },
  {
    locationId: 'tier-3-central-courthouse',
    name: 'central-courthouse',
    floor: 0x3b3832,
    wall: 0x747168,
    ceiling: 0x4f4d48,
    wood: 0x4d3426,
    metal: 0x847d70,
    fabric: 0x51433d,
    accent: 0xb29358,
    floorPattern: 'bands',
    ceilingPattern: 'coffers',
  },
]

export const SOURCE_BOUND_INTERIOR_STYLES: readonly SourceBoundInteriorStyle[] = STYLES

export const sourceBoundStyleFor = (
  locationId: string | null | undefined,
): SourceBoundInteriorStyle | undefined =>
  locationId ? STYLES.find((style) => style.locationId === locationId) : undefined
