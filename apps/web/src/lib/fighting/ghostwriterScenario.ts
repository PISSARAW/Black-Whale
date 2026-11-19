import { FORTUNE_PARTICIPANT, FORTUNE_SCENARIO_MONTH } from './ghostwriterScenarioData'
import type { PreparedEntity } from './preparationTypes'
import type { FightState } from './types'
import './ghostwriterTypes'

export function prepareFortuneScenario(state: FightState): FightState {
  const setup = state.environment.preparation
  if (setup?.mode !== 'scenario' || !setup.resources.includes('fortunes')) return state
  const id = 'scenario:fortune-identity'
  const person: PreparedEntity = {
    id: 'scenario:fortune-participant',
    kind: 'person',
    owner: 'neutral',
    x: 52,
    y: 0,
    health: 40,
    present: true,
    material: 'real',
    consenting: true,
    fortunePerson: {
      name: FORTUNE_PARTICIPANT.name,
      fictional: true,
      identity: { ...FORTUNE_PARTICIPANT },
    },
  }
  const signature: PreparedEntity = {
    id,
    kind: 'paper',
    owner: 'neutral',
    x: 50,
    y: 0,
    health: 2,
    present: true,
    material: 'real',
    document: {
      text: `${FORTUNE_PARTICIPANT.name}\n${FORTUNE_PARTICIPANT.dateOfBirth}\n${FORTUNE_PARTICIPANT.bloodType}`,
      fortuneSignature: { ...FORTUNE_PARTICIPANT, sheetId: id, handwritten: true },
      fortuneMonthReady: true,
      fortuneMonthId: FORTUNE_SCENARIO_MONTH.id,
    },
  }
  const portrait: PreparedEntity = {
    id: 'scenario:fortune-portrait',
    kind: 'paper',
    owner: 'neutral',
    x: 50,
    y: 0,
    health: 2,
    present: true,
    material: 'real',
    document: {
      text: `Portrait · ${FORTUNE_PARTICIPANT.name}`,
      fortunePortrait: FORTUNE_PARTICIPANT.subject,
    },
  }
  return {
    ...state,
    fortuneMonths: [{ ...FORTUNE_SCENARIO_MONTH }],
    battlefield: {
      ...state.battlefield!,
      entities: [...state.battlefield!.entities, person, signature, portrait],
    },
  }
}
