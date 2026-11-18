import * as THREE from 'three'
import { createChrolloSpectacleBlast } from './blast'
import { createSunMoonMarks } from '../visitHatsuMarks'
import { disposeVictoryObject, ease } from './resources'
import { victoryShot, victoryWide, victoryPortrait } from './camera'
import { victimTorso, fallVictoryVictim } from './pose'
import type { VictoryContext, VictoryDriver } from './types'

/** Three seconds after the confirmed verdict. This never applies damage or stamps new targets. */
export function createChrolloSunMoonVictory(): VictoryDriver {
  const blast = createChrolloSpectacleBlast()
  const marks = createSunMoonMarks(THREE)
  const symbols = new THREE.Group()
  symbols.name = 'chrollo-decisive-seals'
  symbols.add(marks.sun, marks.moon)
  return {
    update(context) {
      const { age, victim, hero } = context
      const centre = victimTorso(context)
      symbols.position.copy(centre)
      symbols.position.z += 0.22
      const gap = 0.13 * (1 - ease(age / 24))
      marks.sun.position.set(-gap, 0, 0)
      marks.moon.position.set(gap, 0, 0.02)
      symbols.visible = age < 24
      context.add(symbols)
      blast.sync(centre, 180 + age - 24)
      context.add(blast.group)
      // The decisive impact is already resolved; the short insert replays its final contact.
      fallVictoryVictim(context, { start: 24, duration: 55 })
      hero.root.rotation.y *= 1 - 0.35 * ease((age - 100) / 70)
      hero.head.rotation.y = -0.08 * ease((age - 100) / 60)
      hero.root.updateWorldMatrix(true, true)
      directCamera(context, centre)
      victim.root.updateWorldMatrix(true, true)
    },
    dispose() {
      disposeVictoryObject(blast.group)
      marks.dispose()
    },
  }
}
function directCamera(context: VictoryContext, centre: THREE.Vector3) {
  if (context.comfort.camera === 0) {
    victoryWide(context)
    return
  }
  if (context.age < 24) {
    victoryShot(context, {
      target: centre,
      offset: new THREE.Vector3(0.2, 0.02, 3),
      width: 1.2,
      height: 1.1,
    })
  } else if (context.age < 125) {
    victoryWide(context, 3)
  } else victoryPortrait(context)
}
