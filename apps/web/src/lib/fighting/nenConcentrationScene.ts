import { fighterAuraHex } from './auraColours'
import { auraConcentration } from './nenConcentration'
import { createNenConcentrationRig } from './nenConcentrationRig'
import { createConcentrationClock } from './nenConcentrationClock'
import { fineControlReduced, threadVisible } from './fineControlAnchors'
import type { EffectSceneOptions } from './fighterEffectScene'
import type { FightSide, FightState } from './types'

type Rig = ReturnType<typeof createNenConcentrationRig>
type Held = { figure: import('three').Object3D; rig: Rig }

/** One persistent observer across rig rebuilds: allocation changes create the travelling flux. */
export function createNenConcentrationScene(options: EffectSceneOptions) {
  const { THREE, scene } = options
  const held: Partial<Record<FightSide, Held>> = {}
  const clocks = {
    player: createConcentrationClock('player'),
    opponent: createConcentrationClock('opponent'),
  }
  const geometry = new THREE.SphereGeometry(0.026, 6, 4)
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const materials = { player: material, opponent: material.clone() }
  const flows = Array.from({ length: 24 }, (_, index) => {
    const mesh = new THREE.Mesh(geometry, materials[index < 12 ? 'player' : 'opponent'])
    mesh.name = 'nen-redistribution-flow'
    mesh.visible = false
    scene.add(mesh)
    return mesh
  })
  const start = new THREE.Vector3(),
    end = new THREE.Vector3()
  function actorRig(state: FightState, side: FightSide) {
    const figure = options.figureOf?.(side)
    if (!figure) {
      held[side]?.rig.dispose()
      delete held[side]
      return null
    }
    if (held[side]?.figure !== figure) {
      held[side]?.rig.dispose()
      held[side] = {
        figure,
        rig: createNenConcentrationRig(THREE, figure, fighterAuraHex(state[side].id)),
      }
    }
    return held[side]!.rig
  }
  function syncActor(state: FightState, side: FightSide) {
    materials[side].color.setHex(fighterAuraHex(state[side].id))
    const rig = actorRig(state, side)
    if (!rig) return
    const visible = threadVisible(options, state, side)
    const actual = visible ? auraConcentration(state[side]) : null
    const frame = clocks[side](state, actual)
    const concentration = visible ? frame.concentration : null
    rig.sync(concentration, frame.time / 60, frame.strength)
    if (!actual || fineControlReduced(options) || frame.age >= 14) return
    drawFlux(rig, frame.age, side === 'player' ? 0 : 12)
  }
  function drawFlux(rig: Rig, age: number, offset: number) {
    const destinations = rig.regions.filter(
      (region) => region.material.uniforms.u_share.value >= 0.5,
    )
    let index = offset
    for (const region of destinations) {
      for (let packet = 0; packet < 4; packet++) {
        const t = Math.min(1, Math.max(0, (age - packet * 1.5) / 8))
        const mesh = flows[index++]
        if (!mesh || t <= 0 || t >= 1) continue
        mesh.visible = true
        const segment = t * (region.path.length - 1)
        const from = Math.floor(segment)
        region.path[from].getWorldPosition(start)
        region.path[from + 1].getWorldPosition(end)
        mesh.position.lerpVectors(start, end, segment - from)
        mesh.position.z += 0.07
        mesh.scale.setScalar(0.7 + Math.sin(Math.PI * t) * 0.6)
      }
    }
  }
  return {
    sync(state: FightState) {
      flows.forEach((mesh) => {
        mesh.visible = false
      })
      syncActor(state, 'player')
      syncActor(state, 'opponent')
    },
    dispose() {
      held.player?.rig.dispose()
      held.opponent?.rig.dispose()
      flows.forEach((mesh) => mesh.removeFromParent())
      geometry.dispose()
      material.dispose()
      materials.opponent.dispose()
    },
  }
}
