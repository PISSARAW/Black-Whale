import { personActivationReady, personDolphinCanLend } from './dolphinPeopleAction'
import { personDolphinAwake } from './dolphinPeopleState'
import { liveEntity } from './preparationWorld'
import type { ArsenalActionId, ArsenalOption } from './retrospectiveTypes'
import type { PreparedEntity } from './preparationTypes'
import type { FightSide, FightState } from './types'

const ORDERS = [
  ['person-eye-left', 'Aller à gauche', 'Move left'],
  ['person-eye-right', 'Aller à droite', 'Move right'],
  ['person-eye-look-left', 'Regarder à gauche', 'Look left'],
  ['person-eye-look-right', 'Regarder à droite', 'Look right'],
  ['person-eye-stay', 'Rester sur place', 'Stay'],
  ['person-eye-release', 'Libérer l’animal', 'Release the animal'],
] as const
export function personDolphinOptions(state: FightState, side: FightSide): ArsenalOption[] {
  return (state.battlefield?.entities ?? [])
    .filter((entry) => entry.person && liveEntity(entry))
    .flatMap((entry) => [
      ...personLendOption(state, side, entry),
      ...recipientOptions(state, side, entry),
    ])
}
function personLendOption(
  state: FightState,
  side: FightSide,
  entry: PreparedEntity,
): ArsenalOption[] {
  const held = state[side].kurapika?.held
  if (!held?.loaded || held.used || entry.person?.loan) return []
  return [
    personOption(entry, {
      action: 'dolphin-lend',
      labelFr: 'Prêter à Oito',
      labelEn: 'Lend to Oito',
      ready: personDolphinCanLend(state, side, entry),
    }),
  ]
}
function recipientOptions(
  state: FightState,
  side: FightSide,
  entry: PreparedEntity,
): ArsenalOption[] {
  const person = entry.person!
  if (person.control.side !== side || !person.loan) return []
  const awake = personDolphinAwake(state, entry)
  const result = [
    personOption(entry, {
      action: 'person-dolphin-use',
      labelFr: 'Oito · Utiliser le Hatsu prêté',
      labelEn: 'Oito · Use the loaned Hatsu',
      ready: awake && personActivationReady(state, entry),
    }),
    personOption(entry, {
      action: 'person-dolphin-close',
      labelFr: 'Oito · Fermer Dolphin',
      labelEn: 'Oito · Dismiss Dolphin',
      ready: awake && Boolean(person.loan.held.returned),
    }),
  ]
  if (
    !state.battlefield?.entities.some(
      (animal) => liveEntity(animal) && animal.controller?.person === entry.id,
    )
  )
    return result
  return [
    ...result,
    ...ORDERS.map(([action, labelFr, labelEn]) =>
      personOption(entry, {
        action,
        labelFr: `Oito · ${labelFr}`,
        labelEn: `Oito · ${labelEn}`,
        ready: awake,
      }),
    ),
  ]
}
function personOption(
  entry: PreparedEntity,
  option: {
    action: ArsenalActionId
    labelFr: string
    labelEn: string
    ready: boolean
  },
): ArsenalOption {
  return {
    command: { action: option.action, target: entry.id },
    labelFr: option.labelFr,
    labelEn: option.labelEn,
    ready: option.ready,
    conditionFr:
      'Destinataire réel ; aura du donneur, conditions et matériel conservés. Nœuds entrouverts après activation, sans Ten ni Hatsu personnel. Emperor Time continue jusqu’à la fermeture de Dolphin.',
    conditionEn:
      'Actual recipient; donor aura, conditions and equipment preserved. Nodes partly open after activation, without Ten or a personal Hatsu. Emperor Time continues until Dolphin is dismissed.',
  }
}
