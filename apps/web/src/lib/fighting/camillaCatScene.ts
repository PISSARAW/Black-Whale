import { createVisitHatsuModel } from './visitHatsuModel'
import { CAT_ABSORB_END, CAT_CAPTURE_END, CAT_SUMMON_END, CATS_NAME_FRAMES } from './camillaCat'
import { attackPhase } from './frameData'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightSide, FightState } from './types'

export function catsNameFighterVisible(state: FightState, side: FightSide): boolean {
  return state.catsNameConsumed !== side
}

/** The post-mortem cat is a sequence prop, never a live guardian or a hitbox. */
export function createCamillaCatScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene, worldX, worldY } = options
  const shapes: import('three').BufferGeometry[] = []
  const gold = new THREE.MeshBasicMaterial({ color: '#ffe694' })
  const metal = new THREE.MeshBasicMaterial({ color: '#54535c' })
  const lineMaterial = new THREE.LineBasicMaterial({
    color: '#ffe694',
    transparent: true,
    opacity: 0.85,
  })
  const sphere = (size: [number, number, number]) => {
    const geometry = new THREE.SphereGeometry(1, 16, 12).scale(...size)
    shapes.push(geometry)
    return geometry
  }
  const make = (
    group: import('three').Group,
    spec: {
      shape: import('three').BufferGeometry
      at: [number, number, number]
      material?: import('three').Material
    },
  ) => {
    const mesh = new THREE.Mesh(spec.shape, spec.material ?? gold)
    mesh.position.set(...spec.at)
    group.add(mesh)
    return mesh
  }
  const catModel = createVisitHatsuModel(THREE, {
    model: 'cats-name', anchor: 'floor', joints: ['arm--1', 'arm-1', 'hand--1', 'hand-1', 'cat-tail'],
  })
  catModel.fit({ height: 2.8, width: 2.4 })
  const catScale = catModel.root.scale.x
  const cat = catModel.root
  cat.name = 'cats-name-feline'
  const captureParts = [...catModel.joints.entries()]
    .filter(([name]) => name.startsWith('arm-') || name.startsWith('hand-'))
    .map(([name, joint]) => ({ joint, x: joint.position.x, sign: name.endsWith('--1') ? -1 : 1 }))
  const energyShape = sphere([0.13, 0.13, 0.13])
  const energy = new THREE.Mesh(energyShape, gold)
  energy.name = 'cats-name-life-energy'
  const lineGeometry = new THREE.BufferGeometry()
  const lifeLine = new THREE.Line(lineGeometry, lineMaterial)
  const gunShape = new THREE.BoxGeometry(0.32, 0.09, 0.07)
  const gripShape = new THREE.BoxGeometry(0.07, 0.16, 0.07)
  shapes.push(gunShape, gripShape)
  const guns = { player: new THREE.Group(), opponent: new THREE.Group() }
  for (const gun of Object.values(guns)) {
    make(gun, { shape: gunShape, at: [0.1, 0, 0], material: metal })
    make(gun, { shape: gripShape, at: [0, -0.09, 0], material: metal })
    gun.name = 'camilla-pistol'
    scene.add(gun)
  }
  scene.add(cat, energy, lifeLine)

  const sync = (state: FightState) => {
    for (const side of ['player', 'opponent'] as const) {
      const fighter = state[side]
      const gun = guns[side]
      gun.visible = fighter.id === 'camilla' && fighter.attack?.kind === 'ranged'
      gun.position.set(worldX(fighter.x) + fighter.facing * 0.48, worldY(fighter.y + 6.1), 0.3)
      gun.scale.x = fighter.facing
      gun.rotation.z = gun.visible && attackPhase(fighter) === 'active' ? -0.1 : 0
    }
    const sequence = state.catsName
    cat.visible = energy.visible = lifeLine.visible = Boolean(sequence)
    if (!sequence) return
    const killer = state[sequence.killerSide]
    const victim = state[sequence.victimSide]
    const frame = sequence.frame
    cat.position.set(worldX(killer.x), worldY(killer.y) + 0.03, -0.3)
    const appearance = Math.min(1, (frame + 1) / CAT_SUMMON_END)
    const disappearance = 1 - clamp((frame - 108) / 12)
    cat.scale.setScalar(Math.max(0.001, catScale * appearance * disappearance))
    const closure = clamp((frame - CAT_SUMMON_END) / (CAT_CAPTURE_END - CAT_SUMMON_END))
    captureParts.forEach(({ joint, x, sign }) => {
      joint.position.x = x - sign * closure * 0.5
    })
    cat.updateWorldMatrix(true, true)
    const tail = catModel.body.localToWorld(new THREE.Vector3(0.85, 1.65, -0.5))
    const start =
      frame < CAT_ABSORB_END ? new THREE.Vector3(worldX(killer.x), worldY(killer.y + 7), 0.5) : tail
    const end =
      frame < CAT_ABSORB_END
        ? tail
        : new THREE.Vector3(worldX(victim.x), worldY(victim.y) + 0.3, 0.4)
    const ratio =
      frame < CAT_ABSORB_END
        ? clamp((frame - CAT_CAPTURE_END) / (CAT_ABSORB_END - CAT_CAPTURE_END))
        : clamp((frame - CAT_ABSORB_END) / (CATS_NAME_FRAMES - CAT_ABSORB_END))
    energy.visible = lifeLine.visible = frame >= CAT_CAPTURE_END
    const points = Array.from({ length: 16 }, (_, index) => {
      const progress = index / 15
      const point = start.clone().lerp(end, progress)
      point.y += Math.sin(progress * Math.PI) * 0.4
      return point
    })
    lifeLine.geometry.setFromPoints(points)
    energy.position.copy(start).lerp(end, ratio)
    energy.position.y += Math.sin(ratio * Math.PI) * 0.4
  }
  return {
    sync,
    dispose: () => {
      catModel.dispose()
      scene.remove(energy, lifeLine, ...Object.values(guns))
      shapes.forEach((shape) => shape.dispose())
      lineGeometry.dispose()
      for (const material of [gold, metal, lineMaterial]) material.dispose()
    },
  }
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value))
}
