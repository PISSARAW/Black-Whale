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
    // Sight and hearing sealed muffles the ship — unless a flute is up. Melody
    // does not lift the seal, she plays over it, so the muffle follows the
    // playing: it lifts while the piece runs and drops back the moment the
    // flute comes down. See `melody` in `hatsu.ts`.
    $effect(() => {
      const world = readWorld()
      setAmbientMuffled(world.sealed >= 2 && !world.body.soothed)
    })
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
