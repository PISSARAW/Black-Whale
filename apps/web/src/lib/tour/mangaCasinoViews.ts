import { mangaView as view, type MangaView } from './mangaViewModel'
import { CASINO_SPACE } from './casinoLayout'

export const MANGA_CASINO_VIEWS: MangaView[] = [
  view({
    id: 'casino-420-gaming-floor',
    spaceId: CASINO_SPACE,
    chapter: 420,
    eventSequence: 1,
    at: [-49, 8],
    target: [-45, 36],
    pitch: 0.12,
    label:
      'The casino gaming floor, crystal chandeliers and patterned mezzanine (reconstructed framing)',
    labelFr: 'Le casino, ses lustres à pampilles et sa mezzanine à motifs (cadrage reconstitué)',
  }),
  view({
    id: 'casino-420-swamp-ball',
    spaceId: CASINO_SPACE,
    chapter: 420,
    eventSequence: 2,
    at: [-51.1, 28],
    target: [-49, 34],
    pitch: 0.08,
    label: 'SWAMP BALL, the machine played by Hisoka during the encounter (reconstructed framing)',
    labelFr: 'SWAMP BALL, la borne où joue Hisoka lors de la rencontre (cadrage reconstitué)',
  }),
]
