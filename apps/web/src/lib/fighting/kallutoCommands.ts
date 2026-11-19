import { mutePaperDolls, paperDolls } from './kallutoSurveillance'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

export function performPaperReceiverCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  if (command.action !== 'paper-stop-listening') return state
  if (!paperDolls(state[side]).some((doll) => doll.active !== false)) return state
  return { ...state, [side]: mutePaperDolls(state[side]) }
}

export function paperReceiverOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (!paperDolls(state[side]).some((doll) => doll.active !== false)) return []
  return [
    {
      command: { action: 'paper-stop-listening' },
      ready: true,
      labelFr: 'Papier · Arrêter l’écoute des poupées',
      labelEn: 'Paper · Stop listening through dolls',
      conditionFr:
        'Termine la surveillance. Les papiers physiques et les paroles déjà reçues restent présents ; une nouvelle écoute exige une activation admissible.',
      conditionEn:
        'Ends surveillance. Physical paper and received words remain; starting again requires an admissible activation.',
    },
  ]
}
