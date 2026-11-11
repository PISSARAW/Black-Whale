import { MANGA_OBSERVATION_DECK_VIEWS } from './mangaObservationDeckViews'
import { MANGA_GENERAL_VIEWS } from './mangaGeneralViews'
import { MANGA_APARTMENT_VIEWS } from './mangaApartmentViews'
import { MANGA_CHA_R_VIEWS } from './mangaChaRViews'
import { MANGA_BANQUET_VIEWS } from './mangaBanquetViews'
import { MANGA_CASINO_VIEWS } from './mangaCasinoViews'
import { MANGA_PRISON_VIEWS } from './mangaPrisonViews'
import { MANGA_ROYAL_SALON_VIEWS } from './mangaRoyalSalonViews'
import { MANGA_DINING_HALL_VIEWS } from './mangaDiningHallViews'
import { MANGA_BURIAL_CHAMBER_VIEWS } from './mangaBurialChamberViews'
import { MANGA_QUEEN_UNMA_VIEWS } from './mangaQueenUnmaViews'
import { MANGA_BENJAMIN_ROOM_VIEWS } from './mangaBenjaminRoomViews'
import { MANGA_CAMILLA_VIEWS } from './mangaCamillaViews'
import { MANGA_ZHANG_LEI_VIEWS } from './mangaZhangLeiViews'
import { MANGA_VVIP_RECREATION_VIEWS } from './mangaVvipRecreationViews'
import { MANGA_JUSTICE_BUREAU_VIEWS } from './mangaJusticeBureauViews'
import { MANGA_CINEPLEX_VIEWS } from './mangaCineplexViews'
import { MANGA_HEILLY_VIEWS } from './mangaHeillyViews'
import { MANGA_POLICE_VIEWS } from './mangaPoliceViews'
import { MANGA_HOSPITAL_VIEWS } from './mangaHospitalViews'
import { MANGA_ROYAL_ARMY_CONFERENCE_VIEWS } from './mangaRoyalArmyConferenceViews'
import { MANGA_SCREENING_ROOM_VIEWS } from './mangaScreeningRoomViews'
import { MANGA_CENTRAL_COURTHOUSE_VIEWS } from './mangaCentralCourthouseViews'
import { mangaView as view, type MangaView } from './mangaViewModel'

export type { MangaCastStaging, MangaView } from './mangaViewModel'

/**
 * A catalogue of specific camera angles that reproduce panels from the manga.
 * The walk can jump the visitor here so they see exactly what the drawing shows.
 */
