import { Vector3 } from 'three'
import type { VictoryContext, VictoryDriver } from './types'
import { createFurykovVictoryProps } from './guardVictoryProps'
import { guardHand } from './personalGuardStaging'
import { personalGuardCamera } from './personalGuardCamera'
import { localToHead } from './pose'
import { ease } from './resources'
import { furykovCounterPlan } from './furykovCounterPlan'
import { furykovCounterPose } from './furykovCounterPose'
import { createFurykovCounterWeapons } from './furykovCounterWeapon'
import { createFurykovCounterEffects } from './furykovCounterEffects'

function preparedConsole(
  context: VictoryContext,
  props: ReturnType<typeof createFurykovVictoryProps>,
) {
  const plan = furykovCounterPlan(context.state[context.frame.loser].id)
  props.write(context.age, [
    'COMBO MASTER',
    `CIBLE : ${plan.targetName.toUpperCase()}`,
    'DECHIFFRAGE : TERMINE',
    'FABRICATION : TERMINEE',
    `WEAPON : ${plan.nameFr.toUpperCase()}`,
    'PRET AVANT LE COMBAT',
  ])
  const position = localToHead(context.hero, new Vector3(-0.08, -0.45, 0.34))
  props.root.position.copy(position)
  props.root.rotation.set(0, 0.15, -0.04)
  props.lid.rotation.x = (ease((context.age - 90) / 36) * Math.PI) / 2
  const handErrors = [
    guardHand(context.hero, 'left', position.clone().add(new Vector3(-0.15, -0.02, 0.02))),
  ]
  if (context.age < 114)
    handErrors.push(
      guardHand(context.hero, 'right', position.clone().add(new Vector3(0.08, 0.04, 0.02))),
    )
  context.add(props.root)
  return { position: position.clone().add(new Vector3(0, 0.14, 0)), handErrors }
}
export function createFurykovVictory(): VictoryDriver {
  const props = createFurykovVictoryProps(),
    weapons = createFurykovCounterWeapons(),
    effects = createFurykovCounterEffects()
  return {
    update(context) {
      const plan = furykovCounterPlan(context.state[context.frame.loser].id)
      const pose = furykovCounterPose(context, plan)
      const weapon = weapons.get(plan.kind)
      weapon.position.copy(pose.weaponPosition)
      weapon.quaternion.copy(pose.orientation)
      context.add(weapon)
      let position = pose.weaponPosition.clone(),
        handErrors = pose.handErrors
      if (context.age < 144) {
        const console = preparedConsole(context, props)
        position = console.position
        handErrors = [...handErrors, ...console.handErrors]
      }
      const counter = effects.sync(context, plan, pose)
      personalGuardCamera(context, position)
      context.scene.userData.furykovVictory = {
        ...plan,
        ...pose,
        ...counter,
        handErrors,
        alert: false,
        signature: plan.target,
        deciphered: true,
        fabricated: true,
        instantDecipher: false,
        instantFabrication: false,
        automaticDodge: false,
        dodge: 0,
      }
      context.defer(() => {
        delete context.scene.userData.furykovVictory
      })
    },
    dispose() {
      props.dispose()
      weapons.dispose()
      effects.dispose()
    },
  }
}
