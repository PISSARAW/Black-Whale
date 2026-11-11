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
]

export const SOURCE_BOUND_INTERIOR_STYLES: readonly SourceBoundInteriorStyle[] = STYLES

export const sourceBoundStyleFor = (
  locationId: string | null | undefined,
): SourceBoundInteriorStyle | undefined =>
  locationId ? STYLES.find((style) => style.locationId === locationId) : undefined
