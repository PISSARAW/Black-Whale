import { cineplexFormatFor } from './cineplexFormats'
import type { Structure } from './types'

const ROW_PATTERN = /^(tier-3-cineplex-screen-\d)-seat-row-(\d{2})$/
const ROW_RISE = 0.24
const FRONT_HEIGHT = 0.16
const CENTRAL_AISLE = 0.86

function inferred(structure: Structure, options: Partial<Structure>): Structure {
  return {
    ...structure,
    provenance: 'inferred',
    source:
      'Accessible premium seating reconstruction; auditorium format and dimensions are estimated.',
    sourceFr:
      'Gradins et sièges premium accessibles reconstitués ; format de salle et dimensions estimés.',
    ...options,
  }
}

function rowHeight(row: number): number {
  return FRONT_HEIGHT + (6 - row) * ROW_RISE
}

function seatBanks(structure: Structure, row: number): Structure[] {
  const format = cineplexFormatFor(structure.spaceId)
  const width = format?.seatsPerRow === 6 ? 2.18 : 1.95
  const offset = CENTRAL_AISLE / 2 + width / 2
  return ([-1, 1] as const).map((side) =>
    inferred(structure, {
      id: `${structure.id}-bank-${side < 0 ? 'port' : 'starboard'}`,
      name: `Seat bank ${row} (${side < 0 ? 'port' : 'starboard'})`,
      nameFr: `Banque de sièges ${row} (${side < 0 ? 'bâbord' : 'tribord'})`,
      at: [structure.at[0] + side * offset, structure.at[1]],
      size: [width, 0.82],
      base: rowHeight(row),
      height: 1.18,
    }),
  )
}

function aisleStairs(structure: Structure): Structure[] {
  const rearHeight = rowHeight(1)
  return Array.from({ length: 6 }, (_, index) => {
    const step = index + 1
    return inferred(structure, {
      id: `${structure.spaceId}-aisle-stair-${String(step).padStart(2, '0')}`,
      kind: 'platform',
      name: `Central aisle step ${step}`,
      nameFr: `Marche d’allée centrale ${step}`,
      at: [structure.at[0], 17.615 + index * 0.23],
      size: [CENTRAL_AISLE, 0.23],
      base: 0,
      height: (rearHeight * step) / 6,
    })
  })
}

function accessibleRow(structure: Structure, row: number): Structure[] {
  const riser = inferred(structure, {
    id: `${structure.id}-riser`,
    kind: 'platform',
    name: `Accessible seating riser ${row}`,
    nameFr: `Gradin accessible ${row}`,
    size: [5.25, 2.6],
    base: 0,
    height: rowHeight(row),
  })
  const stairs = row === 1 ? aisleStairs(structure) : []
  return [riser, ...seatBanks(structure, row), ...stairs]
}

/** Replaces full-width collision bars with walkable risers, stairs and paired seat banks. */
export function cineplexWalkStructures(structures: readonly Structure[]): Structure[] {
  return structures.flatMap((structure) => {
    const match = ROW_PATTERN.exec(structure.id)
    return match ? accessibleRow(structure, Number(match[2])) : [structure]
  })
}
