import { createCinematicPropsScene } from './cinematicPropsScene'
import { createBlackVoiceScene } from './blackVoiceScene'
import { createMoonlightScene } from './moonlightScene'
import { createFutureBeastScene } from './futureBeastScene'
import { createVisitWeaponScene } from './visitWeaponScene'
import { createHalkenburgArrowScene } from './halkenburgArrowScene'
import { createMelodyFluteScene } from './melodyFluteScene'
import { createBungeeGumScene } from './bungeeGumScene'
import { createHisokaTextureScene } from './hisokaTextureScene'
import { createFranklinAccentScene } from './franklinAccentScene'
import { createBodyHatsuScene } from './bodyHatsuScene'
import { createBlinkySuctionScene } from './blinkySuctionScene'
import { createPassageAccentScene } from './passageAccentScene'
import { createPerceptionAccentScene } from './perceptionAccentScene'
import { createSupportHatsuScene } from './supportHatsuScene'
import { createPerformanceHatsuScene } from './performanceHatsuScene'
import { createSweetHomeAccentScene } from './sweetHomeAccentScene'
import { createPhinksAccentScene } from './phinksAccentScene'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'

export function createRemainingVisitHatsuScene(options: EffectSceneOptions): FighterEffectScene {
  const scenes = [
    createBlackVoiceScene,
    createMoonlightScene,
    createFutureBeastScene,
    createVisitWeaponScene,
    createBodyHatsuScene,
    createBlinkySuctionScene,
    createPassageAccentScene,
    createHalkenburgArrowScene,
    createMelodyFluteScene,
    createBungeeGumScene,
    createHisokaTextureScene,
    createFranklinAccentScene,
    createCinematicPropsScene,
    createPerceptionAccentScene,
    createSupportHatsuScene,
    createPerformanceHatsuScene,
    createSweetHomeAccentScene,
    createPhinksAccentScene,
  ].map((create) => create(options))
  return {
    sync(state, seconds) {
      scenes.forEach((scene) => scene.sync(state, seconds))
    },
    dispose() {
      scenes.forEach((scene) => scene.dispose())
    },
  }
}
