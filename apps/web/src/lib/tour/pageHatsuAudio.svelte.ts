import { setAmbientMuffled } from '$lib/audio/ambient'
import {
  startEngine,
  startFly,
  startRequiem,
  startVacuum,
  stopEngine,
  stopEveryHatsuLoop,
  stopFly,
  stopRequiem,
  stopVacuum,
} from '$lib/audio/hatsuSounds'
import type { TourWorld } from '$lib/tour/hatsu'

type WorldReader = () => TourWorld

export class TourHatsuAudio {
  watch(readWorld: WorldReader) {
    $effect(() => setAmbientMuffled(readWorld().sealed >= 2))
    $effect(() => {
      if (readWorld().holding === 'vacuum') startVacuum()
      else stopVacuum()
    })
    $effect(() => {
      if (readWorld().body.riding) startEngine()
      else stopEngine()
    })
    $effect(() => {
      if (readWorld().eye) startFly()
      else stopFly()
    })
    $effect(() => {
      if (readWorld().devouring.length) startRequiem()
      else stopRequiem()
    })
  }

  dispose() {
    setAmbientMuffled(false)
    stopEveryHatsuLoop()
  }
}
