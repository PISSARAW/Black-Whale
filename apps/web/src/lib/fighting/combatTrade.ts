import type { ArcadeFighter, FightSide, FightState } from './types'

interface TradeFighterOptions {
  original: ArcadeFighter
  incoming: ArcadeFighter
  outgoing: ArcadeFighter
}

export function tradeFighter(options: TradeFighterOptions): ArcadeFighter {
  const { original, incoming, outgoing } = options
  // Sweet Home can wound the attacker during their outgoing strike as well.
  const body =
    outgoing.health < original.health && incoming.health === original.health ? outgoing : incoming
  return {
    ...body,
    health: Math.max(0, incoming.health + outgoing.health - original.health),
    hitStun: Math.max(incoming.hitStun, outgoing.hitStun),
    knockdownFrames: Math.max(incoming.knockdownFrames, outgoing.knockdownFrames),
    comboDamage: incoming.comboDamage + outgoing.comboDamage - original.comboDamage,
    hatsuEffects: tradeHatsuEffects(options),
    ...tradeChainState(options),
    nen: original.hanzoProjection && !incoming.hanzoProjection ? incoming.nen : outgoing.nen,
    attack: null,
    aura: Math.max(0, Math.min(100, incoming.aura + outgoing.aura - original.aura)),
  }
}

function tradeHatsuEffects({ original, incoming, outgoing }: TradeFighterOptions) {
  const effects = { ...incoming.hatsuEffects }
  for (const key of Object.keys(effects) as Array<keyof typeof effects>) {
    if (outgoing.hatsuEffects[key] !== original.hatsuEffects[key]) {
      Object.assign(effects, { [key]: outgoing.hatsuEffects[key] })
    }
  }
  return effects
}

export function tradeTotals(options: {
  original: Record<FightSide, number>
  first: Record<FightSide, number>
  second: Record<FightSide, number>
}): Record<FightSide, number> {
  const { original, first, second } = options
  return {
    player: first.player + second.player - original.player,
    opponent: first.opponent + second.opponent - original.opponent,
  }
}

export function tradeAttachment(original: FightState, first: FightState, second: FightState) {
  const playerChanged = first.bungeeGum !== original.bungeeGum
  const opponentChanged = second.bungeeGum !== original.bungeeGum
  if (playerChanged && opponentChanged) return null
  return playerChanged ? first.bungeeGum : second.bungeeGum
}

function tradeChainState({ original, incoming, outgoing }: TradeFighterOptions) {
  return {
    kurapika: outgoing.kurapika !== original.kurapika ? outgoing.kurapika : incoming.kurapika,
    chainJail: incoming.chainJail ?? outgoing.chainJail,
    judgmentChain: incoming.judgmentChain ?? outgoing.judgmentChain,
    drainingChain: incoming.drainingChain ?? outgoing.drainingChain,
    stolenChainAbility: incoming.stolenChainAbility ?? outgoing.stolenChainAbility,
  }
}
