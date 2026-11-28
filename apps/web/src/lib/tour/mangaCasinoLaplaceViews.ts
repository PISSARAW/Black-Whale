import { CASINO_SPACE } from './casinoLayout'
import { mangaView as view, type MangaCastStaging, type MangaView } from './mangaViewModel'

const casino = { spaceId: CASINO_SPACE, chapter: 420, eventSequence: 3, hideCastAura: true }
const prince: MangaCastStaging = {
  characterId: 'prince-tserriednich',
  at: [-49.4, 39],
  heading: Math.PI,
}
const hisoka: MangaCastStaging = { characterId: 'hisoka', at: [-49, 39.85], heading: Math.PI }
const overhead = {
  at: [-45.8, 36.7] as const,
  target: [-49.4, 39.4] as const,
  eyeHeight: 4.9,
  pitch: -0.77,
}
const profile = {
  at: [-46.7, 38.2] as const,
  target: [-49.4, 39.3] as const,
  eyeHeight: 1.13,
  pitch: -0.03,
}
const projectedPrince: MangaCastStaging = { ...prince, pose: 'attack', projection: true }

export const MANGA_CASINO_LAPLACE_VIEWS: MangaView[] = [
  view({
    ...casino,
    id: 'casino-420-laplace-activation',
    at: [-49.4, 37.9],
    target: prince.at,
    eyeHeight: 1.76,
    pitch: -0.035,
    staging: [{ ...prince, pose: 'zetsu', unmasked: true }],
    label: 'Subjective close-up of Tserriednich closing his eyes in Zetsu',
    labelFr: 'Gros plan subjectif de Tserriednich fermant les yeux en Zetsu',
  }),
  view({
    ...casino,
    ...overhead,
    id: 'casino-420-laplace-approach',
    target: [-49.55, 38.3],
    staging: [
      { ...prince, pose: 'guard' },
      { ...hisoka, at: [-49.7, 36.8], heading: 0, pose: 'idle' },
    ],
    label: 'Overhead reconstruction of the first exchange in the predicted future',
    labelFr: 'Plongée reconstituée sur le premier échange dans le futur prédit',
  }),
  view({
    ...casino,
    ...overhead,
    id: 'casino-420-laplace-disappearance',
    staging: [{ ...prince, pose: 'brace' }],
    label: 'The same angle after Hisoka slips out of the prince’s field of view',
    labelFr: 'Même angle après que Hisoka échappe au regard du prince',
  }),
  view({
    ...casino,
    ...profile,
    id: 'casino-420-laplace-kneel',
    staging: [
      { ...prince, pose: 'kneeling' },
      { ...hisoka, pose: 'attack' },
    ],
    label: 'Side view of Hisoka reaching the kneeling prince from behind in the forecast',
    labelFr: 'Vue de profil sur Hisoka derrière le prince agenouillé dans la vision',
  }),
  view({
    ...casino,
    ...profile,
    id: 'casino-420-laplace-corpse',
    staging: [
      { ...prince, pose: 'fallen', unmasked: true },
      { ...hisoka, pose: 'idle' },
    ],
    label: 'Hisoka over the fallen prince in the predicted future',
    labelFr: 'Hisoka devant le prince à terre dans le futur prédit',
  }),
  view({
    ...casino,
    ...profile,
    id: 'casino-420-laplace-replay',
    staging: [
      { ...prince, pose: 'attack' },
      { ...hisoka, pose: 'attack' },
    ],
    label: 'The encounter replayed in real time as Hisoka catches the prince’s armed wrist',
    labelFr: 'La rencontre rejouée au présent lorsque Hisoka saisit le poignet armé du prince',
  }),
  view({
    ...casino,
    ...overhead,
    id: 'casino-420-laplace-divergence',
    target: [-49.65, 39.2],
    staging: [
      projectedPrince,
      { ...hisoka, pose: 'attack' },
      { ...prince, at: [-50.4, 37.85], heading: -2.38, pose: 'kneeling' },
    ],
    label: 'The visible double holds Hisoka’s attention as the real prince moves aside',
    labelFr: 'Le double visible retient Hisoka tandis que le vrai prince se décale',
  }),
]
