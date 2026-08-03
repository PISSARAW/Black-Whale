import type { ChapterScenes } from './apply.js'

/** Which royal camp sits in which apartment when martial law is declared. */
const CAMP_ROOMS: ReadonlyArray<readonly [string, readonly string[]]> = [
  ['tier-1-royal-residential-sector-room-1003', ['prince-zhanglei', 'coventoba']],
  ['tier-1-royal-residential-sector-room-1004', ['theta', 'salkov']],
  ['tier-1-royal-residential-sector-room-1005', ['prince-tubeppa', 'maor', 'rihan']],
  ['tier-1-royal-residential-sector-room-1006', ['prince-tyson']],
  ['tier-1-royal-residential-sector-room-1011', ['prince-fugetsu']],
  ['tier-1-royal-residential-sector-room-1013', ['biscuit-krueger', 'vergei', 'prince-marayam']],
]

const campMoves = CAMP_ROOMS.flatMap(([location, slugs]) =>
  slugs.map((slug) => ({ slug, location, id: `ch415-presence-${slug}-${location}` })),
)

export const CHAPTER_415: ChapterScenes = {
  chapter: 415,
  idPrefix: 'ch415',
  scenes: [
    {
      // Off the ship and years earlier; nobody moves.
      event: 'Furykov confronts Beyond about his sacrificial curse',
      participants: [
        ['furykov', 'ACTIVE'],
        ['beyond-netero', 'ACTIVE'],
      ],
    },
    {
      event: 'Kurapika and Oito prepare a message for the mainland',
      location: 'tier-1-royal-residential-sector-room-1014',
      participants: [
        ['kurapika', 'ACTIVE'],
        ['queen-oito', 'ACTIVE'],
        ['bill', 'PASSIVE'],
        ['babimyna', 'OBSERVER'],
      ],
      moves: ['kurapika', 'queen-oito', 'bill', 'babimyna'].map((slug) => ({
        slug,
        location: 'tier-1-royal-residential-sector-room-1014',
        id: `ch415-presence-${slug}-room1014`,
      })),
    },
    {
      event: 'The royal camps respond to special martial law',
      location: 'tier-1-royal-residential-sector',
      participants: [
        ['prince-zhanglei', 'PASSIVE'],
        ['coventoba', 'OBSERVER'],
        ['prince-tubeppa', 'PASSIVE'],
        ['maor', 'OBSERVER'],
        ['rihan', 'OBSERVER'],
        ['theta', 'OBSERVER'],
        ['salkov', 'OBSERVER'],
        ['prince-tyson', 'PASSIVE'],
        ['prince-fugetsu', 'PASSIVE'],
        ['biscuit-krueger', 'OBSERVER'],
        ['vergei', 'OBSERVER'],
        ['prince-marayam', 'PASSIVE'],
      ],
      moves: campMoves,
    },
    {
      event: 'Ridge subdues Kanjidol during martial law',
      location: 'tier-1-royal-residential-sector',
      participants: [
        ['ridge', 'ACTIVE'],
        ['kanjidol', 'VICTIM'],
      ],
      // The sector, not a room: canon shows the arrest in the corridors.
      moves: ['ridge', 'kanjidol'].map((slug) => ({
        slug,
        location: 'tier-1-royal-residential-sector',
        id: `ch415-presence-${slug}-royal-sector`,
        precision: 'ZONE' as const,
      })),
      bodyStates: [{ slug: 'kanjidol', state: 'INJURED', id: 'ch415-kanjidol-injured' }],
    },
  ],
}
