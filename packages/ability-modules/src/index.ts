import type { NenAbilityModule } from '@black-whale/nen-engine'

import { battleCantabileMetamorphosen } from './battle-cantabile-metamorphosen/module.js'
import { benjaminBaton } from './benjamin-baton/module.js'
import { beyondSacrificialCurse } from './beyond-sacrificial-curse/module.js'
import { bungeeGum } from './bungee-gum/module.js'
import { catsName } from './cats-name/module.js'
import { chainJail } from './chain-jail/module.js'
import { contagion } from './contagion/module.js'
import { convertHands } from './convert-hands/module.js'
import { crossGame } from './cross-game/module.js'
import { dowsingChain } from './dowsing-chain/module.js'
import { emperorTime } from './emperor-time/module.js'
import { grimmelTheDissonance } from './grimmel-the-dissonance/module.js'
import { hanzoSkill4 } from './hanzo-skill-4/module.js'
import { holyChain } from './holy-chain/module.js'
import { illumiNeedlePeople } from './illumi-needle-people/module.js'
import { judgmentChain } from './judgment-chain/module.js'
import { danceOfTheSerpentsBite, surveillancePaperDolls } from './kalluto/module.js'
import { littleEye } from './little-eye/module.js'
import { loveDial6700 } from './love-dial-6700/module.js'
import { lsdf } from './lsdf/module.js'
import { luiniSpatialTeleportation } from './luini-spatial-teleportation/module.js'
import { magicalWorm } from './magical-worm/module.js'
import { marayamGuardianIsolation } from './marayam-guardian-isolation/module.js'
import { melodyEnchantingMusic } from './melody-enchanting-music/module.js'
import { momozeGuardianSolicitation } from './momoze-guardian-solicitation/module.js'
import { moonlightAct } from './moonlight-act/module.js'
import { nenStitches } from './nen-stitches/module.js'
import { parallelFuture } from './parallel-future/module.js'
import { rihanPredator } from './rihan-predator/module.js'
import { salesaleGuardianSmoke } from './salesale-guardian-smoke/module.js'
import { secretWindow } from './secret-window/module.js'
import { silentMajority } from './silent-majority/module.js'
import { doubleFace, skillHunter } from './skill-hunter/module.js'
import { stealChain } from './steal-chain/module.js'
import { stealthDolphin } from './stealth-dolphin/module.js'
import { sunAndMoon } from './sun-and-moon/module.js'
import { textureSurprise } from './texture-surprise/module.js'
import { tserriednichGuardianLieMarks } from './tserriednich-guardian-lie-marks/module.js'
import { withoutYou } from './without-you/module.js'
import { yomotsuHegui } from './yomotsu-hegui/module.js'
import { zhangleiGuardianCoins } from './zhanglei-guardian-coins/module.js'
import {
  blackVoice,
  chrolloTeleportation,
  funFunCloth,
  galleryFake,
  indoorFish,
  lovelyGhostwriter,
  orderStamp,
} from './chrollo-stolen/module.js'
import {
  battleCantabileJupiter,
  battleCantabilePrologue,
  blinky,
  doubleMachineGun,
  ripperCyclotron,
} from './troupe/module.js'
import {
  camillaGuardianCoercion,
  luzurusGuardianDesireTrap,
  tubeppaGuardianSynthesis,
  tysonGuardianEyeWogs,
} from './royal-guardians/module.js'
import {
  bloodyMary,
  padailleWeaponTransformation,
  snakeArm,
  voconteHideoutDoors,
} from './heil-ly/module.js'
import { airBlow, benjaminAura, culdcept } from './benjamin-inherited/module.js'
import {
  birdManipulation,
  greatHaiku,
  leorioRemotePunch,
  saiyuPriestStaff,
  saiyuThreeMonkeys,
} from './zodiacs/module.js'
import { biscuitBodyTransformation, magicalEstheticianCookie } from './biscuit/module.js'
import {
  kurtonVehicleTransformation,
  thetaAuraProjectile,
  transportPortals,
} from './expedition/module.js'
import { biohazardHinrigh, bodyAndSoul, damageSweetHome } from './mafia/module.js'
import { painPacker, risingSun } from './feitan/module.js'
import { erigeron, oitoHatsu } from './woble/module.js'

