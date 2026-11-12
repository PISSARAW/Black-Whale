export type CineplexSeatKind = 'standard' | 'recliner' | 'motion' | 'dbox'
export type CineplexScreenKind = 'imax' | 'vision' | 'projection' | 'led'

export interface CineplexFormat {
  screenId: string
  number: number
  label: string
  labelFr: string
  shortLabel: string
  accent: number
  seatKind: CineplexSeatKind
  screenKind: CineplexScreenKind
  seatsPerRow: number
  sideProjection: boolean
  environmentalEffects: boolean
  lightVibes: boolean
}

/**
 * The deck plan establishes eight screens but not their equipment. This is the
 * visitor-facing premium programme reconstructed for those eight envelopes.
 * Screen 1 carries both the IMAX auditorium and its rare 70 mm projection booth.
 */
export const CINEPLEX_FORMATS: readonly CineplexFormat[] = [
  {
    screenId: 'tier-3-cineplex-screen-1',
    number: 1,
    label: 'IMAX 70 mm',
    labelFr: 'IMAX 70 mm',
    shortLabel: 'IMAX',
    accent: 0x2d6eb5,
    seatKind: 'standard',
    screenKind: 'imax',
    seatsPerRow: 6,
    sideProjection: false,
    environmentalEffects: false,
    lightVibes: false,
  },
  {
    screenId: 'tier-3-cineplex-screen-2',
    number: 2,
    label: 'Dolby Cinema',
    labelFr: 'Dolby Cinema',
    shortLabel: 'DOLBY',
    accent: 0x7246a8,
    seatKind: 'recliner',
    screenKind: 'vision',
    seatsPerRow: 4,
    sideProjection: false,
    environmentalEffects: false,
    lightVibes: false,
  },
  {
    screenId: 'tier-3-cineplex-screen-3',
    number: 3,
    label: '4DX',
    labelFr: '4DX',
    shortLabel: '4DX',
    accent: 0xd04a32,
    seatKind: 'motion',
    screenKind: 'projection',
    seatsPerRow: 4,
    sideProjection: false,
    environmentalEffects: true,
    lightVibes: false,
  },
  {
    screenId: 'tier-3-cineplex-screen-4',
    number: 4,
    label: 'ScreenX 270°',
    labelFr: 'ScreenX 270°',
    shortLabel: 'SCREENX',
    accent: 0x16a0a7,
    seatKind: 'standard',
    screenKind: 'projection',
    seatsPerRow: 6,
    sideProjection: true,
    environmentalEffects: false,
    lightVibes: false,
  },
  {
    screenId: 'tier-3-cineplex-screen-5',
    number: 5,
    label: 'ICE Immersive',
    labelFr: 'ICE Immersive',
    shortLabel: 'ICE',
    accent: 0x3984e8,
    seatKind: 'recliner',
    screenKind: 'projection',
    seatsPerRow: 4,
    sideProjection: false,
    environmentalEffects: false,
    lightVibes: true,
  },
  {
    screenId: 'tier-3-cineplex-screen-6',
    number: 6,
    label: 'Ultra 4DX',
    labelFr: 'Ultra 4DX',
    shortLabel: 'U4DX',
    accent: 0xdf3d6b,
    seatKind: 'motion',
    screenKind: 'projection',
    seatsPerRow: 4,
    sideProjection: true,
    environmentalEffects: true,
    lightVibes: false,
  },
  {
    screenId: 'tier-3-cineplex-screen-7',
    number: 7,
    label: 'D-BOX',
    labelFr: 'D-BOX',
    shortLabel: 'D-BOX',
    accent: 0xb3262d,
    seatKind: 'dbox',
    screenKind: 'projection',
    seatsPerRow: 4,
    sideProjection: false,
    environmentalEffects: false,
    lightVibes: false,
  },
  {
    screenId: 'tier-3-cineplex-screen-8',
    number: 8,
    label: 'Onyx LED',
    labelFr: 'Onyx LED',
    shortLabel: 'ONYX',
    accent: 0x46c6d9,
    seatKind: 'recliner',
    screenKind: 'led',
    seatsPerRow: 4,
    sideProjection: false,
    environmentalEffects: false,
    lightVibes: false,
  },
]

const FORMAT_BY_SPACE = new Map(CINEPLEX_FORMATS.map((format) => [format.screenId, format]))

export function cineplexFormatFor(spaceId: string): CineplexFormat | null {
  return FORMAT_BY_SPACE.get(spaceId) ?? null
}
