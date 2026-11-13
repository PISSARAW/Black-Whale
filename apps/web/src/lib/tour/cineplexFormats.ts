export type CineplexSeatKind = 'standard'
export type CineplexScreenKind = 'projection'

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
  sideProjection: false
  environmentalEffects: false
  lightVibes: false
}

const SCREEN_IDS = Array.from({ length: 8 }, (_, index) => `tier-3-cineplex-screen-${index + 1}`)

/**
 * The deck plan establishes eight numbered screening rooms, not eight premium
 * technologies. Every envelope therefore receives the same restrained
 * reconstruction; the number is the only room-to-room claim the source makes.
 */
export const CINEPLEX_FORMATS: readonly CineplexFormat[] = SCREEN_IDS.map((screenId, index) => {
  const number = index + 1
  return {
    screenId,
    number,
    label: `Screen ${number}`,
    labelFr: `Salle ${number}`,
    shortLabel: String(number),
    accent: 0xb58a4b,
    seatKind: 'standard',
    screenKind: 'projection',
    seatsPerRow: 6,
    sideProjection: false,
    environmentalEffects: false,
    lightVibes: false,
  }
})

const FORMAT_BY_SPACE = new Map(CINEPLEX_FORMATS.map((format) => [format.screenId, format]))

export function cineplexFormatFor(spaceId: string): CineplexFormat | null {
  return FORMAT_BY_SPACE.get(spaceId) ?? null
}
