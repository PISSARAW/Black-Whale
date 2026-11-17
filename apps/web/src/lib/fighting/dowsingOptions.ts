import { dowsingVideoOptions } from './dowsingVideo'
import { canAskDowsing, ownsDowsing } from './dowsingRules'
import { performDowsingCommand } from './dowsingAction'
import { DOWSING_QUESTIONS } from './dowsingTypes'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

export function dowsingOptions(state: FightState, side: FightSide): ArsenalOption[] {
  const options: ArsenalOption[] = []
  if (ownsDowsing(state[side])) {
    for (const [question, label] of Object.entries(DOWSING_QUESTIONS))
      options.push({
        command: { action: 'dowsing-ask', target: question },
        labelFr: `Dowsing · ${label.fr}`,
        labelEn: `Dowsing · ${label.en}`,
        ready: canAskDowsing(state, side),
        conditionFr:
          'Face-à-face visible, parole et audition réelles. Réponse volontaire ; 3 aura et portée de voix sont des réglages de duel. Un mensonge conscient fait osciller le pendule, sans révéler la vérité cachée.',
        conditionEn:
          'Visible face-to-face contact with real speech and hearing. Voluntary reply; 3 aura and voice range are duel tuning. A knowing lie swings the pendulum without revealing hidden truth.',
      })
  }
  if (state[side].dowsingSession)
    options.push(
      option(state, side, {
        command: { action: 'dowsing-stop' },
        labels: ['Dowsing · Ranger le pendule', 'Dowsing · Put away the pendulum'],
      }),
    )
  if (state[side].dowsingPrompt)
    for (const answer of ['sincere', 'lie'])
      options.push(
        option(state, side, {
          command: { action: 'dowsing-answer', target: answer },
          labels:
            answer === 'sincere'
              ? ['Répondre sincèrement', 'Answer sincerely']
              : ['Mentir sciemment', 'Knowingly lie'],
        }),
      )
  return [...options, ...dowsingVideoOptions(state, side)]
}
function option(
  state: FightState,
  side: FightSide,
  input: { command: ArsenalCommand; labels: [string, string] },
): ArsenalOption {
  const { command, labels } = input
  return {
    command,
    labelFr: labels[0],
    labelEn: labels[1],
    ready: performDowsingCommand(state, side, command) !== state,
    conditionFr:
      'Choix volontaire. L’absence de réponse n’est pas un mensonge. Le résultat porte sur les paroles prononcées à cet instant, pas sur un état futur.',
    conditionEn:
      'Voluntary choice. Silence is not a lie. The result concerns the words spoken at this instant, never a future state.',
  }
}
