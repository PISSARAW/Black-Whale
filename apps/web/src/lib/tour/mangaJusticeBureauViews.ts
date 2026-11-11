import { mangaView as view, type MangaCastStaging, type MangaView } from './mangaViewModel'
import { JUSTICE_DEPUTY_OFFICE, JUSTICE_LOBBY, JUSTICE_VISITATION } from './justiceBureauView'

const interrogationStaging: MangaCastStaging[] = [
  { characterId: 'melody', at: [-2.1, -5.8], heading: 0, pose: 'seated' },
  { characterId: 'kaiser', at: [1.1, -5.8], heading: 0, pose: 'seated' },
]

const visitationStaging: MangaCastStaging[] = [
  { characterId: 'prince-fugetsu', at: [10, 7.25], heading: -Math.PI, pose: 'seated' },
  { characterId: 'melody', at: [13.5, 4.05], heading: 0, pose: 'idle' },
]

const lobbyStaging: MangaCastStaging[] = [
  { characterId: 'botobai-gigante', at: [-14.5, -9.5], heading: 0, pose: 'idle' },
  { characterId: 'kaiser', at: [-14.5, -7.5], heading: Math.PI, pose: 'idle' },
]

export const MANGA_JUSTICE_BUREAU_VIEWS: MangaView[] = [
  view({
    id: 'justice-office-1010-interrogation',
    spaceId: JUSTICE_DEPUTY_OFFICE,
    at: [-0.5, -4.5],
    target: [-0.5, -8.5],
    pitch: 0.02,
    chapter: 400,
    volume: 38,
    pages: '194–199',
    staging: interrogationStaging,
    label:
      'Judicial office 1010: magistrate desk facing visitor chairs against full-height legal bookcases',
    labelFr:
      'Bureau judiciaire 1010 : bureau de magistrat face aux chaises visiteurs devant les bibliothèques juridiques toute hauteur',
  }),
  view({
    id: 'justice-visitation-partition',
    spaceId: JUSTICE_VISITATION,
    at: [10.5, -0.5],
    target: [10.5, 7.5],
    pitch: 0.04,
    chapter: 400,
    volume: 38,
    pages: '194–195',
    staging: visitationStaging,
    label: 'Visitation room: open L-shaped glass enclosure, long counter and side clerk station',
    labelFr: 'Parloir : enceinte vitrée ouverte en L, long comptoir et poste de greffe latéral',
  }),
  view({
    id: 'justice-lobby-reception',
    spaceId: JUSTICE_LOBBY,
    at: [-14.5, -6.5],
    target: [-14.5, -11.0],
    pitch: 0.03,
    chapter: 400,
    volume: 38,
    pages: '194',
    staging: lobbyStaging,
    label: 'Justice Bureau lobby: official reception desk and security checkpoint',
    labelFr:
      'Hall d’accueil du Ministère de la Justice : comptoir d’enregistrement et poste de contrôle',
  }),
]
