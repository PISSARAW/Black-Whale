import type { CombatFighter, CombatRoute } from './combatRoutes'
import type { FighterId, MoveSlot } from './types'
import {
  WAKEUP_ROSTER_FINISHES,
  ROSTER_WAKEUP_PAIRS,
  type WakeupRosterFighter,
  type WakeupSignature,
} from './wakeupRosterProfiles'

const DUELS = {
  kurapika: ['hisoka', 'forwardHeavy', 'forwardSpecial'],
  hisoka: ['kurapika', 'backHeavy', 'neutralSpecial'],
  franklin: ['benjamin', 'forwardHeavy', 'forwardSpecial'],
  benjamin: ['franklin', 'forwardHeavy', 'neutralSpecial'],
} as const

type PilotFighter = keyof typeof DUELS
type Ending = 'sweep' | 'carry' | 'technique' | 'standing'

const TITLES = {
  sweep: ['Relevée · balayage proche', 'Wakeup · close sweep'],
  carry: ['Relevée · repousser vers le coin', 'Wakeup · carry toward the corner'],
  technique: ['Relevée · finir avec une technique', 'Wakeup · technique finish'],
  standing: ['Reprise · fin debout', 'Recovery · standing finish'],
} as const

const REQUIREMENTS = {
  sweep: ['Reste à proximité et conserve ton aura.', 'Stay close and save your aura.'],
  carry: [
    'Gagne du terrain. Au centre, il faut couvrir davantage de distance avant la relevée.',
    'Gain ground. At midscreen, cover more distance before wakeup.',
  ],
  standing: [
    'La cible récupère debout. Observe qui peut agir en premier et conserve ton aura.',
    'The defender recovers standing. Watch who can act first and save your aura.',
  ],
} as const

const TECHNIQUES = {
  kurapika: [
    'Fouet divinatoire · 24 aura. Le coup met au sol.',
    'Dowsing Whip · 24 aura. It knocks down.',
  ],
  hisoka: [
    'Bungee Gum · 40 aura. L’attache reste disponible après la mise au sol.',
    'Bungee Gum · 40 aura. The tether stays available after the knockdown.',
  ],
  franklin: [
    'Rafale courte · 24 aura. La cible reste debout et récupère en premier.',
    'Short barrage · 24 aura. The defender stays standing and recovers first.',
  ],
  benjamin: [
    'Air Blow · 40 aura. L’héritage doit être actif pour mettre au sol.',
    'Air Blow · 40 aura. Its inheritance must be active for the knockdown.',
  ],
} as const

interface WakeupOpener {
  fighter: CombatFighter
  opponent: FighterId
  second: MoveSlot
}

type WakeupEnding =
  | {
      id: Exclude<Ending, 'technique'>
      slot: MoveSlot
    }
  | (WakeupSignature & { id: 'technique'; hits?: readonly number[] })

function lesson(opener: WakeupOpener, ending: WakeupEnding): CombatRoute {
  const { id, slot } = ending
  return {
    id: `${opener.fighter}:wakeup-${id}`,
    fighter: opener.fighter,
    kind: 'confirm',
    title: TITLES[id],
    moves: ['standingLight', opener.second, slot],
    requirement: id === 'technique' ? ending.requirement : REQUIREMENTS[id],
    wakeup: opener.opponent,
    ...(id === 'technique' ? { setup: ending.setup, hits: ending.hits } : {}),
  }
}

function choices(opener: WakeupOpener, carry: MoveSlot, third: WakeupEnding): CombatRoute[] {
  return [
    lesson(opener, { id: 'sweep', slot: 'lowHeavy' }),
    lesson(opener, { id: 'carry', slot: carry }),
    lesson(opener, third),
  ]
}

const PILOT_WAKEUP_LESSONS = (Object.keys(DUELS) as PilotFighter[]).flatMap((fighter) => {
  const [opponent, carry, slot] = DUELS[fighter]
  return choices({ fighter, opponent, second: 'standingHeavy' }, carry, {
    id: 'technique',
    slot,
    requirement: TECHNIQUES[fighter],
    hits: fighter === 'franklin' ? [1, 1, 10] : undefined,
  })
})

function rosterChoices(fighter: WakeupRosterFighter, opponent: WakeupRosterFighter): CombatRoute[] {
  const opener: WakeupOpener = { fighter, opponent, second: 'standingHeavy' }
  const finish = WAKEUP_ROSTER_FINISHES[fighter]
  const third: WakeupEnding =
    typeof finish === 'string' ? { id: 'standing', slot: finish } : { id: 'technique', ...finish }
  if (fighter === 'chrollo')
    return choices({ ...opener, second: 'backHeavy' }, 'forwardLight', third)
  if (fighter === 'hanzo')
    return choices({ ...opener, second: 'forwardLight' }, 'forwardHeavy', third)
  return choices(opener, 'forwardHeavy', third)
}

export const WAKEUP_LESSONS = [
  ...PILOT_WAKEUP_LESSONS,
  ...ROSTER_WAKEUP_PAIRS.flatMap(([first, second]) => [
    ...rosterChoices(first, second),
    ...rosterChoices(second, first),
  ]),
]
