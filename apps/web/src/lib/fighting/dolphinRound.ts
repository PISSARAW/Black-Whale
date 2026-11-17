import type { ArcadeFighter } from './types'

/** A round boundary cannot discard an unused stolen Hatsu or dismiss an equipped Dolphin. */
export function carryDolphinState(fresh: ArcadeFighter, previous: ArcadeFighter): ArcadeFighter {
  const chain = previous.kurapika
  const retained = chain && (chain.held || chain.dolphinLoans?.length)
  return {
    ...fresh,
    dolphinLoan: previous.dolphinLoan,
    stolenChainAbility: previous.stolenChainAbility,
    kurapika: retained ? chain : fresh.kurapika,
  }
}
