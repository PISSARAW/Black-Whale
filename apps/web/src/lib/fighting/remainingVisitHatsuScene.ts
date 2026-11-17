import { createCinematicPropsScene } from './cinematicPropsScene'
import { createBlackVoiceScene } from './blackVoiceScene'
import { createMoonlightScene } from './moonlightScene'
import { createFutureBeastScene } from './futureBeastScene'
import { createVisitWeaponScene } from './visitWeaponScene'
import { createHalkenburgArrowScene } from './halkenburgArrowScene'
import { createMelodyFluteScene } from './melodyFluteScene'
import { createBungeeGumScene } from './bungeeGumScene'
import { createHisokaTextureScene } from './hisokaTextureScene'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'

export function createRemainingVisitHatsuScene(options: EffectSceneOptions): FighterEffectScene {
  const scenes = [
    createBlackVoiceScene,
    createMoonlightScene,
    createFutureBeastScene,
    createVisitWeaponScene,
    createHalkenburgArrowScene,
    createMelodyFluteScene,
    createBungeeGumScene,
    createHisokaTextureScene,
    createCinematicPropsScene,
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
