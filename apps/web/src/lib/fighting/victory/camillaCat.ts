import * as THREE from 'three'
import { contactShadow } from '$lib/tour/contactShadow'
import { createVisitHatsuModel } from '../visitHatsuModel'
import { createCamillaPawGrip } from './camillaGrip'
import { visibleVictoryBounds } from './bodyBounds'
import type { VictoryContext } from './types'
import type { camillaVictoryPose } from './camillaPose'
import { disposeVictoryObject, ease } from './resources'
import {
  CAMILLA_ABSORB,
  CAMILLA_DROP,
  CAMILLA_PAW_LANDS,
  CAMILLA_RETURN,
  CAMILLA_REVEAL,
  CAMILLA_RISE,
  CAMILLA_TAIL_CHARGED,
} from './camillaTiming'

export function createCamillaVictoryCat() {
  const root = new THREE.Group()
  const model = createVisitHatsuModel(THREE, {
    model: 'cats-name',
    anchor: 'floor',
    joints: ['arm--1', 'arm-1', 'hand--1', 'hand-1', 'cat-tail', 'paw-1', 'leg-1'],
  })
  root.name = 'camilla-cats-name-victory'
  root.add(model.root)
  model.joints.get('cat-tail')!.visible = false
  const fur = new THREE.MeshBasicMaterial({ color: 0x352a3b })
  fur.onBeforeCompile = (shader) => {
    shader.vertexShader = `varying vec3 camillaNormal;\n${shader.vertexShader}`.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\ncamillaNormal = normalize(normalMatrix * normal);',
    )
    shader.fragmentShader = `varying vec3 camillaNormal;\n${shader.fragmentShader}`.replace(
      '#include <opaque_fragment>',
      `vec3 n = normalize(camillaNormal);
       float key = max(dot(n, normalize(vec3(-0.65, 0.75, 0.5))), 0.0);
       float rim = pow(1.0 - abs(n.z), 2.0);
       outgoingLight *= 0.55 + 1.20 * key;
       outgoingLight += vec3(0.073, 0.047, 0.080) * rim * max(n.y, 0.12);
       #include <opaque_fragment>`,
    )
  }
  const originalFur = new Map<THREE.Mesh, THREE.Material>()
  model.body.traverse((node) => {
    if (!(node instanceof THREE.Mesh) || !(node.material instanceof THREE.MeshBasicMaterial)) return
    if (node.material.color.getHex() !== 0x18151c) return
    originalFur.set(node, node.material)
    node.material = fur
  })
  const openingPaw = new THREE.Group()
  openingPaw.name = 'camilla-landing-paw'
  const paw = model.joints.get('paw-1')!.clone()
  const leg = model.joints.get('leg-1')!.clone()
  openingPaw.add(paw, leg)
  root.add(openingPaw)
  const bodyShadow = contactShadow(THREE, { radius: 1.25, strength: 0.78, squash: 0.49 })
  const pawShadow = contactShadow(THREE, { radius: 0.47, strength: 0.72, squash: 0.75 })
  root.add(bodyShadow, pawShadow)
  const paws = createCamillaPawGrip(model, root, fur)
  const tail = new THREE.Mesh(new THREE.BufferGeometry(), fur)
  tail.name = 'camilla-returning-tail'
  root.add(tail)

  const gold = new THREE.MeshBasicMaterial({ color: 0xffe694 })
  const bead = new THREE.SphereGeometry(1, 16, 12)
  const drop = new THREE.Mesh(bead, gold)
  drop.name = 'camilla-life-drop'
  const current = Array.from({ length: 7 }, () => new THREE.Mesh(bead, gold))
  current.forEach((light) => root.add(light))
  root.add(drop)
  function syncOpeningPaw(age: number, scale: number, base: InstanceType<typeof THREE.Vector3>) {
    const landing = Math.max(0, Math.min(1, (age - CAMILLA_PAW_LANDS + 22) / 22)) ** 2
    const pawImpact = 1 - ease((age - CAMILLA_PAW_LANDS) / 11)
    openingPaw.visible = age >= CAMILLA_PAW_LANDS - 22 && age < CAMILLA_REVEAL
    openingPaw.scale.setScalar(scale)
    if (age >= CAMILLA_PAW_LANDS) openingPaw.scale.y *= 1 - pawImpact * 0.12
    paw.position.copy(model.joints.get('paw-1')!.position).add(model.body.position)
    leg.position.copy(model.joints.get('leg-1')!.position).add(model.body.position)
    leg.scale.y = 0.55
    openingPaw.position.copy(base).add(new THREE.Vector3((1 - landing) * 0.24, 0, 0.12))
    pawShadow.visible = openingPaw.visible && landing > 0.6
    if (openingPaw.visible) {
      openingPaw.position.y += 0.022 + (1 - landing) * 0.53 - visibleVictoryBounds(paw).min.y
      paw.getWorldPosition(pawShadow.position)
      pawShadow.position.y = 0.014
    }
  }

  return {
    root,
    sync(context: VictoryContext, pose: ReturnType<typeof camillaVictoryPose>) {
      const { age } = context
      const { ratio } = pose
      const fade = ease((age - CAMILLA_RETURN - 10) / (CAMILLA_RISE - CAMILLA_RETURN - 10))
      model.fit({ height: 2.8 * ratio })
      const scale = model.root.scale.x
      const base = new THREE.Vector3(pose.catX, 0.025, -0.48 * ratio)
      model.root.scale.multiplyScalar(1 - 0.99 * fade)
      model.root.position.copy(base)
      model.root.updateWorldMatrix(true, true)
      model.root.visible = age >= CAMILLA_REVEAL && age < CAMILLA_RISE
      syncOpeningPaw(age, scale, base)
      bodyShadow.visible = pose.fall > 0.78 && pose.rise < 0.25
      bodyShadow.position.set(pose.bodyContact.x, 0.015, pose.bodyContact.z)
      const contacts = paws.sync({
        body: pose.body,
        x: pose.catX,
        approach: pose.grip,
        ratio,
        active: age >= CAMILLA_REVEAL && pose.absorption < 1,
      })

      const reach = ease((age - CAMILLA_TAIL_CHARGED) / (CAMILLA_DROP - CAMILLA_TAIL_CHARGED))
      const retreat = ease((age - CAMILLA_RETURN) / 35)
      const lip = pose.lips
      const world = (x: number, y: number, z: number) =>
        model.body.localToWorld(new THREE.Vector3(x, y, z))
      const tailBase = world(0, 0.55, -0.3)
      const restTip = world(1.18, 2.12, -0.12)
      const aboveLip = lip.clone().add(new THREE.Vector3(0, 0.43, 0))
      const bend = reach * (1 - retreat)
      const tip = restTip.clone().lerp(aboveLip, bend)
      const path = new THREE.CatmullRomCurve3([
        tailBase,
        world(0.68, 0.51, -0.82),
        world(1.37, 1.24, -0.64).lerp(
          aboveLip.clone().add(new THREE.Vector3(0.86, 1.3, -0.32)),
          bend,
        ),
        world(1.34, 1.88, -0.31).lerp(
          aboveLip.clone().add(new THREE.Vector3(0.24, 0.62, -0.05)),
          bend,
        ),
        tip,
      ])
      tail.visible = model.root.visible
      if (tail.visible) {
        tail.geometry.dispose()
        tail.geometry = new THREE.TubeGeometry(path, 36, scale * (1 - fade * 0.98) * 0.1, 10)
      }

      const draw = (age - CAMILLA_ABSORB) / (CAMILLA_TAIL_CHARGED - CAMILLA_ABSORB)
      const source = pose.body.getCenter(new THREE.Vector3())
      current.forEach((light, index) => {
        const progress = draw - index * 0.047
        light.visible = progress >= 0 && progress < 1 && age < CAMILLA_DROP
        if (!light.visible) return
        const body = progress < 0.42
        light.position.copy(body ? source : path.getPointAt((progress - 0.42) / 0.58))
        if (body) light.position.lerp(tailBase, ease(progress / 0.42))
        // Lift the motes just above the fur so the current remains visible as it follows the tail.
        light.position.z += body ? 0.09 : scale * 0.105
        light.scale.setScalar((0.075 - index * 0.008) * ratio)
      })
      drop.visible = age >= CAMILLA_TAIL_CHARGED && age < CAMILLA_RETURN
      const release = Math.max(0, (age - CAMILLA_DROP) / (CAMILLA_RETURN - CAMILLA_DROP))
      drop.position.copy(tip).lerp(lip, release * release)
      drop.scale.set(0.035, release > 0 ? 0.06 : 0.038, 0.035)
      return {
        contacts,
        energy: drop.visible || current.some((light) => light.visible),
        drop: drop.position,
        tip,
      }
    },
    dispose() {
      openingPaw.removeFromParent() // Its clones borrow the model's geometry and materials.
      root.remove(bodyShadow, pawShadow) // These borrow the tour's cached disc and material.
      paws.dispose()
      originalFur.forEach((material, mesh) => {
        mesh.material = material
      })
      model.dispose()
      disposeVictoryObject(root)
    },
  }
}
