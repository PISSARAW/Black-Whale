import type { ChapterScenes } from './apply.js'

/** Only the final scene identifies a precise destination after Route A. */
export const CHAPTER_419: ChapterScenes = {
  chapter: 419,
  idPrefix: 'ch419',
  scenes: [
    {
      event: "Tserriednich measures the range of Laplace's Devil",
      participants: [['prince-tserriednich', 'ACTIVE']],
    },
    {
      event: 'Tserriednich kills the first four soldiers in the VVIP corridor',
      participants: [['prince-tserriednich', 'ACTIVE']],
    },
    {
      event: "Laplace's Devil is named and tested against the royal soldiers",
      participants: [['prince-tserriednich', 'ACTIVE']],
    },
    {
      event: 'The royal army locks down Tier 1 and retracts the bridges',
      participants: [['prince-tserriednich', 'OBSERVER']],
    },
    {
      event: 'Tserriednich reaches the VIP casino after Route A is retracted',
      location: 'tier-1-vip-casino',
      participants: [['prince-tserriednich', 'ACTIVE']],
    },
  ],
}
