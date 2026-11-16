import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightSide, FightState } from './types'

interface FeitanSceneOptions extends EffectSceneOptions {
  figureOf: (side: FightSide) => import('three').Object3D
}

/** The outfit follows the rig; the sun and its readable heat boundary stay in world space. */
export function createFeitanScene(options: FeitanSceneOptions): FighterEffectScene {
  const { THREE, scene } = options
  const geometries: import('three').BufferGeometry[] = []
  const cloth = new THREE.MeshBasicMaterial({ color: '#231e2a', side: THREE.DoubleSide })
  const lining = new THREE.MeshBasicMaterial({ color: '#85374e', side: THREE.DoubleSide })
  const bone = new THREE.MeshBasicMaterial({ color: '#e8d6b5' })
  const core = new THREE.MeshBasicMaterial({ color: '#fff3b4', fog: false })
  const flame = new THREE.MeshBasicMaterial({
    color: '#ff741c',
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
  })
  const edge = new THREE.MeshBasicMaterial({
    color: '#ff9b49',
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
    depthWrite: false,
    fog: false,
  })
  const heat = new THREE.MeshBasicMaterial({
    color: '#e95318',
    transparent: true,
    opacity: 0.065,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
  const mesh = (geometry: import('three').BufferGeometry, material: import('three').Material) => {
    geometries.push(geometry)
    return new THREE.Mesh(geometry, material)
  }
  const build = (side: FightSide) => {
    const armour = new THREE.Group()
    armour.name = `pain-packer:${side}`
    const cape = mesh(new THREE.CylinderGeometry(0.3, 0.64, 1.05, 6, 1, true), cloth)
    cape.position.y = 0.77
    const collar = mesh(new THREE.CylinderGeometry(0.31, 0.35, 0.25, 6), lining)
    collar.position.y = 1.33
    const hood = mesh(new THREE.ConeGeometry(0.3, 0.62, 5), lining)
    hood.position.y = 1.65
    const mask = mesh(new THREE.SphereGeometry(0.13, 8, 6), bone)
    mask.position.set(0, 1.48, 0.26)
    mask.scale.set(0.8, 1.15, 0.45)
    armour.add(cape, collar, hood, mask)
    for (const sign of [-1, 1]) {
      const cross = mesh(new THREE.BoxGeometry(0.055, 0.52, 0.025), bone)
      cross.position.set(0, 1.04, 0.36)
      cross.rotation.z = sign * 0.8
      const eye = mesh(new THREE.SphereGeometry(0.027, 6, 4), cloth)
      eye.position.set(sign * 0.045, 1.5, 0.315)
      armour.add(cross, eye)
    }
    const sun = new THREE.Group()
    sun.name = `rising-sun:${side}`
    const sphere = mesh(new THREE.SphereGeometry(1, 24, 16), core)
    const corona = mesh(new THREE.SphereGeometry(1.35, 24, 16), flame)
    sun.add(sphere, corona)
    const boundary = new THREE.Group()
    boundary.name = `solar-heat:${side}`
    boundary.add(mesh(new THREE.CircleGeometry(1, 64), heat))
    boundary.add(mesh(new THREE.RingGeometry(0.985, 1, 96), edge))
    scene.add(sun, boundary)
    return { armour, sun, boundary, corona }
  }
  const held = { player: build('player'), opponent: build('opponent') }
  return {
    sync(state: FightState, seconds: number) {
      for (const side of ['player', 'opponent'] as const) {
        const fighter = state[side]
        const pain = fighter.hatsuEffects.painPacker
        const drawn = held[side]
        const figure = options.figureOf(side)
        if (drawn.armour.parent !== figure) figure.add(drawn.armour)
        drawn.armour.visible = Boolean(pain?.armour)
        drawn.armour.rotation.z = Math.sin(seconds * 3) * 0.015
        const sun = state.phase === 'fighting' ? pain?.sun : null
        drawn.sun.visible = Boolean(sun)
        drawn.boundary.visible = Boolean(sun)
        if (!sun) continue
        drawn.sun.position.set(options.worldX(sun.x), options.worldY(sun.y), 0)
        drawn.sun.scale.setScalar(0.18 + sun.radius * 0.008)
        drawn.corona.scale.setScalar(1 + Math.sin(seconds * 5) * 0.035)
        drawn.boundary.position.copy(drawn.sun.position)
        drawn.boundary.position.z = -0.35
        drawn.boundary.scale.set(
          options.worldX(sun.x + sun.radius) - options.worldX(sun.x),
          options.worldY(sun.radius),
          1,
        )
      }
    },
    dispose() {
      for (const drawn of Object.values(held)) {
        drawn.armour.removeFromParent()
        scene.remove(drawn.sun, drawn.boundary)
      }
      geometries.forEach((geometry) => geometry.dispose())
      ;[cloth, lining, bone, core, flame, edge, heat].forEach((material) => material.dispose())
    },
  }
}
