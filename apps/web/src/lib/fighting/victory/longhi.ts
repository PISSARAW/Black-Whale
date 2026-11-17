import { fighterDefinition } from '../roster'
import { Group, Mesh, MeshBasicMaterial, SphereGeometry, Vector3 } from 'three'
import type { VictoryContext, VictoryDriver } from './types'
import { createLonghiVictoryProps } from './guardVictoryProps'
import { guardHand, guardIncoming, lowerGuardForProp, fitGuardProp } from './personalGuardStaging'
import { personalGuardCombat, GUARD_COMBAT_START } from './personalGuardCombat'
import { personalGuardCamera } from './personalGuardCamera'
import { disposeVictoryObject, ease } from './resources'
import { localToHead } from './pose'

function signingPose(context: VictoryContext, props: ReturnType<typeof createLonghiVictoryProps>) {
  const y = Math.min(context.hero.height, context.victim.height) * 0.65
  const centre = new Vector3(context.centre, y, 0.2)
  lowerGuardForProp(context.hero, y)
  lowerGuardForProp(context.victim, y)
  fitGuardProp(centre, [
    { actor: context.hero, side: 'left', offset: new Vector3(-0.28, -0.12, 0.02) },
    { actor: context.hero, side: 'right', offset: new Vector3(-0.13, -0.12, 0.04) },
    { actor: context.victim, side: 'right', offset: new Vector3(0.13, -0.12, 0.04) },
  ])
  props.root.position.copy(centre)
  props.root.rotation.set(-0.08, 0, 0)
  const writing = centre
    .clone()
    .add(
      new Vector3(
        context.age < 108 ? -0.13 : 0.13,
        -0.12 + Math.sin(context.age * 0.65) * 0.008,
        0.04,
      ),
    )
  const writer = context.age < 108 ? context.hero : context.victim
  const handErrors = [
    guardHand(context.hero, 'left', centre.clone().add(new Vector3(-0.28, -0.12, 0.02))),
    guardHand(writer, 'right', writing),
  ]
  props.pen.position.copy(
    writer.root.getObjectByName('hand-right')!.getWorldPosition(new Vector3()),
  )
  context.add(props.root)
  context.add(props.pen)
  return { centre, handErrors }
}
function brokenPactPose(context: VictoryContext) {
  const target = localToHead(context.hero, new Vector3(0, -0.3, 0.2))
  const punch = guardIncoming(context, target, 192)
  context.hero.root.position.z +=
    ease((context.age - 192) / 18) * (1 - ease((context.age - 216) / 12)) * 0.3
  context.victim.head.rotation.x = -ease((context.age - 204) / 24) * 0.14
  return punch
}
export function createLonghiVictory(): VictoryDriver {
  const props = createLonghiVictoryProps(),
    aura = new Group()
  const material = new MeshBasicMaterial({
    color: 0x8ca8d2,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  })
  const shell = new Mesh(new SphereGeometry(1, 24, 20), material)
  aura.add(shell)
  aura.name = 'longhi-breach-forced-zetsu'
  return {
    update(context) {
      const { age } = context
      props.write(age, fighterDefinition(context.state[context.frame.loser].id).name)
      let centre = new Vector3(context.centre, context.hero.height * 0.65, 0.4),
        handErrors: number[] = []
      if (age < 150) ({ centre, handErrors } = signingPose(context, props))
      if (age >= 150 && age < GUARD_COMBAT_START) brokenPactPose(context)
      const combat = age >= GUARD_COMBAT_START ? personalGuardCombat(context, 'longhi') : undefined
      const zetsu = ease((age - 192) / 30)
      aura.visible = age >= 156 && age < GUARD_COMBAT_START
      aura.position.copy(context.victim.root.position)
      shell.position.y = context.victim.height * 0.5
      shell.scale.set(
        context.victim.width,
        context.victim.height * 0.62,
        context.victim.width * 0.8,
      )
      material.opacity = 0.24 * (1 - zetsu)
      context.add(aura)
      personalGuardCamera(context, centre)
      context.scene.userData.longhiVictory = {
        voluntarySignatures: age >= 144,
        breach: age >= 192,
        zetsu,
        noContractDamage: true,
        handErrors,
        ...combat,
      }
      context.defer(() => {
        delete context.scene.userData.longhiVictory
      })
    },
    dispose() {
      props.dispose()
      disposeVictoryObject(aura)
    },
  }
}
