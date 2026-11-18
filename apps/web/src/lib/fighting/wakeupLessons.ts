import type { CombatRoute } from './combatRoutes'
import type { MoveSlot } from './types'

const DUELS = {
  kurapika: ['hisoka', 'forwardHeavy', 'forwardSpecial'],
  hisoka: ['kurapika', 'backHeavy', 'neutralSpecial'],
  franklin: ['benjamin', 'forwardHeavy', 'forwardSpecial'],
  benjamin: ['franklin', 'forwardHeavy', 'neutralSpecial'],
} as const

type Fighter = keyof typeof DUELS
type Ending = 'sweep' | 'carry' | 'technique'

const TITLES = {
  sweep: ['Relevée · balayage proche', 'Wakeup · close sweep'],
  carry: ['Relevée · repousser vers le coin', 'Wakeup · carry toward the corner'],
  technique: ['Relevée · finir avec une technique', 'Wakeup · technique finish'],
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

function lesson(fighter: Fighter, ending: Ending, slot: MoveSlot): CombatRoute {
  const requirement =
    ending === 'technique'
      ? TECHNIQUES[fighter]
      : ending === 'sweep'
        ? (['Reste à proximité et conserve ton aura.', 'Stay close and save your aura.'] as const)
        : ([
            'Gagne du terrain. Au centre, il faut couvrir davantage de distance avant la relevée.',
            'Gain ground. At midscreen, cover more distance before wakeup.',
          ] as const)
  return {
    id: `${fighter}:wakeup-${ending}`,
    fighter,
    kind: 'confirm',
    title: TITLES[ending],
    moves: ['standingLight', 'standingHeavy', slot],
    requirement,
    wakeup: DUELS[fighter][0],
    ...(fighter === 'franklin' && ending === 'technique' ? { hits: [1, 1, 10] } : {}),
  }
}

export const WAKEUP_LESSONS = (Object.keys(DUELS) as Fighter[]).flatMap((fighter) => [
  lesson(fighter, 'sweep', 'lowHeavy'),
  lesson(fighter, 'carry', DUELS[fighter][1]),
  lesson(fighter, 'technique', DUELS[fighter][2]),
])
