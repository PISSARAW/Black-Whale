import { createUmbrellaFeintScene } from './feitanUmbrellaScene'
import { PAIN_PACKER_JOINTS } from '$lib/tour/painPackerModel'
import { syncPainPackerRig, restorePainPackerWearer } from './painPackerRig'
import { CANON } from '$lib/tour/humanProportions'
import { createVisitHatsuModel } from './visitHatsuModel'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightSide, FightState } from './types'
import { createFeitanPresentationClock, feitanEase, type ArmourFrames } from './feitanPresentation'
import { createPainPackerReveal } from './painPackerReveal'
import { createPainPackerConjuration } from './painPackerConjuration'
import { createFeitanSolarCorona } from './feitanSolarCorona'
import type { FightComfort } from './fightComfort'

interface FeitanSceneOptions extends EffectSceneOptions {
  figureOf: (side: FightSide) => import('three').Object3D
  initial?: FightState
  comfort?: () => FightComfort
  reducedMotion?: () => boolean
}

/** The outfit follows the rig; the sun and its readable heat boundary stay in world space. */
export function createFeitanScene(options: FeitanSceneOptions): FighterEffectScene {
  const { THREE, scene } = options
  const umbrella = createUmbrellaFeintScene(options)
  const clock = createFeitanPresentationClock(options.initial)
  const reducedMotion = () =>
    options.reducedMotion?.() ??
    (options.comfort?.().camera === 0 && options.comfort?.().flashes === false)
  const geometries: import('three').BufferGeometry[] = []
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
    const outfit = createVisitHatsuModel(THREE, {
      model: 'pain-packer',
      joints: PAIN_PACKER_JOINTS,
    })
    outfit.fit({ height: 1.8 })
    // The visit garment is authored around the hood, with the coat extending below it.
    outfit.body.position.set(0, 0, 0)
    const armour = outfit.root
    armour.name = `pain-packer:${side}`
    armour.position.y = CANON.headY
    const hood = outfit.joints.get('pain-packer-hood')
    if (hood) hood.userData.cameraFrontal = true
    const reveal = createPainPackerReveal(outfit)
    const conjuration = createPainPackerConjuration(THREE)
    const sun = new THREE.Group()
    sun.name = `rising-sun:${side}`
    const solarModel = createVisitHatsuModel(THREE, { model: 'rising-sun' })
    const sphere = solarModel.root
    const corona = createFeitanSolarCorona(THREE)
    sun.add(sphere, corona.root)
    const boundary = new THREE.Group()
    boundary.name = `solar-heat:${side}`
    boundary.add(mesh(new THREE.CircleGeometry(1, 64), heat))
    boundary.add(mesh(new THREE.RingGeometry(0.985, 1, 96), edge))
    sun.visible = false
    boundary.visible = false
    scene.add(sun, boundary, conjuration.root)
    return { armour, outfit, reveal, conjuration, solarModel, sun, boundary, corona }
  }
  const held = { player: build('player'), opponent: build('opponent') }
  function syncArmour(side: FightSide, state: FightState, frames: ArmourFrames) {
    const drawn = held[side]
    const active = Boolean(state[side].hatsuEffects.painPacker?.armour)
    const figure = options.figureOf(side)
    const chest = figure.getObjectByName('fight-chest') ?? figure
    if (drawn.armour.parent !== chest) chest.add(drawn.armour)
    drawn.armour.visible = active
    const reduced = reducedMotion()
    const frame = reduced ? null : frames[side]
    const reveal = drawn.reveal.sync(frame)
    syncPainPackerRig({ THREE, outfit: drawn.outfit, figure, active, reveal })
    const contraction = drawn.conjuration.sync(active ? frame : null, reduced)
    figure.updateWorldMatrix(true, false)
    figure.getWorldPosition(drawn.conjuration.root.position)
    figure.getWorldScale(drawn.conjuration.root.scale).multiplyScalar(contraction)
    drawn.armour.userData.entryFrame = frame
  }
  function syncSun(side: FightSide, state: FightState) {
    const drawn = held[side]
    const sun = state.phase === 'fighting' ? state[side].hatsuEffects.painPacker?.sun : null
    drawn.sun.visible = Boolean(sun)
    drawn.boundary.visible = Boolean(sun)
    if (!sun) return
    const reduced = reducedMotion()
    const arrival = reduced ? 1 : 0.35 + feitanEase(sun.age / 12) * 0.65
    drawn.sun.position.set(options.worldX(sun.x), options.worldY(sun.y), 0)
    drawn.sun.scale.setScalar((0.18 + sun.radius * 0.008) * arrival)
    drawn.corona.sync(sun.age, { reduced, flashes: options.comfort?.().flashes ?? true })
    drawn.boundary.position.copy(drawn.sun.position)
    drawn.boundary.position.z = -0.35
    drawn.boundary.scale.set(
      options.worldX(sun.x + sun.radius) - options.worldX(sun.x),
      options.worldY(sun.radius),
      1,
    )
  }
  return {
    sync(state: FightState, _seconds: number) {
      umbrella.sync(state)
      const frames = clock(state)
      for (const side of ['player', 'opponent'] as const) {
        syncArmour(side, state, frames)
        syncSun(side, state)
      }
    },
    dispose() {
      umbrella.dispose()
      for (const drawn of Object.values(held)) {
        restorePainPackerWearer(drawn.armour)
        drawn.outfit.dispose()
        drawn.solarModel.dispose()
        drawn.conjuration.dispose()
        drawn.corona.dispose()
        scene.remove(drawn.sun, drawn.boundary)
      }
      geometries.forEach((geometry) => geometry.dispose())
      ;[edge, heat].forEach((material) => material.dispose())
    },
  }
}
