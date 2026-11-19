import { createThrowGelGrip } from './gelGrip'
import { createThrowSixthProps } from './sixthProps'
import type { EffectSceneOptions } from '../fighterEffectScene'
import type { ThrowCinematicFrame } from '../throwCinematic'
import type { FightState } from '../types'

export function createThrowSixthScene(options: EffectSceneOptions) {
  const gel = createThrowGelGrip(options),
    props = createThrowSixthProps(options)
  return {
    hide() {
      gel.hide()
      props.hide()
    },
    sync(state: FightState, frame: ThrowCinematicFrame) {
      gel.sync(state, frame)
      props.sync(state, frame)
    },
    dispose() {
      gel.dispose()
      props.dispose()
    },
  }
}
