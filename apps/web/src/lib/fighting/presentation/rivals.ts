import type { FighterId } from '../types'
import exchanges from './rivalExchanges.json'

type Exchange = {
  pair: readonly [FighterId, FighterId]
  reference: string
  lines: readonly [string, string, string, string]
}

/** Original responses anchored to the referenced canon scenes. */
export const RIVALS: readonly Exchange[] = exchanges.map(
  ({ pair: [first, second], reference, lines: [openingFr, openingEn, replyFr, replyEn] }) => ({
    pair: [first as FighterId, second as FighterId],
    reference,
    lines: [openingFr, openingEn, replyFr, replyEn],
  }),
)

export function rivalKey(first: FighterId, second: FighterId): string {
  return first < second ? `${first}--${second}` : `${second}--${first}`
}

const byPair = new Map(RIVALS.map((exchange) => [rivalKey(...exchange.pair), exchange]))

export function rivalExchange(first: FighterId, second: FighterId) {
  return byPair.get(rivalKey(first, second))
}

export function rivalLine(options: {
  actor: FighterId
  other: FighterId
  language: 'fr' | 'en'
}): string | null {
  const exchange = rivalExchange(options.actor, options.other)
  if (!exchange) return null
  const offset = exchange.pair[0] === options.actor ? 0 : 2
  return exchange.lines[offset + (options.language === 'en' ? 1 : 0)]
}
