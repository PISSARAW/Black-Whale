import { chainChest, chainFinger } from './kurapikaChainAnchors'
import { chainEase, KURAPIKA_MAJOR_FRAMES, type KurapikaFrames } from './kurapikaPresentation'
import { kurapikaNenVisible, kurapikaVisualSettings } from './kurapikaAccentScene'
import type { createKurapikaChainModel } from './kurapikaChainModel'
import type { EffectSceneOptions } from './fighterEffectScene'
import type { FightSide, FightState } from './types'

export function createKurapikaMajorScene(
  options: EffectSceneOptions,
  actor: { side: FightSide; model: ReturnType<typeof createKurapikaChainModel> },
) {
  const { THREE, scene } = options
  const root = new THREE.Group()
  root.name = `kurapika-major:${actor.side}`
  const ring = new THREE.TorusGeometry(0.32, 0.009, 5, 48)
  const bead = new THREE.SphereGeometry(0.024, 8, 6)
  const glow = (colour: number) =>
    new THREE.MeshBasicMaterial({
      color: colour,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })
  const materials = {
    emperor: glow(0xf7e9dc),
    eyes: glow(0xf74750),
    jail: glow(0xcce9ff),
    steal: glow(0x87dfff),
    judgment: glow(0xef6378),
    heal: glow(0xf5d67b),
  }
  function bands(name: string, material: import('three').Material, count: number) {
    const group = new THREE.Group()
    group.name = name
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(ring, material)
      mesh.rotation.x = Math.PI / 2
      mesh.position.y = (i - (count - 1) / 2) * 0.24
      group.add(mesh)
    }
    root.add(group)
    return group
  }
  const emperor = bands('emperor-manifestation', materials.emperor, 3)
  const jail = bands('chain-jail-tightening', materials.jail, 3)
  const judgment = bands('judgment-implantation', materials.judgment, 2)
  judgment.children.forEach((part, i) => {
    part.rotation.x = (i * Math.PI) / 3
    part.position.y = 0
  })
  const heal = bands('holy-chain-healing', materials.heal, 1)
  const stolen = bands('steal-chain-acquired', materials.steal, 2)
  stolen.children.forEach((part, i) => {
    part.rotation.x = (i * Math.PI) / 2
    part.position.y = 0
  })
  const eyes = ['left', 'right'].map((side) => {
    const mesh = new THREE.Mesh(ring, materials.eyes)
    mesh.name = `emperor-eye-spark:${side}`
    mesh.scale.setScalar(0.07)
    root.add(mesh)
    return { side, mesh }
  })
  const drain = new THREE.InstancedMesh(bead, materials.steal, 8)
  drain.name = 'steal-chain-drain-flow'
  drain.frustumCulled = false
  root.add(drain)
  const dummy = new THREE.Object3D()
  const start = new THREE.Vector3(),
    end = new THREE.Vector3(),
    bend = new THREE.Vector3()
  scene.add(root)
  const pulse = (frame: number | null) =>
    frame === null ? 0 : Math.sin((Math.PI * frame) / KURAPIKA_MAJOR_FRAMES)

  function syncEmperor(state: FightState, frames: KurapikaFrames) {
    const frame = frames.emperor
    const figure = options.figureOf?.(actor.side)
    const intensity = pulse(frame)
    emperor.visible = intensity > 0 && !state[actor.side].nen.on
    emperor.position.copy(chainChest(options, { state, side: actor.side }))
    emperor.scale.setScalar(1.5 - chainEase((frame ?? 0) / 30) * 0.5)
    materials.emperor.opacity = intensity * 0.4
    materials.eyes.opacity = intensity * 0.8
    for (const { side, mesh } of eyes) {
      const iris = figure?.getObjectByName(`face-eye-${side}`)?.getObjectByName('eye-pupil')
      mesh.visible = Boolean(emperor.visible && iris && !state[actor.side].parallelEyesClosed)
      if (!iris) continue
      iris.getWorldPosition(mesh.position)
      iris.getWorldQuaternion(mesh.quaternion)
    }
  }
  function syncJail(state: FightState, frames: KurapikaFrames) {
    jail.visible = frames.jail !== null
    const target = actor.side === 'player' ? 'opponent' : 'player'
    jail.position.copy(chainChest(options, { state, side: target }))
    jail.scale.setScalar(1.6 - chainEase((frames.jail ?? 0) / 24) * 0.6)
    materials.jail.opacity = pulse(frames.jail) * 0.48
  }
  function syncDrain(state: FightState, frames: KurapikaFrames) {
    drain.visible = frames.drain !== null
    stolen.visible = frames.steal !== null
    if (!drain.visible && !stolen.visible) return
    start.copy(chainFinger(options, { state, side: actor.side, stage: 1 }))
    const target = actor.side === 'player' ? 'opponent' : 'player'
    end.copy(chainChest(options, { state, side: target }))
    bend.copy(start).lerp(end, 0.5)
    bend.y -= 0.09
    const curve = new THREE.QuadraticBezierCurve3(end, bend, start)
    for (let i = 0; i < 8; i++) {
      const t = ((frames.drain ?? 0) / 32 + i / 8) % 1
      curve.getPoint(t, dummy.position)
      dummy.position.z += 0.12
      dummy.updateMatrix()
      drain.setMatrixAt(i, dummy.matrix)
    }
    drain.instanceMatrix.needsUpdate = true
    stolen.position.copy(start)
    stolen.scale.setScalar(0.25 + chainEase((frames.steal ?? 0) / 30) * 0.35)
    materials.steal.opacity = Math.max(pulse(frames.drain), pulse(frames.steal)) * 0.8
  }
  function syncJudgment(state: FightState, frames: KurapikaFrames) {
    judgment.visible = frames.judgment !== null && actor.model.seal.visible
    actor.model.seal.getWorldPosition(judgment.position)
    judgment.position.z += 0.035
    judgment.scale.setScalar(0.8 - chainEase((frames.judgment ?? 0) / 42) * 0.4)
    materials.judgment.opacity = pulse(frames.judgment) * 0.7
    heal.visible = frames.heal !== null
    heal.position.copy(chainChest(options, { state, side: actor.side }))
    heal.scale.setScalar(0.6 + (frames.heal ?? 0) / 24)
    materials.heal.opacity = frames.heal === null ? 0 : Math.sin((Math.PI * frames.heal) / 18) * 0.5
  }
  return {
    sync(state: FightState, frames: KurapikaFrames) {
      root.visible =
        kurapikaNenVisible(options, state, actor.side) && kurapikaVisualSettings(options).flashes
      syncEmperor(state, frames)
      syncJail(state, frames)
      syncDrain(state, frames)
      syncJudgment(state, frames)
      root.userData.events = {
        emperor: frames.emperor,
        jail: frames.jail,
        drain: frames.drain,
        steal: frames.steal,
        judgment: frames.judgment,
      }
    },
    dispose() {
      scene.remove(root)
      ring.dispose()
      bead.dispose()
      drain.dispose()
      Object.values(materials).forEach((material) => material.dispose())
    },
  }
}
