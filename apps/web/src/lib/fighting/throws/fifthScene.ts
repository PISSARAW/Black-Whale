import { createThrowBloodGrip } from './bloodGrip'
import { createThrowFluteGrip } from './fluteGrip'
import { createThrowFifthProps } from './fifthProps'
import type { EffectSceneOptions } from '../fighterEffectScene'
import type { ThrowCinematicFrame } from '../throwCinematic'
import type { FightState } from '../types'

export function createThrowFifthScene(options: EffectSceneOptions) {
  const blood = createThrowBloodGrip(options),
    flute = createThrowFluteGrip(options),
    props = createThrowFifthProps(options)
  return {
    hide(state?: FightState) {
      blood.hide()
      flute.hide(state)
      props.hide()
    },
    sync(state: FightState, frame: ThrowCinematicFrame) {
      blood.sync(state, frame)
      flute.sync(state, frame)
      props.sync(state, frame)
    },
    dispose() {
      blood.dispose()
      flute.dispose()
      props.dispose()
    },
  }
}
