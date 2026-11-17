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
    secretWindow: continuingDolphinWindow(previous),
  }
}

function continuingDolphinWindow(previous: ArcadeFighter): ArcadeFighter['secretWindow'] {
  const held = previous.dolphinLoan?.held ?? previous.kurapika?.held
  return held?.used && !held.returned && held.source === 'musse' ? previous.secretWindow : undefined
}
