import { mangaView as view, type MangaCastStaging, type MangaView } from './mangaViewModel'
import {
  JUSTICE_DEPUTY_OFFICE,
  JUSTICE_LOBBY,
  JUSTICE_VISITATION,
} from './justiceBureauView'

const interrogationStaging: MangaCastStaging[] = [
  { characterId: 'melody', at: [-2.1, -5.8], heading: 0, pose: 'seated' },
  { characterId: 'kaiser', at: [1.1, -5.8], heading: 0, pose: 'seated' },
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
    at: [10.5, 3.0],
    target: [10.5, 7.5],
    pitch: 0.04,
    chapter: 400,
    volume: 38,
    pages: '194–195',
    label: 'Visitation parlor: glass separation barrier, transfer drawer and recording booth',
    labelFr:
      'Parloir d’enregistrement : vitre de séparation, tiroir de transfert et cabine d’enregistrement',
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
    label: 'Justice Bureau lobby: official reception desk and security checkpoint',
    labelFr:
      'Hall d’accueil du Ministère de la Justice : comptoir d’enregistrement et poste de contrôle',
  }),
]
