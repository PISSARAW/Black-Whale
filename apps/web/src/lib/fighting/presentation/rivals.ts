import type { FighterId } from '../types'
type Exchange = {
  pair: readonly [FighterId, FighterId]
  lines: readonly [string, string, string, string]
}
/** Selected identities only. These scenes do not assert knowledge of an opponent's Hatsu. */
export const RIVALS: readonly Exchange[] = [
  {
    pair: ['kurapika', 'chrollo'],
    lines: [
      'Je ne te perds pas de vue.',
      'I will not lose sight of you.',
      'Tu observes toujours aussi attentivement.',
      'You still watch just as closely.',
    ],
  },
  {
    pair: ['hisoka', 'chrollo'],
    lines: [
      'Accordons toute notre attention à ce duel.',
      'Let us give this duel our full attention.',
      'Alors, observe chaque choix.',
      'Then watch every choice.',
    ],
  },
  {
    pair: ['hisoka', 'illumi'],
    lines: [
      'Cette fois, on se fait face.',
      'This time, we face each other.',
      'Je ne négligerai aucun détail.',
      'I will overlook no detail.',
    ],
  },
  {
    pair: ['theta', 'tserriednich'],
    lines: [
      'Je vais surveiller tes appuis.',
      'I will watch your footing.',
      'Montre-moi ce que tu observes.',
      'Show me what you observe.',
    ],
  },
  {
    pair: ['benjamin', 'halkenburg'],
    lines: [
      'Tu es venu tenir ta position ?',
      'Have you come to hold your position?',
      'Je suis venu assumer mon choix.',
      'I have come to stand by my choice.',
    ],
  },
  {
    pair: ['kurapika', 'leorio'],
    lines: [
      'Gardons le contrôle de cet entraînement.',
      'Let us keep this practice under control.',
      'Compte sur moi pour tenir debout.',
      'Count on me to stay standing.',
    ],
  },
  {
    pair: ['kalluto', 'illumi'],
    lines: [
      'Je vais te montrer mes progrès.',
      'I will show you my progress.',
      'Alors, commence.',
      'Then begin.',
    ],
  },
  {
    pair: ['franklin', 'phinks'],
    lines: [
      'On connaît le signal de départ.',
      'We know the starting signal.',
      'Alors, plus de discussion.',
      'Then no more talking.',
    ],
  },
]
export function rivalLine(options: {
  actor: FighterId
  other: FighterId
  language: 'fr' | 'en'
}): string | null {
  const exchange = RIVALS.find(
    ({ pair }) => pair.includes(options.actor) && pair.includes(options.other),
  )
  if (!exchange || options.actor === options.other) return null
  const offset = exchange.pair[0] === options.actor ? 0 : 2
  return exchange.lines[offset + (options.language === 'en' ? 1 : 0)]
}
