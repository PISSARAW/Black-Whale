import { LYNCH_MOVE, LYNCH_QUESTION_RANGE } from './lynchTypes'
import type { FighterMoveset } from './movesetTypes'

export function tuneLynchMoveset(base: FighterMoveset): FighterMoveset {
  if (base.fighterId !== 'lynch') return base
  const physical = base.moves.filter((move) => !['special', 'finisher'].includes(move.category))
  const ids = new Set(physical.map((move) => move.id))
  const question = base.moves.find((move) => move.id === LYNCH_MOVE)!
  return {
    ...base,
    mechanicFr:
      'Body and Soul : L pose une question, puis un vrai coup de poing fait répondre le corps d’une cible encore consciente. Choisissez la question dans le panneau. La réponse est privée et décrit le moment du contact, jamais une action future. Aucun malus de défense ni finisher. Portée de parole et coût de 10 aura par réponse : réglages de duel.',
    mechanicEn:
      'Body and Soul: L asks a question, then a real fist strike makes a still-conscious target’s body answer. Choose a question in the panel. Replies are private snapshots of contact, never future actions. No defence debuff or finisher. Speech range and 10 aura per answer are duel tuning.',
    finisherConditionFr: '',
    finisherConditionEn: '',
    moves: [
      ...physical.map((move) => ({
        ...move,
        cancelInto: move.cancelInto.filter((id) => ids.has(id)),
      })),
      {
        ...question,
        nameFr: 'Body and Soul · Question',
        nameEn: 'Body and Soul · Question',
        auraCost: 0,
        input: 'L · question, puis J/K · poing',
        cancelInto: [],
        canon: {
          source: 'Hunter × Hunter, chapter 390 — Body and Soul',
          evidence: 'manga-shown',
          conditions: [
            'Ask the conscious target a clear question, then connect with a fist while Nen is available.',
          ],
          prohibitions: [
            'No automatic stun, magical vulnerability, future-command reading or offensive finisher. Only the questioner and target hear the truthful reply.',
          ],
          narrativeCost:
            'Close contact and keeping the target conscious. Speech range, supported questions and aura cost are duel adaptations.',
          narrativeEffect: 'The target’s own body answers the question truthfully.',
        },
        tuning: {
          ...question.tuning,
          damage: 0,
          startup: 1,
          active: 1,
          recovery: 0,
          hitstun: 0,
          blockstun: 0,
          hitstop: 0,
          knockback: 0,
          lunge: 0,
          reach: LYNCH_QUESTION_RANGE,
        },
      },
    ],
    combos: base.combos.map((route) => route.filter((id) => ids.has(id))),
  }
}