export { bungeeGum } from './bungee-gum/module.js'
export { chainJail } from './chain-jail/module.js'
export { judgmentChain } from './judgment-chain/module.js'
export { dowsingChain } from './dowsing-chain/module.js'
export { holyChain } from './holy-chain/module.js'
export { stealChain } from './steal-chain/module.js'
export { stealthDolphin } from './stealth-dolphin/module.js'
export { emperorTime } from './emperor-time/module.js'
export { grimmelTheDissonance, grimmelCohortEffectId } from './grimmel-the-dissonance/module.js'
export { hanzoSkill4 } from './hanzo-skill-4/module.js'
export { withoutYou } from './without-you/module.js'
export { contagion, CONTAGION_LIMITS } from './contagion/module.js'
export { magicalWorm } from './magical-worm/module.js'
export { luiniSpatialTeleportation } from './luini-spatial-teleportation/module.js'
export { marayamGuardianIsolation } from './marayam-guardian-isolation/module.js'
export { textureSurprise } from './texture-surprise/module.js'
export { battleCantabileMetamorphosen } from './battle-cantabile-metamorphosen/module.js'
export { skillHunter, doubleFace, SKILL_HUNTER_STEPS } from './skill-hunter/module.js'
export {
  beyondSacrificialCurse,
  BEYOND_CURSE_REVEAL_CHAPTER,
} from './beyond-sacrificial-curse/module.js'
export { catsName } from './cats-name/module.js'
export { littleEye } from './little-eye/module.js'
export { parallelFuture, PARALLEL_FUTURE_WINDOW_SECONDS } from './parallel-future/module.js'
export { nenStitches } from './nen-stitches/module.js'
export { surveillancePaperDolls, danceOfTheSerpentsBite } from './kalluto/module.js'
export { secretWindow, SECRET_WINDOW_OWL_IDS } from './secret-window/module.js'
export { melodyEnchantingMusic } from './melody-enchanting-music/module.js'
export { loveDial6700 } from './love-dial-6700/module.js'
export { convertHands } from './convert-hands/module.js'
export { illumiNeedlePeople } from './illumi-needle-people/module.js'
export { momozeGuardianSolicitation } from './momoze-guardian-solicitation/module.js'
export { salesaleGuardianSmoke } from './salesale-guardian-smoke/module.js'
export { moonlightAct } from './moonlight-act/module.js'
export { silentMajority, SILENT_MAJORITY_LIMITS } from './silent-majority/module.js'
export { benjaminBaton, BENJAMIN_ARMY_COHORT_ID } from './benjamin-baton/module.js'
export { rihanPredator } from './rihan-predator/module.js'
export { yomotsuHegui } from './yomotsu-hegui/module.js'
export { sunAndMoon } from './sun-and-moon/module.js'
export {
  tserriednichGuardianLieMarks,
  TSERRIEDNICH_FATAL_LIE_COUNT,
} from './tserriednich-guardian-lie-marks/module.js'
export { crossGame } from './cross-game/module.js'
export { lsdf } from './lsdf/module.js'
export { zhangleiGuardianCoins } from './zhanglei-guardian-coins/module.js'

export {
  blackVoice,
  chrolloTeleportation,
  funFunCloth,
  galleryFake,
  indoorFish,
  lovelyGhostwriter,
  orderStamp,
} from './chrollo-stolen/module.js'
export {
  battleCantabileJupiter,
  battleCantabilePrologue,
  blinky,
  doubleMachineGun,
  ripperCyclotron,
} from './troupe/module.js'
export {
  camillaGuardianCoercion,
  luzurusGuardianDesireTrap,
  tubeppaGuardianSynthesis,
  tysonGuardianEyeWogs,
} from './royal-guardians/module.js'
export {
  bloodyMary,
  padailleWeaponTransformation,
  snakeArm,
  voconteHideoutDoors,
} from './heil-ly/module.js'
export { airBlow, benjaminAura, culdcept } from './benjamin-inherited/module.js'
export {
  SAIYU_MONKEYS,
  birdManipulation,
  greatHaiku,
  leorioRemotePunch,
  saiyuPriestStaff,
  saiyuThreeMonkeys,
} from './zodiacs/module.js'
export { biscuitBodyTransformation, magicalEstheticianCookie } from './biscuit/module.js'
export {
  kurtonVehicleTransformation,
  thetaAuraProjectile,
  transportPortals,
} from './expedition/module.js'
export { biohazardHinrigh, bodyAndSoul, damageSweetHome } from './mafia/module.js'
export { painPacker, risingSun } from './feitan/module.js'
export { erigeron, oitoHatsu } from './woble/module.js'

/**
 * Every implemented module. Registering this array rather than a hand-kept list
 * on the app side is what keeps the runtime and the `moduleKey` column of
 * `data/abilities/abilities.json` from drifting apart.
 */
export const abilityModules: NenAbilityModule[] = [
  bungeeGum,
  textureSurprise,
  chainJail,
  judgmentChain,
  dowsingChain,
  holyChain,
  stealChain,
  stealthDolphin,
  emperorTime,
  grimmelTheDissonance,
  hanzoSkill4,
  withoutYou,
  contagion,
  magicalWorm,
  luiniSpatialTeleportation,
  marayamGuardianIsolation,
  battleCantabileMetamorphosen,
  skillHunter,
  doubleFace,
  beyondSacrificialCurse,
  catsName,
  littleEye,
  parallelFuture,
  nenStitches,
  surveillancePaperDolls,
  danceOfTheSerpentsBite,
  secretWindow,
  melodyEnchantingMusic,
  loveDial6700,
  convertHands,
  illumiNeedlePeople,
  momozeGuardianSolicitation,
  salesaleGuardianSmoke,
  moonlightAct,
  silentMajority,
  benjaminBaton,
  rihanPredator,
  yomotsuHegui,
  sunAndMoon,
  tserriednichGuardianLieMarks,
  crossGame,
  lsdf,
  zhangleiGuardianCoins,
  indoorFish,
  funFunCloth,
  chrolloTeleportation,
  orderStamp,
  galleryFake,
  blackVoice,
  lovelyGhostwriter,
  battleCantabilePrologue,
  battleCantabileJupiter,
  blinky,
  doubleMachineGun,
  ripperCyclotron,
  camillaGuardianCoercion,
  tubeppaGuardianSynthesis,
  tysonGuardianEyeWogs,
  luzurusGuardianDesireTrap,
  voconteHideoutDoors,
  bloodyMary,
  padailleWeaponTransformation,
  snakeArm,
  airBlow,
  culdcept,
  benjaminAura,
  saiyuPriestStaff,
  saiyuThreeMonkeys,
  greatHaiku,
  birdManipulation,
  leorioRemotePunch,
  magicalEstheticianCookie,
  biscuitBodyTransformation,
  kurtonVehicleTransformation,
  transportPortals,
  thetaAuraProjectile,
  biohazardHinrigh,
  bodyAndSoul,
  damageSweetHome,
  painPacker,
  risingSun,
  erigeron,
  oitoHatsu,
]
