import type { ArcadeFighter, FightSide, FightState } from './types'

export function chrolloManifestations(state: FightState, side: FightSide) {
  const self = state[side]
  const other = side === 'player' ? 'opponent' : 'player'
  const target = state[other]
  const copies = ownedCopies(state, side)
  const puppet = [...copies].reverse().find((e) => e.copy?.order === 'attack')
  const appearance = appearanceKey([self, target], side)
  const stolen = stolenTechniques(target, side)
  return {
    acquired: stolen.join('|'),
    acquiredCount: stolen.length,
    copyCount: copies.length,
    copyId: copies.at(-1)?.id ?? '',
    puppetCount: copies.filter((e) => e.copy?.order).length,
    puppetId: puppet?.id ?? '',
    ...materialManifestations(self),
    appearance,
    control: target.hatsuEffects.manipulatedFrames > 0,
    target: other,
  }
}

function appearanceKey(bodies: ArcadeFighter[], side: FightSide) {
  return bodies
    .filter((body) => body.chrolloHistorical?.appearance?.owner === side)
    .map((body) => body.chrolloHistorical!.appearance!.model)
    .join(':')
}

function ownedCopies(state: FightState, side: FightSide) {
  return state.battlefield?.entities.filter((e) => e.present && e.copy?.owner === side) ?? []
}
function stolenTechniques(target: ArcadeFighter, side: FightSide) {
  return (
    target.skillHunterStolen
      ?.filter((entry) => entry.owner === side)
      .map((entry) => entry.moveId) ?? []
  )
}
function materialManifestations(self: ArcadeFighter) {
  return {
    fish: self.chrolloHistorical?.fish?.roomId ?? '',
    cloth: self.chrolloHistorical?.cloth?.target ?? '',
  }
}
