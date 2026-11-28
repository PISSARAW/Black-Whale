import {
  CatmullRomCurve3,
  CircleGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from 'three'
import type { BufferGeometry } from 'three'
import type { VictoryContext } from './types'
import { shizukuSleeveButton, type ShizukuVictoryPose } from './shizukuPose'
import {
  SHIZUKU_BLOOD,
  SHIZUKU_BUTTON,
  SHIZUKU_BUTTON_PULL,
  SHIZUKU_CAUGHT,
  SHIZUKU_DROP,
  SHIZUKU_FALL,
  SHIZUKU_RELEASE,
  SHIZUKU_RETURN,
  SHIZUKU_SHOULDER,
  SHIZUKU_NOZZLE_RELEASE,
} from './shizukuTiming'
import { disposeVictoryObject, ease } from './resources'

export function createShizukuEffects() {
  const root = new Group()
  root.name = 'shizuku-clean-scene'
  const red = new MeshBasicMaterial({ color: 0x9c344c, side: DoubleSide })
  const stream: Mesh<BufferGeometry> = new Mesh(new SphereGeometry(0.001), red)
  stream.name = 'shizuku-stylized-blood-stream'
  const wounds = ['covered', 'exposed'].map((name) => {
    const wound = new Mesh(new CircleGeometry(1, 12), red)
    wound.name = `shizuku-${name}-opening`
    wound.scale.set(0.013, 0.04, 1)
    wound.rotation.z = -0.46
    return wound
  })
  const button = new Group()
  button.name = 'shizuku-last-object-button'
  const brass = new MeshBasicMaterial({ color: 0xd4bb7c, side: DoubleSide })
  button.add(
    new Mesh(new CircleGeometry(0.024, 18), brass),
    new Mesh(new TorusGeometry(0.024, 0.003, 6, 18), brass),
  )
  for (const sign of [-1, 1]) {
    const hole = new Mesh(
      new CircleGeometry(0.003, 8),
      new MeshBasicMaterial({ color: 0x443f39, side: DoubleSide }),
    )
    hole.position.set(sign * 0.008, 0, 0.003)
    button.add(hole)
  }
  const shadow = new Mesh(
    new CircleGeometry(1, 24),
    new MeshBasicMaterial({
      color: 0x131117,
      transparent: true,
      depthWrite: false,
    }),
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.scale.set(0.84, 0.21, 1)
  root.add(stream, ...wounds, shadow, button)
  function floorContact({ age, victim }: VictoryContext) {
    const contact = ease((age - SHIZUKU_SHOULDER + 6) / 6)
    const lift = ease((age - 364) / (SHIZUKU_NOZZLE_RELEASE - 364))
    shadow.visible = contact > 0 && lift < 1
    if (!shadow.visible) return
    const chest = victim.root.getObjectByName('torso') ?? victim.head
    shadow.position.copy(chest.getWorldPosition(new Vector3()))
    shadow.position.x -= 0.26
    shadow.position.y = 0.012
    shadow.material.opacity = contact * (1 - lift) * 0.26
  }
  function blood(age: number, pose: ShizukuVictoryPose, mouth: Vector3) {
    stream.visible = age >= SHIZUKU_BLOOD && age < SHIZUKU_RELEASE
    if (stream.visible) {
      const middle = pose.wound.clone().lerp(mouth, 0.45)
      middle.y += 0.035 + Math.sin(age * 0.3) * 0.02
      middle.z += 0.04
      const curve = new CatmullRomCurve3([pose.wound, middle, mouth])
      stream.geometry.dispose()
      stream.geometry = new TubeGeometry(curve, 16, 0.006, 6, false)
    }
    wounds[0].position.copy(pose.upper)
    wounds[1].position.copy(pose.wound)
    wounds.forEach((wound) => (wound.visible = age < SHIZUKU_FALL))
  }
  function lastObject(context: VictoryContext, mouth: Vector3) {
    const { age, hero } = context
    const cuff = shizukuSleeveButton(hero)
    const floor = new Vector3(context.centre - 0.15, 0.034, 0.88)
    const fall = Math.min(1, Math.max(0, (age - SHIZUKU_DROP) / 33))
    button.position.copy(cuff).lerp(floor, fall * fall)
    button.position.z += Math.sin(fall * Math.PI) * 0.12
    button.rotation.set((-fall * Math.PI) / 2, 0, fall * Math.PI * 2)
    if (age >= SHIZUKU_BUTTON_PULL && age < SHIZUKU_RETURN) {
      const swallow = ease((age - SHIZUKU_BUTTON_PULL) / (SHIZUKU_BUTTON - SHIZUKU_BUTTON_PULL))
      button.position.copy(floor).lerp(mouth, swallow)
      button.rotation.x *= 1 - swallow
    }
    if (age >= SHIZUKU_RETURN) {
      const palm = hero.root
        .getObjectByName('hand-left')!
        .getWorldPosition(new Vector3())
        .add(new Vector3(0.015, 0.02, 0.065))
      const caught = ease((age - SHIZUKU_RETURN) / (SHIZUKU_CAUGHT - SHIZUKU_RETURN))
      button.position.copy(mouth).lerp(palm, caught)
      button.position.y += Math.sin(caught * Math.PI) * 0.16
      button.rotation.set(-0.45 * caught, age * 0.12 * (1 - caught), 0)
    }
    button.visible = age < SHIZUKU_BUTTON || age >= SHIZUKU_RETURN
    return {
      visible: button.visible,
      position: button.position,
      returned: age >= SHIZUKU_CAUGHT,
      lastSwallowedFrame: SHIZUKU_BUTTON,
    }
  }
  return {
    root,
    sync(context: VictoryContext, pose: ShizukuVictoryPose, mouth: Vector3) {
      blood(context.age, pose, mouth)
      floorContact(context)
      return { ...lastObject(context, mouth), bloodVisible: stream.visible }
    },
    dispose: () => disposeVictoryObject(root),
  }
}
