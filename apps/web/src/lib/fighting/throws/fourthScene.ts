import { createThrowFourthProps } from './fourthProps'
import { createThrowRemoteGrip } from './remoteGrip'
import { poseThrowBlinky } from './blinkyGrip'
import { alignThrowScissors } from './scissors'
import type { EffectSceneOptions } from '../fighterEffectScene'
import type { ThrowCinematicFrame } from '../throwCinematic'
import type { FightState } from '../types'

export function createThrowFourthScene(options: EffectSceneOptions) {
  const props = createThrowFourthProps(options),
    remote = createThrowRemoteGrip(options)
  return {
    hide() {
      props.hide()
      remote.hide()
    },
    sync(state: FightState, frame: ThrowCinematicFrame) {
      props.sync(state, frame)
      remote.sync(state, frame)
      poseThrowBlinky(options, state, frame)
      if (frame.performance === 'hanzo-moonfall') alignThrowScissors(options, frame)
    },
    dispose() {
      props.dispose()
      remote.dispose()
    },
  }
}
