import { preparedControlBusy } from './preparationActions'
import { predatorAiSlots } from './predatorAi'
import { voconteAiSlots } from './vocontePresentation'
import { controlledEntities } from './preparationActions'
import { COHORT_WILL_FRAMES } from './preparationTuning'
import { martialSlots, varySlots, type ArsenalAiPlan } from './arsenalAiTypes'

export const SECOND_ARSENAL_AI = {
  rihan: ({ state }) => predatorAiSlots(state),
  zakuro: martialSlots, // Blood commands run through maryAiAction, including copied blood.
  melody: () => ['neutralSpecial'],
  basho: ({ state, gap }) =>
    !state.opponent.bashoPoem?.ready && gap > 10 ? ['neutralSpecial'] : [],
  camilla: () => [], // Death triggers Cat's Name; the AI must never cast it.
  halkenburg: ({ state }) =>
    state.opponent.hatsuEffects.cohortWillFrames >= COHORT_WILL_FRAMES ? ['neutralSpecial'] : [],
  gel: ({ roll }) =>
    varySlots(roll, ['neutralSpecial', 'forwardSpecial', 'downSpecial', 'backSpecial']),
  lynch: ({ state, gap }) => (!state.opponent.lynchQuestion && gap <= 18 ? ['neutralSpecial'] : []),
  luini: ({ roll }) => (roll > 0.65 ? ['neutralSpecial'] : []),
  bill: ({ state }) =>
    controlledEntities(state, 'opponent', 'bill').length ? [] : ['neutralSpecial'],
  furykov: ({ state }) => (!state.opponent.comboMaster ? ['neutralSpecial'] : []),
  cluck: ({ state }) =>
    controlledEntities(state, 'opponent', 'cluck').length ? [] : ['neutralSpecial'],
  beyond: () => [], // The ordinary martial plan supplies its moves.
  longhi: () => ['neutralSpecial'],
  musse: ({ state, gap }) =>
    gap <= 6 && !state.opponent.secretWindow
      ? ['neutralSpecial']
      : !state.opponent.secretWindowListening
        ? ['downSpecial']
        : [],
  padaille: ({ roll }) => [
    roll < 0.33 ? 'neutralSpecial' : roll < 0.66 ? 'forwardSpecial' : 'downSpecial',
  ],
  sayird: ({ state }) =>
    preparedControlBusy(state, 'opponent', 'sayird') ? [] : ['neutralSpecial'],
  terebellum: ({ state, gap }) =>
    gap <= 7 && state.player.attack && !state.player.attack.concealed
      ? ['neutralSpecial', 'backSpecial']
      : [],
  voconte: ({ state, gap }) => voconteAiSlots(state, gap),
  yokotani: ({ state }) => (state.lsdf?.opponent ? [] : ['neutralSpecial']),
} satisfies Record<string, ArsenalAiPlan>
