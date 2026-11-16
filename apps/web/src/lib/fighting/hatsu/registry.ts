import { fightResolutionPending } from '../fightOutcome'
import { furykovHatsu } from './furykov'
import { withDolphinIdentity } from '../kurapikaDolphin'
import { yokotaniHatsu } from './yokotani'
import { terebellumHatsu } from './terebellum'
import { martialOnlyHatsu, type FighterHatsu } from './contract'
import { benjaminHatsu } from './benjamin'
import { bashoHatsu } from './basho'
import { billHatsu } from './bill'
import { bonolenovHatsu } from './bonolenov'
import { chrolloHatsu } from './chrollo'
import {
  gidalHatsu,
  longhiHatsu,
  padailleHatsu,
  tubeppaHatsu,
  tysonHatsu,
  voconteHatsu,
} from './combatCompletion'
import { camillaHatsu } from './camilla'
import { cluckHatsu } from './cluck'
import { biscuitHatsu } from './biscuit'
import { feitanHatsu } from './feitan'
import { franklinHatsu } from './franklin'
import { fugetsuHatsu } from './fugetsu'
import { gelHatsu } from './gel'
import { halkenburgHatsu } from './halkenburg'
import { hisokaHatsu } from './hisoka'
import { hanzoHatsu } from './hanzo'
import { hinrighHatsu } from './hinrigh'
import { illumiHatsu } from './illumi'
import { kallutoHatsu } from './kalluto'
import { kachoHatsu } from './kacho'
import { kurapikaHatsu } from './kurapika'
import { marayamHatsu } from './marayam'
import { machiHatsu } from './machi'
import { melodyHatsu } from './melody'
import { mizaistomHatsu } from './mizaistom'
import { morenaHatsu } from './morena'
import { phinksHatsu } from './phinks'
import { leorioHatsu } from './leorio'
import { luiniHatsu } from './luini'
import { luzurusHatsu } from './luzurus'
import { lynchHatsu } from './lynch'
import { momozeHatsu } from './momoze'
import { rihanHatsu } from './rihan'
import { saiyuHatsu } from './saiyu'
import { sayirdHatsu } from './sayird'
import { salesaleHatsu } from './salesale'
import { shizukuHatsu } from './shizuku'
import { thetaHatsu } from './theta'
import { tserriednichHatsu } from './tserriednich'
import { zakuroHatsu } from './zakuro'
import { zhangleiHatsu } from './zhanglei'
import type { FightState, FighterId } from '../types'

// Resolve hooks lazily to preserve bindings across shared combat imports.
const HATSU_REGISTRY: Record<FighterId, () => FighterHatsu> = {
  kurapika: () => kurapikaHatsu,
  hisoka: () => hisokaHatsu,
  chrollo: () => chrolloHatsu,
  morena: () => morenaHatsu,
  benjamin: () => benjaminHatsu,
  tserriednich: () => tserriednichHatsu,
  feitan: () => feitanHatsu,
  saiyu: () => saiyuHatsu,
  theta: () => thetaHatsu,
  biscuit: () => biscuitHatsu,
  marayam: () => marayamHatsu,
  phinks: () => phinksHatsu,
  franklin: () => franklinHatsu,
  machi: () => machiHatsu,
  illumi: () => illumiHatsu,
  kalluto: () => kallutoHatsu,
  bonolenov: () => bonolenovHatsu,
  shizuku: () => shizukuHatsu,
  hinrigh: () => hinrighHatsu,
  mizaistom: () => mizaistomHatsu,
  leorio: () => leorioHatsu,
  hanzo: () => hanzoHatsu,
  rihan: () => rihanHatsu,
  zakuro: () => zakuroHatsu,
  melody: () => melodyHatsu,
  basho: () => bashoHatsu,
  camilla: () => camillaHatsu,
  halkenburg: () => halkenburgHatsu,
  gel: () => gelHatsu,
  lynch: () => lynchHatsu,
  luini: () => luiniHatsu,
  bill: () => billHatsu,
  furykov: () => furykovHatsu,
  cluck: () => cluckHatsu,
  beyond: () => martialOnlyHatsu('beyond'),
  fugetsu: () => fugetsuHatsu,
  kacho: () => kachoHatsu,
  luzurus: () => luzurusHatsu,
  momoze: () => momozeHatsu,
  salesale: () => salesaleHatsu,
  zhanglei: () => zhangleiHatsu,
  gidal: () => gidalHatsu,
  longhi: () => longhiHatsu,
  musse: () => martialOnlyHatsu('musse'),
  padaille: () => padailleHatsu,
  tubeppa: () => tubeppaHatsu,
  tyson: () => tysonHatsu,
  sayird: () => sayirdHatsu,
  terebellum: () => terebellumHatsu,
  voconte: () => voconteHatsu,
  yokotani: () => yokotaniHatsu,
}

export function hatsuFor(id: FighterId): FighterHatsu {
  return HATSU_REGISTRY[id]()
}

export function advanceHatsuFrames(state: FightState): FightState {
  return Object.values(HATSU_REGISTRY).reduce((next, resolve) => {
    if (fightResolutionPending(next)) return next
    const hatsu = resolve()
    return withDolphinIdentity(next, hatsu.onFrame, hatsu.id)
  }, state)
}