export const MANGA_VIEWS: MangaView[] = [
  ...MANGA_GENERAL_VIEWS,
  ...MANGA_BANQUET_VIEWS,
  ...MANGA_CASINO_VIEWS,
  ...MANGA_PRISON_VIEWS,
  ...MANGA_DINING_HALL_VIEWS,
  ...MANGA_BURIAL_CHAMBER_VIEWS,
  ...MANGA_JUSTICE_BUREAU_VIEWS,
  ...MANGA_CINEPLEX_VIEWS,
  ...MANGA_SCREENING_ROOM_VIEWS,
  ...MANGA_CENTRAL_COURTHOUSE_VIEWS,
  view({
    id: 'woble-dining-guards',
    spaceId: 'tier-1-royal-residential-sector-room-1014-dining',
    at: [2.15, -4.95],
    target: [8.3, -2.6],
    pitch: -0.04,
    chapter: 371,
    volume: 36,
    label: "Woble's guards gathered around the two meal-covered tables",
    labelFr: 'Les gardes de Woble réunis autour des deux longues tables de repas',
  }),
  view({
    id: 'kacho-living-homework',
    spaceId: 'tier-1-royal-residential-sector-room-1010-living',
    at: [0.8, 4.75],
    target: [-7.8, -2.35],
    pitch: -0.01,
    chapter: 376,
    volume: 36,
    label: 'Kacho studying beneath the coffered ceiling',
    labelFr: 'Kacho travaillant sous le plafond à caissons',
  }),
  view({
    id: 'kacho-kitchen-cabinet',
    spaceId: 'tier-1-royal-residential-sector-room-1010-kitchen',
    at: [2.15, -6.3],
    target: [6.8, -9.65],
    pitch: -0.05,
    chapter: 376,
    volume: 36,
    label: "Kacho's kitchen and the lower cupboard named in Melody's Morse code",
    labelFr: 'La cuisine de Kacho et le placard bas désigné par le morse de Senritsu',
  }),
  ...MANGA_ROYAL_SALON_VIEWS,
  ...MANGA_BENJAMIN_ROOM_VIEWS,
  view({
    id: 'lifeboat-round-hatch',
    spaceId: 'tier-1-lifeboats-port-pod-cabin',
    at: [1.75, 1.25],
    target: [0, -1.7],
    pitch: 0.03,
    chapter: 383,
    volume: 37,
    pages: '60–65',
    label: 'The ribbed lifeboat cabin facing its round hatch and console',
    labelFr: 'La cabine nervurée de la capsule face à son écoutille ronde et sa console',
  }),
  view({
    id: 'xi-yu-office-aerial-plan',
    spaceId: 'tier-4-xi-yu-family-office-meeting-room',
    at: [0, 1],
    target: [0, 0],
    pitch: -1.5,
    eyeHeight: 16,
    chapter: 380,
    volume: 36,
    label: 'Aerial plan of the published Xi-Yu office and guarded entrance',
    labelFr: 'Plan aérien du bureau Xi-Yu publié et de son entrée gardée',
    triggerSpaceIds: ['tier-4-xi-yu-family-office-entrance'],
  }),
  view({
    id: 'cineplex-establishing-shot',
    spaceId: 'tier-3-cineplex-screen-corridor',
    triggerSpaceIds: ['tier-3-cineplex-concession', 'tier-3-cineplex-ticket-desk'],
    at: [0, -4.25],
    target: [0, 9.8],
    pitch: 0.02,
    chapter: 393,
    volume: 38,
    label: 'The cineplex hall between the concession stand, ticket desks and screens',
    labelFr: 'Le hall du cinéma entre la confiserie, les guichets et les salles',
  }),
  view({
    id: 'room-3101-bunks-storage',
    spaceId: 'tier-3-residential-room-3101-living',
    at: [1, 0],
    target: [-6.25, 0.45],
    pitch: -0.02,
    chapter: 393,
    volume: 38,
    pages: '64–67',
    label: 'Room 3101 facing the stacked bunk and open wall storage',
    labelFr: 'La chambre 3101 face au lit superposé et au rangement mural ouvert',
  }),
  view({
    id: 'room-3101-bathroom-trap',
    spaceId: 'tier-3-residential-room-3101-living',
    at: [-4.7, 2.8],
    target: [2, 0],
    pitch: -0.03,
    chapter: 398,
    volume: 38,
    pages: '150–153',
    label: 'Room 3101 facing the Heil-Ly bathroom trap',
    labelFr: 'La chambre 3101 face au piège Heil-Ly de la salle de bains',
  }),
  view({
    id: 'first-class-cabins-aerial-plan',
    spaceId: 'tier-3-residential-first-class-companionway',
    at: [0, 2],
    target: [0, 1],
    pitch: -1.5,
    eyeHeight: 34,
    chapter: 393,
    volume: 38,
    label: 'Aerial plan of the published first-class cabins',
    labelFr: 'Plan aérien des cabines de première classe publiées',
    triggerSpaceIds: [
      'tier-3-residential-first-class-hallway',
      'tier-3-residential-first-class-upper-corridor',
    ],
    visibleSpaceIds: [
      'tier-3-residential-first-class-suite-1',
      'tier-3-residential-first-class-suite-1-wc',
      'tier-3-residential-first-class-suite-2',
      'tier-3-residential-first-class-suite-2-wc',
      'tier-3-residential-first-class-suite-3',
      'tier-3-residential-first-class-suite-3-wc',
      'tier-3-residential-first-class-upper-cabin-1',
      'tier-3-residential-first-class-upper-cabin-1-wc',
      'tier-3-residential-first-class-upper-cabin-2',
      'tier-3-residential-first-class-upper-cabin-2-wc',
      'tier-3-residential-first-class-upper-cabin-3',
      'tier-3-residential-first-class-upper-cabin-3-wc',
    ],
  }),
  ...MANGA_QUEEN_UNMA_VIEWS,
  ...MANGA_CAMILLA_VIEWS,
  ...MANGA_ZHANG_LEI_VIEWS,
  ...MANGA_VVIP_RECREATION_VIEWS,
  ...MANGA_CHA_R_VIEWS,
  ...MANGA_HEILLY_VIEWS,
  ...MANGA_POLICE_VIEWS,
  ...MANGA_HOSPITAL_VIEWS,
  ...MANGA_ROYAL_ARMY_CONFERENCE_VIEWS,
  view({
    id: 'heilly-hideout-aerial-plan',
    spaceId: 'tier-2-heilly-secret-hideout-corridor',
    at: [-1.6, -3.5],
    target: [-1.6, -4.5],
    pitch: -1.48,
    eyeHeight: 28,
    chapter: 399,
    volume: 38,
    label: 'Aerial plan of the published Heil-Ly hideout rooms',
    labelFr: 'Plan aérien des pièces publiées de la planque Heil-Ly',
    triggerSpaceIds: [
      'tier-2-heilly-secret-hideout-processing',
      'tier-2-heilly-secret-hideout-laundry',
      'tier-2-heilly-secret-hideout-communal',
    ],
    visibleSpaceIds: [
      'tier-2-heilly-secret-hideout-processing',
      'tier-2-heilly-secret-hideout-laundry',
      'tier-2-heilly-secret-hideout-communal',
      'tier-2-heilly-secret-hideout-office',
    ],
  }),
  ...MANGA_OBSERVATION_DECK_VIEWS,
  ...MANGA_APARTMENT_VIEWS,
]

export function viewsForSpace(spaceId: string | null): MangaView[] {
  if (!spaceId) return []
  return MANGA_VIEWS.filter(
    (view) => view.spaceId === spaceId || view.triggerSpaceIds?.includes(spaceId),
  )
}

export function mangaViewById(id: string | null): MangaView | null {
  if (!id) return null
  return MANGA_VIEWS.find((view) => view.id === id) ?? null
}
