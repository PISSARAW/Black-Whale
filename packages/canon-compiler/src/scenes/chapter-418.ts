import type { ChapterScenes } from './apply.js'

/**
 * Chapter 418 reveals that the body executed in 416 was Tserriednich's
 * Parallel Future prediction. He leaves room 1004, but the chapter does not
 * identify a mappable destination after he enters Route A.
 */
export const CHAPTER_418: ChapterScenes = {
  chapter: 418,
  idPrefix: 'ch418',
  scenes: [
    {
      event: 'Tserriednich tests the limits of Parallel Future',
      location: 'tier-1-royal-residential-sector-room-1004',
      participants: [
        ['prince-tserriednich', 'ACTIVE'],
        ['salkov', 'OBSERVER'],
      ],
    },
    {
      event: 'Tserriednich watches Benjamin execute his predicted double',
      location: 'tier-1-royal-residential-sector-room-1004',
      participants: [
        ['prince-tserriednich', 'ACTIVE'],
        ['prince-benjamin', 'ACTIVE'],
        ['salkov', 'OBSERVER'],
        ['vantine', 'OBSERVER'],
        ['danjin', 'OBSERVER'],
        ['butch', 'OBSERVER'],
      ],
    },
    {
      event: 'Tserriednich stages his own sealed-coffin wake',
      location: 'tier-1-royal-residential-sector-room-1004',
      participants: [
        ['prince-tserriednich', 'ACTIVE'],
        ['salkov', 'ACTIVE'],
        ['theta', 'OBSERVER'],
        ['vantine', 'OBSERVER'],
        ['danjin', 'OBSERVER'],
      ],
      moves: ['salkov', 'danjin'].map((slug) => ({
        slug,
        location: 'tier-1-royal-residential-sector-room-1004',
        id: `ch418-presence-${slug}-room1004`,
      })),
    },
    {
      event: 'Tserriednich leaves room 1004 through Route A',
      location: 'tier-1-royal-residential-sector-room-1004',
      participants: [
        ['prince-tserriednich', 'ACTIVE'],
        ['theta', 'OBSERVER'],
        ['salkov', 'OBSERVER'],
      ],
    },
  ],
}
