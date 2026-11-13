import { mangaView as view, type MangaCastStaging } from './mangaViewModel'

const hisokaIslandStaging: MangaCastStaging[] = [
  { characterId: 'hisoka', at: [-17.0, 0], heading: 0, pose: 'seated' },
  { characterId: 'hinrigh-biganduffno', at: [-14.5, 0.5], heading: -Math.PI, pose: 'idle' },
  { characterId: 'lynch-fullbokko', at: [-14.5, -0.5], heading: -Math.PI, pose: 'idle' },
]

const rampStaging: MangaCastStaging[] = [
  { characterId: 'hinrigh-biganduffno', at: [0, 2.5], heading: 0, pose: 'idle' },
  { characterId: 'zakuro-custard', at: [0, 5.0], heading: 0, pose: 'idle' },
]

const auditoriumStaging: MangaCastStaging[] = [
  { characterId: 'bonolenov-ndongo', at: [-24.5, 25.4], heading: 0, pose: 'seated' },
]

export const MANGA_CINEPLEX_VIEWS = [
  view({
    id: 'cineplex-concession-popcorn',
    spaceId: 'tier-3-cineplex-concession',
    at: [-20.5, 0],
    target: [-23.2, 0],
    pitch: 0.0,
    chapter: 393,
    volume: 38,
    staging: hisokaIslandStaging,
    label: 'The confectionery counter and popcorn machine in the cineplex concourse',
    labelFr: 'Le comptoir de confiserie et la machine à pop-corn dans le hall du cinéma',
  }),
  view({
    id: 'cineplex-ticket-windows-booths',
    spaceId: 'tier-3-cineplex-ticket-desk',
    at: [19.5, 0],
    target: [23.2, 0],
    pitch: 0.02,
    chapter: 393,
    volume: 38,
    label: 'The ticket windows and timetable displays across the concourse',
    labelFr: 'Les guichets de billetterie et les panneaux de séances dans le hall',
  }),
  view({
    id: 'cineplex-screens-descending-ramp',
    spaceId: 'tier-3-cineplex-screen-corridor',
    at: [0, 0],
    target: [0, 11.0],
    pitch: -0.04,
    chapter: 393,
    volume: 38,
    staging: rampStaging,
    label: 'The descending ramp with guardrails leading to screens 1 through 8',
    labelFr: 'La rampe descendante avec garde-corps menant aux salles 1 à 8',
  }),
  view({
    id: 'cineplex-hisoka-seating',
    spaceId: 'tier-3-cineplex-concession',
    at: [-13.5, 0],
    target: [-17, 0],
    pitch: -0.08,
    chapter: 393,
    volume: 38,
    staging: hisokaIslandStaging,
    label: 'The circular seating island where Hisoka waits with popcorn and soda',
    labelFr: "L'îlot circulaire de sièges où Hisoka attend avec pop-corn et soda",
  }),
  view({
    id: 'cineplex-auditorium-screen',
    spaceId: 'tier-3-cineplex-screen-1',
    at: [-23.5, 18.4],
    target: [-24.5, 36.8],
    pitch: 0.08,
    chapter: 393,
    volume: 38,
    staging: auditoriumStaging,
    label: 'The giant curved projection screen and tiered velvet seating in the auditorium',
    labelFr: "L'écran géant de projection incurvé et les gradins en velours dans la salle",
  }),
  view({
    id: 'cineplex-screens-hall-concourse',
    spaceId: 'tier-3-cineplex-screens-hall',
    at: [-20.0, 15.0],
    target: [15.0, 15.0],
    pitch: 0.0,
    chapter: 393,
    volume: 38,
    label: 'The lower concourse distributing access to screening rooms 1 through 8',
    labelFr: 'Le hall inférieur desservant les entrées des salles de projection 1 à 8',
  }),
  view({
    id: 'cineplex-ceiling-coffer-marquee',
    spaceId: 'tier-3-cineplex-screen-corridor',
    at: [0, 1.5],
    target: [0, 8.0],
    pitch: 0.28,
    chapter: 393,
    volume: 38,
    label: 'The coffered ceiling, exposed HVAC ducting and THE THING marquee',
    labelFr: 'Le plafond à caissons, les gaines de ventilation et le bandeau THE THING',
  }),
]
