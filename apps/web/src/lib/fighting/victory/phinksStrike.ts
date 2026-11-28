import type { FightSide, FightState } from '../types'

export function phinksVictoryStrike(state: FightState, winner: FightSide) {
  const isContact = (hit: NonNullable<typeof state.impact>) =>
    hit.attacker === winner &&
    hit.projectileId === null &&
    hit.damage > 0 &&
    !hit.avoided &&
    !hit.transfer &&
    !hit.objectTransfer
  const strike = [
    state.impact,
    ...(state.audioContacts ?? []).slice(-2).map(({ impact }) => impact),
  ].find((hit) => hit && hit.phinksStrike?.frame === state.frame && isContact(hit))
  if (strike?.phinksStrike)
    return {
      turns: strike.phinksStrike.turns,
      ko: Boolean(strike.phinksStrike.ko),
      ken: strike.phinksStrike.ken,
      ten: Boolean(strike.phinksStrike.ten),
      ren: Boolean(strike.phinksStrike.ren),
    }

  return legacyCyclotronContact(state, winner, isContact)
}

// Older replay snapshots can still identify a Cyclotron through its recorded contact.
function legacyCyclotronContact(
  state: FightState,
  winner: FightSide,
  isContact: (hit: NonNullable<FightState['impact']>) => boolean,
) {
  const legacy = state.cyclotronContacts?.[winner]
  const impact = state.impact
  const decisive =
    impact &&
    legacy?.round === state.roundNumber &&
    legacy.frame === state.frame &&
    legacy.sequence === impact.sequence &&
    isContact(impact)
  return {
    turns: decisive ? legacy.turns : 0,
    ko: Boolean(decisive && impact.critical),
    ken: false,
    ten: false,
    ren: false,
  }
}
