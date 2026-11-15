import type { FighterHatsu } from './contract'
import { benjaminHatsu } from './benjamin'
import { bonolenovHatsu } from './bonolenov'
import { chrolloHatsu } from './chrollo'
import { biscuitHatsu } from './biscuit'
import { feitanHatsu } from './feitan'
import { franklinHatsu } from './franklin'
import { hisokaHatsu } from './hisoka'
import { hanzoHatsu } from './hanzo'
import { hinrighHatsu } from './hinrigh'
import { illumiHatsu } from './illumi'
import { kallutoHatsu } from './kalluto'
import { kurapikaHatsu } from './kurapika'
import { marayamHatsu } from './marayam'
import { machiHatsu } from './machi'
import { melodyHatsu } from './melody'
import { mizaistomHatsu } from './mizaistom'
import { morenaHatsu } from './morena'
import { phinksHatsu } from './phinks'
import { leorioHatsu } from './leorio'
import { rihanHatsu } from './rihan'
import { saiyuHatsu } from './saiyu'
import { shizukuHatsu } from './shizuku'
import { thetaHatsu } from './theta'
import { tserriednichHatsu } from './tserriednich'
import { zakuroHatsu } from './zakuro'
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
  phinks: phinksHatsu,
  franklin: franklinHatsu,
  machi: machiHatsu,
  illumi: illumiHatsu,
  kalluto: kallutoHatsu,
  bonolenov: bonolenovHatsu,
  shizuku: shizukuHatsu,
  hinrigh: hinrighHatsu,
  mizaistom: mizaistomHatsu,
  leorio: leorioHatsu,
  hanzo: hanzoHatsu,
  rihan: rihanHatsu,
  zakuro: zakuroHatsu,
  melody: melodyHatsu,
}

export function hatsuFor(id: FighterId): FighterHatsu {
  return HATSU_REGISTRY[id]
}

export function advanceHatsuFrames(state: FightState): FightState {
  return Object.values(HATSU_REGISTRY).reduce((next, hatsu) => hatsu.onFrame(next), state)
}
