import type { ChapterScenes } from './apply.js'

const OLD_AGGREGATED_PRESENCES = [
  ['tier-1-royal-residential-sector-room-1003', ['prince-zhanglei', 'coventoba']],
  ['tier-1-royal-residential-sector-room-1004', ['theta', 'salkov']],
  ['tier-1-royal-residential-sector-room-1005', ['prince-tubeppa', 'maor', 'rihan']],
  ['tier-1-royal-residential-sector-room-1006', ['prince-tyson']],
  ['tier-1-royal-residential-sector-room-1011', ['prince-fugetsu']],
  ['tier-1-royal-residential-sector-room-1013', ['biscuit-krueger', 'vergei', 'prince-marayam']],
] as const

const retiredCampPresenceIds = OLD_AGGREGATED_PRESENCES.flatMap(([location, slugs]) =>
  slugs.map((slug) => `ch415-presence-${slug}-${location}`),
)

export const CHAPTER_415: ChapterScenes = {
  chapter: 415,
  idPrefix: 'ch415',
  retiredPresenceIds: [
    ...retiredCampPresenceIds,
    'ch415-presence-bill-room1014',
    'ch415-presence-ridge-royal-sector',
    'ch415-presence-kanjidol-royal-sector',
  ],
  scenes: [
    {
      event: 'Kurapika and Oito prepare a message for the mainland',
      location: 'tier-1-royal-residential-sector-room-1014',
      participants: [
        ['kurapika', 'ACTIVE'],
        ['queen-oito', 'ACTIVE'],
        ['shimanu', 'OBSERVER'],
        ['oito-nephew-fake-woble', 'PASSIVE'],
        ['babimyna', 'OBSERVER'],
      ],
      moves: ['kurapika', 'queen-oito', 'shimanu', 'oito-nephew-fake-woble', 'babimyna'].map(
        (slug) => ({
          slug,
          location: 'tier-1-royal-residential-sector-room-1014',
          id: `ch415-presence-${slug}-room1014`,
        }),
      ),
    },
    {
      event: 'Martial law reaches Camilla and rooms 1003 through 1006',
      participants: [
        ['prince-camilla', 'OBSERVER'],
        ['coventoba', 'OBSERVER'],
        ['prince-tserriednich', 'ACTIVE'],
        ['salkov', 'OBSERVER'],
        ['prince-tubeppa', 'ACTIVE'],
        ['rihan', 'ACTIVE'],
        ['heisen', 'OBSERVER'],
        ['komiya', 'OBSERVER'],
        ['prince-tyson', 'PASSIVE'],
        ['orau', 'OBSERVER'],
      ],
      moves: [
        {
          slug: 'prince-camilla',
          location: 'tier-1-vip-jail',
          id: 'ch415-presence-prince-camilla-vip-jail',
        },
        {
          slug: 'coventoba',
          location: 'tier-1-royal-residential-sector-room-1003',
          id: 'ch415-presence-coventoba-room1003',
        },
        ...['prince-tserriednich', 'salkov'].map((slug) => ({
          slug,
          location: 'tier-1-royal-residential-sector-room-1004',
          id: `ch415-presence-${slug}-room1004`,
        })),
        ...['prince-tubeppa', 'rihan', 'heisen', 'komiya'].map((slug) => ({
          slug,
          location: 'tier-1-royal-residential-sector-room-1005',
          id: `ch415-presence-${slug}-room1005`,
        })),
        ...['prince-tyson', 'orau'].map((slug) => ({
          slug,
          location: 'tier-1-royal-residential-sector-room-1006',
          id: `ch415-presence-${slug}-room1006`,
        })),
      ],
    },
    {
      event: 'Ridge subdues Kanjidol during martial law',
      location: 'tier-1-royal-residential-sector-room-1007',
      participants: [
        ['ridge', 'ACTIVE'],
        ['kanjidol', 'VICTIM'],
        ['basho', 'OBSERVER'],
        ['satobi', 'OBSERVER'],
      ],
      moves: ['ridge', 'kanjidol', 'basho', 'satobi'].map((slug) => ({
        slug,
        location: 'tier-1-royal-residential-sector-room-1007',
        id: `ch415-presence-${slug}-room1007`,
      })),
      bodyStates: [{ slug: 'kanjidol', state: 'INJURED', id: 'ch415-kanjidol-injured' }],
    },
    {
      event: 'Seiko evacuates room 1011 while Fugetsu stays under Justice protection',
      location: 'tier-1-vvip-living-quarters',
      participants: [
        ['seiko-hui-guo-rou', 'ACTIVE'],
        ['prince-fugetsu', 'PASSIVE'],
      ],
      moves: [
        {
          slug: 'seiko-hui-guo-rou',
          location: 'tier-1-vvip-living-quarters',
          id: 'ch415-presence-seiko-vvip-quarters',
        },
      ],
    },
    {
      event: "Marayam's camp remains inside room 1013's Nen space",
      location: 'tier-1-royal-residential-sector-room-1013',
      participants: [
        ['prince-marayam', 'PASSIVE'],
        ['sevanti-hui-guo-rou', 'PASSIVE'],
        ['biscuit-krueger', 'ACTIVE'],
        ['vergei', 'ACTIVE'],
        ['saquelle', 'OBSERVER'],
      ],
      moves: ['prince-marayam', 'sevanti-hui-guo-rou', 'biscuit-krueger', 'vergei', 'saquelle'].map(
        (slug) => ({
          slug,
          location: 'tier-1-royal-residential-sector-room-1013',
          id: `ch415-presence-${slug}-room1013`,
        }),
      ),
    },
    {
      event: "Oito is confined to room 1014's bedroom",
      location: 'tier-1-royal-residential-sector-room-1014',
      participants: [
        ['queen-oito', 'PASSIVE'],
        ['kurapika', 'OBSERVER'],
        ['babimyna', 'ACTIVE'],
        ['shimanu', 'OBSERVER'],
        ['oito-nephew-fake-woble', 'PASSIVE'],
      ],
    },
  ],
}
