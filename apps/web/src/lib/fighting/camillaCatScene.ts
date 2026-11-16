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
  const fur = new THREE.MeshBasicMaterial({ color: '#24202f' })
  const inner = new THREE.MeshBasicMaterial({ color: '#6d5b7d' })
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
    const mesh = new THREE.Mesh(spec.shape, spec.material ?? fur)
    mesh.position.set(...spec.at)
    group.add(mesh)
    return mesh
  }
  const cat = new THREE.Group()
  cat.name = 'cats-name-feline'
  make(cat, { shape: sphere([0.63, 0.9, 0.38]), at: [0, 0.95, 0] })
  make(cat, { shape: sphere([0.6, 0.47, 0.4]), at: [0, 1.88, 0] })
  make(cat, { shape: sphere([0.28, 0.17, 0.13]), at: [0, 1.7, 0.36], material: inner })
  const paws: import('three').Mesh[] = []
  for (const sign of [-1, 1]) {
    const ear = new THREE.ConeGeometry(0.22, 0.45, 4)
    shapes.push(ear)
    make(cat, { shape: ear, at: [sign * 0.38, 2.35, 0] })
    make(cat, { shape: sphere([0.13, 0.055, 0.03]), at: [sign * 0.25, 1.97, 0.38], material: gold })
    const arm = make(cat, { shape: sphere([0.24, 0.75, 0.24]), at: [sign * 0.64, 1.16, 0.24] })
    arm.rotation.z = sign * 0.22
    const paw = make(cat, { shape: sphere([0.32, 0.38, 0.3]), at: [sign * 0.8, 0.93, 0.5] })
    paw.name = 'cats-name-paw'
    paws.push(paw)
  }
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.4, 0.4, 0),
    new THREE.Vector3(1.05, 0.8, 0),
    new THREE.Vector3(1.22, 2, 0),
    new THREE.Vector3(0.9, 2.45, 0),
  ])
  const tailShape = new THREE.TubeGeometry(tailCurve, 24, 0.065, 7, false)
  shapes.push(tailShape)
  make(cat, { shape: tailShape, at: [0, 0, 0] })
  make(cat, { shape: sphere([0.1, 0.1, 0.1]), at: [0.9, 2.45, 0], material: gold })
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
    cat.scale.setScalar(Math.max(0.001, appearance * disappearance))
    const closure = clamp((frame - CAT_SUMMON_END) / (CAT_CAPTURE_END - CAT_SUMMON_END))
    paws.forEach((paw, index) => {
      paw.position.x = (index === 0 ? -1 : 1) * (0.8 - closure * 0.59)
    })
    const tail = new THREE.Vector3(worldX(killer.x) + 0.9, worldY(killer.y) + 2.48, 0)
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
      scene.remove(cat, energy, lifeLine, ...Object.values(guns))
      shapes.forEach((shape) => shape.dispose())
      lineGeometry.dispose()
      for (const material of [fur, inner, gold, metal, lineMaterial]) material.dispose()
    },
  }
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value))
}
