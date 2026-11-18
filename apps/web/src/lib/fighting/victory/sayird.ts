import { Vector3 } from 'three'
import { createSayirdInsect } from './sayirdInsect'
import { lowerGuardForProp, guardHand, guardIncoming } from './personalGuardStaging'
import { localToHead } from './pose'
import { sayirdCombat } from './sayirdCombat'
import { sayirdCamera } from './sayirdCamera'
import { SAYIRD_COMBAT } from './sayirdTrack'
import { ease } from './resources'
import { groundVictoryActor } from './actors'
import type { VictoryContext, VictoryDriver } from './types'

function reconnaissance(context: VictoryContext) {
  const crouch = 1 - ease((context.age - 78) / 42)
  if (crouch > 0)
    lowerGuardForProp(context.hero, context.hero.height * (0.28 + 0.45 * (1 - crouch)))
  const hand = context.hero.root.getObjectByName('hand-left')!
  const target = new Vector3(context.hero.root.position.x + 0.35, context.hero.height * 0.32, 0.3)
  const handError = context.age < 90 ? guardHand(context.hero, 'left', target) : 0
  context.victim.head.rotation.x =
    ease((context.age - 108) / 30) * (1 - ease((context.age - 174) / 24)) * 0.5
  const dodge = Math.sin(ease((context.age - 180) / 48) * Math.PI)
  if (context.age >= 180) {
    guardIncoming(context, localToHead(context.hero, new Vector3(0, -0.25, 0.1)), 186)
    context.hero.root.position.z += dodge * 0.45
    const torso = context.hero.root.getObjectByName('torso')!
    context.save(torso)
    torso.rotation.z = -dodge * 0.18
    context.hero.head.rotation.x = -dodge * 0.1
    groundVictoryActor(context.hero)
  }
  return { palm: hand.getWorldPosition(new Vector3()), handError, dodge }
}

export function createSayirdVictory(): VictoryDriver {
  const insect = createSayirdInsect()
  return {
    update(context) {
      const recon =
        context.age < SAYIRD_COMBAT
          ? reconnaissance(context)
          : { palm: new Vector3(), handError: 0, dodge: 0 }
      const host = insect.update(context, recon.palm)
      const combat = context.age >= SAYIRD_COMBAT ? sayirdCombat(context) : undefined
      sayirdCamera(context, host.position)
      context.scene.userData.sayirdVictory = {
        ...host,
        ...combat,
        handError: recon.handError,
        dodge: recon.dodge,
        littleEyeDamage: 0,
        humanManipulation: false,
        automaticDodge: false,
        pov: context.comfort.camera !== 0 && context.age >= 138 && context.age < 186,
      }
      context.defer(() => {
        delete context.scene.userData.sayirdVictory
      })
    },
    dispose: insect.dispose,
  }
}
