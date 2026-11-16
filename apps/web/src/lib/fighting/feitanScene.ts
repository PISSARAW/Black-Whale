import { CANON } from '$lib/tour/humanProportions'
import { createVisitHatsuModel } from './visitHatsuModel'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightSide, FightState } from './types'

interface FeitanSceneOptions extends EffectSceneOptions {
  figureOf: (side: FightSide) => import('three').Object3D
}

/** The outfit follows the rig; the sun and its readable heat boundary stay in world space. */
export function createFeitanScene(options: FeitanSceneOptions): FighterEffectScene {
  const { THREE, scene } = options
  const geometries: import('three').BufferGeometry[] = []
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
    const outfit = createVisitHatsuModel(THREE, { model: 'pain-packer' })
    outfit.fit({ height: 1.8 })
    // The visit garment is authored around the hood, with the coat extending below it.
    outfit.body.position.set(0, 0, 0)
    const armour = outfit.root
    armour.name = `pain-packer:${side}`
    armour.position.y = CANON.headY
    const sun = new THREE.Group()
    sun.name = `rising-sun:${side}`
    const solarModel = createVisitHatsuModel(THREE, { model: 'rising-sun' })
    const sphere = solarModel.root
    const corona = mesh(new THREE.SphereGeometry(1.35, 24, 16), flame)
    sun.add(sphere, corona)
    const boundary = new THREE.Group()
    boundary.name = `solar-heat:${side}`
    boundary.add(mesh(new THREE.CircleGeometry(1, 64), heat))
    boundary.add(mesh(new THREE.RingGeometry(0.985, 1, 96), edge))
    scene.add(sun, boundary)
    return { armour, outfit, solarModel, sun, boundary, corona }
  }
  const held = { player: build('player'), opponent: build('opponent') }
  return {
    sync(state: FightState, seconds: number) {
      for (const side of ['player', 'opponent'] as const) {
        const fighter = state[side]
        const pain = fighter.hatsuEffects.painPacker
        const drawn = held[side]
        const figure = options.figureOf(side)
        const chest = figure.getObjectByName('fight-chest') ?? figure
        if (drawn.armour.parent !== chest) chest.add(drawn.armour)
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
        drawn.outfit.dispose()
        drawn.solarModel.dispose()
        scene.remove(drawn.sun, drawn.boundary)
      }
      geometries.forEach((geometry) => geometry.dispose())
      ;[flame, edge, heat].forEach((material) => material.dispose())
    },
  }
}
