import * as troupe from './cinematicTroupeRules'
import * as royal from './cinematicRoyalRules'
import * as control from './cinematicControlRules'
import * as support from './cinematicSupportRules'
import * as objects from './cinematicObjectRules'
import * as movement from './cinematicMovementRules'
import { KURAPIKA_CAMERA_RULES } from './cinematicKurapikaRules'
import { NEN_CAMERA_RULES } from './cinematicNenRules'
import type { CameraRule } from './cinematicRules'
import type { FighterId } from './types'

/** All forty selectable fighters, including those whose special actions are physical. */
export const CINEMATIC_CATALOGUE = {
  kurapika: KURAPIKA_CAMERA_RULES,
  hisoka: troupe.HISOKA_CAMERA_RULES,
  chrollo: troupe.CHROLLO_CAMERA_RULES,
  benjamin: royal.BENJAMIN_CAMERA_RULES,
  tserriednich: royal.TSERRIEDNICH_CAMERA_RULES,
  feitan: troupe.FEITAN_CAMERA_RULES,
  saiyu: control.SAIYU_CAMERA_RULES,
  theta: movement.THETA_CAMERA_RULES,
  biscuit: troupe.BISCUIT_CAMERA_RULES,
  phinks: troupe.PHINKS_CAMERA_RULES,
  franklin: troupe.FRANKLIN_CAMERA_RULES,
  machi: control.MACHI_CAMERA_RULES,
  illumi: control.ILLUMI_CAMERA_RULES,
  kalluto: control.KALLUTO_CAMERA_RULES,
  bonolenov: objects.BONOLENOV_CAMERA_RULES,
  shizuku: objects.SHIZUKU_CAMERA_RULES,
  hinrigh: objects.HINRIGH_CAMERA_RULES,
  mizaistom: control.MIZAISTOM_CAMERA_RULES,
  leorio: movement.LEORIO_CAMERA_RULES,
  hanzo: support.HANZO_CAMERA_RULES,
  rihan: support.RIHAN_CAMERA_RULES,
  zakuro: objects.ZAKURO_CAMERA_RULES,
  melody: support.MELODY_CAMERA_RULES,
  basho: support.BASHO_CAMERA_RULES,
  camilla: royal.CAMILLA_CAMERA_RULES,
  halkenburg: royal.HALKENBURG_CAMERA_RULES,
  gel: control.GEL_CAMERA_RULES,
  lynch: movement.LYNCH_CAMERA_RULES,
  luini: movement.LUINI_CAMERA_RULES,
  bill: support.BILL_CAMERA_RULES,
  furykov: movement.FURYKOV_CAMERA_RULES,
  cluck: support.CLUCK_CAMERA_RULES,
  beyond: movement.BEYOND_CAMERA_RULES,
  longhi: royal.LONGHI_CAMERA_RULES,
  musse: royal.MUSSE_CAMERA_RULES,
  padaille: objects.PADAILLE_CAMERA_RULES,
  sayird: support.SAYIRD_CAMERA_RULES,
  terebellum: objects.TEREBELLUM_CAMERA_RULES,
  voconte: movement.VOCONTE_CAMERA_RULES,
  yokotani: movement.YOKOTANI_CAMERA_RULES,
} satisfies Partial<Record<FighterId, readonly CameraRule[]>>
export const ALL_CINEMATIC_RULES: readonly CameraRule[] = [
  ...Object.values(CINEMATIC_CATALOGUE).flat(),
  ...NEN_CAMERA_RULES,
]
