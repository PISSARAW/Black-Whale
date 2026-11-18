import { fighterAuraHex } from './auraColours'
import { auraConcentration } from './nenConcentration'
import { createNenConcentrationRig } from './nenConcentrationRig'
import { createConcentrationClock } from './nenConcentrationClock'
import { fluxRibbonGeometry, drawFluxRibbon } from './nenFluxRibbon'
import { fineControlReduced, threadVisible } from './fineControlAnchors'
import type { EffectSceneOptions } from './fighterEffectScene'
import type { FightSide, FightState } from './types'
import { attackData } from './frameData'

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
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    opacity: 0.65,
  })
  const materials = { player: material, opponent: material.clone() }
  const flows = Array.from({ length: 24 }, (_, index) => {
    const mesh = new THREE.Mesh(
      fluxRibbonGeometry(THREE),
      materials[index < 12 ? 'player' : 'opponent'],
    )
    mesh.name = 'nen-redistribution-flow'
    mesh.visible = false
    scene.add(mesh)
    return mesh
  })
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
    const attack = state[side].attack
    const travel = attack
      ? frame.age + attackData(attack.kind, state[side]).startup - attack.frame
      : 8
    const travelFrames = Math.max(2, Math.min(8, travel))
    rig.sync(concentration, frame.time / 60, {
      strength: frame.strength,
      age: frame.age,
      travelFrames,
    })
    if (!actual || fineControlReduced(options) || frame.age >= 14) return
    drawFlux(rig, { age: frame.age, offset: side === 'player' ? 0 : 12, travelFrames })
  }
  function drawFlux(rig: Rig, timing: { age: number; offset: number; travelFrames: number }) {
    const { age, offset, travelFrames } = timing
    const destinations = rig.regions.filter(
      (region) => region.material.uniforms.u_share.value >= 0.5,
    )
    let index = offset
    for (const region of destinations) {
      for (let packet = 0; packet < 4; packet++) {
        const t = Math.min(1, Math.max(0, (age - packet * travelFrames * 0.16) / travelFrames))
        const mesh = flows[index++]
        if (!mesh || t <= 0 || t >= 1) continue
        drawFluxRibbon(mesh, region.path, t)
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
      flows.forEach((mesh) => {
        mesh.removeFromParent()
        mesh.geometry.dispose()
      })
      material.dispose()
      materials.opponent.dispose()
    },
  }
}
