import type { ChapterScenes } from './apply.js'

/** The predicted corpse is an illusion, so it creates no DEAD body state. */
export const CHAPTER_420: ChapterScenes = {
  chapter: 420,
  idPrefix: 'ch420',
  scenes: [
    {
      event: 'Tserriednich discovers the casino patrols killed without gunfire',
      location: 'tier-1-vip-casino',
      participants: [['prince-tserriednich', 'ACTIVE']],
    },
    {
      event: 'Tserriednich encounters Hisoka in the VIP casino',
      location: 'tier-1-vip-casino',
      participants: [
        ['prince-tserriednich', 'ACTIVE'],
        ['hisoka', 'ACTIVE'],
      ],
    },
    {
      event: 'Hisoka kills the patrols while Tserriednich escapes the predicted death',
      location: 'tier-1-vip-casino',
      participants: [
        ['prince-tserriednich', 'ACTIVE'],
        ['hisoka', 'ACTIVE'],
      ],
    },
    {
      event: 'The casino exit is surrounded and Tserriednich plans to recharge',
      location: 'tier-1-vip-casino',
      participants: [['prince-tserriednich', 'ACTIVE']],
    },
  ],
}
