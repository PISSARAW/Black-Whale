import type { ChapterScenes } from './apply.js'

export const CHAPTER_417: ChapterScenes = {
  chapter: 417,
  idPrefix: 'ch417',
  scenes: [
    {
      event: "Benjamin stages Tserriednich's execution and detains his guards",
      location: 'tier-1-royal-residential-sector-room-1004',
      participants: [
        ['prince-benjamin', 'ACTIVE'],
        ['prince-tserriednich', 'VICTIM'],
        ['salkov', 'OBSERVER'],
        ['danjin', 'PASSIVE'],
      ],
      moves: [
        {
          slug: 'salkov',
          location: 'tier-2-ministry-of-justice',
          id: 'ch417-presence-salkov-justice-bureau',
        },
        {
          slug: 'danjin',
          location: 'tier-2-ministry-of-justice',
          id: 'ch417-presence-danjin-justice-bureau',
        },
      ],
    },
    {
      event: 'Benjamin infects Tubeppa and Tyson with TSK-17',
      location: 'tier-1-royal-residential-sector-room-1001',
      participants: [
        ['prince-benjamin', 'ACTIVE'],
        ['prince-tubeppa', 'VICTIM'],
        ['prince-tyson', 'VICTIM'],
      ],
      moves: ['prince-benjamin', 'prince-tubeppa', 'prince-tyson'].map((slug) => ({
        slug,
        location: 'tier-1-royal-residential-sector-room-1001',
        id: `ch417-presence-${slug}-room1001`,
      })),
    },
    {
      event: 'Benjamin seizes the Justice Bureau and invokes emergency law',
      location: 'tier-2-ministry-of-justice',
      participants: [
        ['prince-benjamin', 'ACTIVE'],
        ['balsamilco-might', 'ACTIVE'],
        ['coventoba', 'ACTIVE'],
      ],
      moves: ['prince-benjamin', 'balsamilco-might', 'coventoba'].map((slug) => ({
        slug,
        location: 'tier-2-ministry-of-justice',
        id: `ch417-presence-${slug}-justice-bureau`,
      })),
    },
  ],
}
