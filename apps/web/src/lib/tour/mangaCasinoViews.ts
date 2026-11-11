import { mangaView as view, type MangaView } from './mangaViewModel'
import { CASINO_SPACE } from './casinoLayout'

const tserriednichEnters = {
  characterId: 'prince-tserriednich',
  at: [-46.5, 22] as const,
  heading: 0,
  pose: 'idle' as const,
}

export const MANGA_CASINO_VIEWS: MangaView[] = [
  view({
    id: 'casino-420-gaming-floor',
    spaceId: CASINO_SPACE,
    chapter: 420,
    eventSequence: 1,
    eventTitle: 'Tserriednich discovers the casino patrols killed without gunfire',
    staging: [tserriednichEnters],
    at: [-49, 8],
    target: [-45, 36],
    pitch: 0.12,
    label:
      'Tserriednich enters the deserted casino; the unidentified patrol bodies are not reconstructed',
    labelFr:
      'Tserriednich entre dans le casino désert ; les corps non identifiés de la patrouille ne sont pas reconstitués',
  }),
  view({
    id: 'casino-420-swamp-ball',
    spaceId: CASINO_SPACE,
    chapter: 420,
    eventSequence: 2,
    eventTitle: 'Tserriednich encounters Hisoka in the VIP casino',
    staging: [
      { characterId: 'hisoka', at: [-49, 30.8], heading: 0, pose: 'seated' },
      { ...tserriednichEnters, at: [-53, 29.2], heading: -Math.PI / 2 },
    ],
    at: [-51.1, 28],
    target: [-49, 34],
    pitch: 0.08,
    label: 'SWAMP BALL, the machine played by Hisoka during the encounter (reconstructed framing)',
    labelFr: 'SWAMP BALL, la borne où joue Hisoka lors de la rencontre (cadrage reconstitué)',
  }),
]
