import type { FighterHatsu } from './contract'
import { benjaminHatsu } from './benjamin'
import { chrolloHatsu } from './chrollo'
import { biscuitHatsu } from './biscuit'
import { feitanHatsu } from './feitan'
import { hisokaHatsu } from './hisoka'
import { kurapikaHatsu } from './kurapika'
import { marayamHatsu } from './marayam'
import { morenaHatsu } from './morena'
import { saiyuHatsu } from './saiyu'
import { thetaHatsu } from './theta'
import { tserriednichHatsu } from './tserriednich'
import type { FightState, FighterId } from '../types'

const HATSU_REGISTRY: Record<FighterId, FighterHatsu> = {
  kurapika: kurapikaHatsu,
  hisoka: hisokaHatsu,
  chrollo: chrolloHatsu,
  morena: morenaHatsu,
  benjamin: benjaminHatsu,
  tserriednich: tserriednichHatsu,
  feitan: feitanHatsu,
  saiyu: saiyuHatsu,
  theta: thetaHatsu,
  biscuit: biscuitHatsu,
  marayam: marayamHatsu,
}

export function hatsuFor(id: FighterId): FighterHatsu {
  return HATSU_REGISTRY[id]
}

export function advanceHatsuFrames(state: FightState): FightState {
  return Object.values(HATSU_REGISTRY).reduce((next, hatsu) => hatsu.onFrame(next), state)
}
