import type * as Three from 'three'
import type { TierPlan } from '../tour/blueprint'
import { buildBanquetDetails } from '../tour/banquetView'
import { buildBurialChamberDetails, burialSurfacePlan } from '../tour/burialChamberView'
import { buildCasinoDetails, casinoSurfacePlan } from '../tour/casinoView'
import { buildScreeningRoomDetails, screeningRoomSurfacePlan } from '../tour/screeningRoomView'
import { buildSupremeCourtDetails, supremeCourtSurfacePlan } from '../tour/supremeCourtView'
import { buildRoyalSalonDetails, royalSalonSurfacePlan } from '../tour/royalSalonView'
import { buildQueenUnmaDetails, queenUnmaSurfacePlan } from '../tour/queenUnmaView'
import { buildBenjaminRoomDetails, benjaminSurfacePlan } from '../tour/benjaminRoomView'
import { buildCamillaRoomDetails, camillaSurfacePlan } from '../tour/camillaView'
import { buildZhangLeiDetails, zhangLeiSurfacePlan } from '../tour/zhangLeiView'
import { buildTserriednichRoomDetails, tserriednichSurfacePlan } from '../tour/tserriednichRoomView'
import { buildTubeppaDetails, tubeppaSurfacePlan } from '../tour/tubeppaView'
import { buildSalesaleDetails, salesaleSurfacePlan } from '../tour/salesaleView'
import { buildHalkenburgDetails, halkenburgSurfacePlan } from '../tour/halkenburgView'
import { buildKachoDetails, kachoSurfacePlan } from '../tour/kachoView'
import { buildFugetsuDetails, fugetsuSurfacePlan } from '../tour/fugetsuView'
import { buildMomozeDetails, momozeSurfacePlan } from '../tour/momozeView'
import { buildMarayamDetails, marayamSurfacePlan } from '../tour/marayamView'
import { buildWobleDetails, wobleSurfacePlan } from '../tour/wobleView'
import { princeApartmentSurfacePlan } from '../tour/princeApartmentEnvelope'
import { buildDiningHallDetails } from '../tour/diningHallView'
import { diningHallSurfacePlan } from '../tour/diningHallSurfacePlan'
import { buildCineplexDetails, cineplexSurfacePlan } from '../tour/cineplexView'
import { buildChaROfficeDetails, chaRSurfacePlan } from '../tour/chaROfficeView'
import { buildPoliceStationDetails, policeSurfacePlan } from '../tour/policeStationView'
import { buildWarehouseDetails, warehouseSurfacePlan } from '../tour/warehouseView'
import { buildHangarEntranceDetails, hangarEntranceSurfacePlan } from '../tour/hangarEntranceView'
import { buildHullSuspensionDetails, hullSuspensionSurfacePlan } from '../tour/hullSuspensionView'
import { buildHeillyHideoutDetails, heillySurfacePlan } from '../tour/heillyHideoutView'

export interface StageRoomModelOptions {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  reveal: boolean
}

/** Same priority as TierView: one room model, without a second generic apartment on top. */
export const STAGE_ROOM_BUILDERS: readonly ((
  options: StageRoomModelOptions,
) => Three.Group | null)[] = [
  buildBanquetDetails,
  buildBurialChamberDetails,
  buildCasinoDetails,
  buildScreeningRoomDetails,
  buildSupremeCourtDetails,
  buildRoyalSalonDetails,
  buildQueenUnmaDetails,
  buildBenjaminRoomDetails,
  buildCamillaRoomDetails,
  buildZhangLeiDetails,
  buildTserriednichRoomDetails,
  buildTubeppaDetails,
  buildSalesaleDetails,
  buildHalkenburgDetails,
  buildKachoDetails,
  buildFugetsuDetails,
  buildMomozeDetails,
  buildMarayamDetails,
  buildWobleDetails,
  buildDiningHallDetails,
  buildCineplexDetails,
  buildChaROfficeDetails,
  buildPoliceStationDetails,
  buildWarehouseDetails,
  buildHangarEntranceDetails,
  buildHullSuspensionDetails,
  buildHeillyHideoutDetails,
]

/** Drawing only: lane selection always reads the original solids and columns. */
export const STAGE_SURFACE_PLANS: readonly ((plan: TierPlan, reveal: boolean) => TierPlan)[] = [
  princeApartmentSurfacePlan,
  burialSurfacePlan,
  casinoSurfacePlan,
  screeningRoomSurfacePlan,
  supremeCourtSurfacePlan,
  royalSalonSurfacePlan,
  queenUnmaSurfacePlan,
  benjaminSurfacePlan,
  camillaSurfacePlan,
  zhangLeiSurfacePlan,
  tserriednichSurfacePlan,
  tubeppaSurfacePlan,
  salesaleSurfacePlan,
  halkenburgSurfacePlan,
  kachoSurfacePlan,
  fugetsuSurfacePlan,
  momozeSurfacePlan,
  marayamSurfacePlan,
  wobleSurfacePlan,
  diningHallSurfacePlan,
  cineplexSurfacePlan,
  chaRSurfacePlan,
  policeSurfacePlan,
  warehouseSurfacePlan,
  hangarEntranceSurfacePlan,
  hullSuspensionSurfacePlan,
  heillySurfacePlan,
]
