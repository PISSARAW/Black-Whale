import { doorCanPrepare } from './voconteDoorAction'
import { doorNetworkBusy } from './voconteDoorState'
import type { FightState, MoveSlot } from './types'

export function voconteAiSlots(state: FightState, gap: number): readonly MoveSlot[] {
  if (gap > 15 && !doorNetworkBusy(state, 'opponent') && doorCanPrepare(state.opponent))
    return ['neutralSpecial']
  return ['standingLight', 'forwardLight', 'standingHeavy']
}

export function voconteSpecialPresentation(state: FightState, language: 'fr' | 'en') {
  const active = state.voconteDoors?.networks.player?.active
  return {
    ready: doorCanPrepare(state.player),
    label:
      language === 'fr'
        ? active
          ? 'Door · Refermer'
          : 'Door · Relier'
        : active
          ? 'Door · Close'
          : 'Door · Connect',
    hint:
      language === 'fr'
        ? 'L : relier / refermer · 20 aura · franchir A vers la droite ou B vers la gauche. Les deux combattants peuvent passer.'
        : 'L: connect / close · 20 aura · cross A rightwards or B leftwards. Either fighter can pass.',
  }
}
