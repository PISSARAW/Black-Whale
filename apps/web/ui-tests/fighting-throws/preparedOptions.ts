import type { FighterId, FightSide } from '$lib/fighting/types'
import type { ThrowDemoOptions } from './preparation'

/** The export and its checks request exactly the same native preparations. */
export function preparedThrowOptions(id: FighterId, powered: boolean, side: FightSide = 'player'): ThrowDemoOptions {
  return {
    id, powered, side,
    console: id === 'furykov' && powered,
    bird: id === 'cluck' && powered,
    offer: id === 'longhi' && powered,
    owl: id === 'musse' && powered,
    plant: id === 'bill' && powered,
    cohort: id === 'halkenburg' && powered,
    bleed: id === 'zakuro',
    poem: id === 'basho' && powered,
    prologue: id === 'bonolenov' && powered,
    trueForm: id === 'biscuit' && powered,
  }
}
