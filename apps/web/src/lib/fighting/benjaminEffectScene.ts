import { createVisitHatsuModel } from './visitHatsuModel'
import { benjaminNenActive } from './benjaminBaton'
import { attackData, attackPhase } from './frameData'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { ArcadeFighter, FightSide, FightState } from './types'

/** Distinct silhouettes: a physical firearm, Musse's owl and Shikaku's rectangle/card. */
export function createBenjaminEffectScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene } = options
  const metal = new THREE.MeshStandardMaterial({
    color: '#343938',
    roughness: 0.55,
    metalness: 0.7,
  })
  const aura = new THREE.MeshBasicMaterial({ color: '#eeeeec', transparent: true, opacity: 0.8 })
  const flash = new THREE.MeshBasicMaterial({ color: '#ffe09c' })
  const dark = new THREE.MeshBasicMaterial({ color: '#24252a' })
  const geometries: import('three').BufferGeometry[] = []
  const box = (size: [number, number, number]) => {
    const made = new THREE.BoxGeometry(...size)
    geometries.push(made)
    return made
  }
  const sphere = (radius: number) => {
    const made = new THREE.SphereGeometry(radius, 10, 7)
    geometries.push(made)
    return made
  }
  const mesh = (
    group: import('three').Group,
    spec: {
      geometry: import('three').BufferGeometry
      material: import('three').Material
      position: [number, number, number]
    },
  ) => {
    const made = new THREE.Mesh(spec.geometry, spec.material)
    made.position.set(...spec.position)
    group.add(made)
    return made
  }
  const build = () => {
    const gun = new THREE.Group()
    mesh(gun, { geometry: box([0.62, 0.19, 0.17]), material: metal, position: [0, 0, 0] })
    mesh(gun, { geometry: box([0.6, 0.075, 0.075]), material: metal, position: [0.57, 0.03, 0] })
    mesh(gun, { geometry: box([0.29, 0.15, 0.12]), material: metal, position: [-0.42, -0.03, 0] })
    mesh(gun, { geometry: box([0.14, 0.26, 0.1]), material: metal, position: [0.12, -0.2, 0] })
    const muzzle = mesh(gun, { geometry: sphere(0.11), material: flash, position: [0.93, 0.03, 0] })
    const owlModel = createVisitHatsuModel(THREE, { model: 'secret-window' })
    owlModel.fit({ height: 0.48, width: 0.34 })
    const owl = owlModel.root
    owl.name = 'benjamin-secret-window'
    owl.rotation.y = Math.PI
    const rectangle = new THREE.Group()
    for (const sign of [-1, 1]) {
      mesh(rectangle, {
        geometry: box([0.05, 0.9, 0.03]),
        material: aura,
        position: [sign * 0.3, 0, 0],
      })
      mesh(rectangle, {
        geometry: box([0.65, 0.05, 0.03]),
        material: aura,
        position: [0, sign * 0.45, 0],
      })
    }
    const card = new THREE.Group()
    mesh(card, { geometry: box([0.24, 0.36, 0.035]), material: dark, position: [0, 0, 0] })
    mesh(card, { geometry: box([0.16, 0.26, 0.04]), material: aura, position: [0, 0, 0] })
    gun.name = 'benjamin-firearm'
    owl.name = 'benjamin-secret-window'
    rectangle.name = 'benjamin-culdcept-rectangle'
    card.name = 'benjamin-culdcept-card'
    scene.add(gun, owl, rectangle, card)
    return { gun, muzzle, owl, owlModel, rectangle, card }
  }
  const sides = { player: build(), opponent: build() }
  const syncSide = (state: FightState, side: FightSide, seconds: number) => {
    const fighter = state[side]
    const held = sides[side]
    const benjamin = fighter.id === 'benjamin'
    const activeNen = benjamin && benjaminNenActive(fighter)
    const baton = fighter.hatsuEffects.baton
    held.gun.visible = gunHeld(fighter)
    held.gun.position.set(
      options.worldX(fighter.x) + fighter.facing * 0.5,
      options.worldY(fighter.y + 6.1),
      0.35,
    )
    held.gun.scale.x = fighter.facing
    held.muzzle.visible = burstFlash(fighter)
    const target = markedFighter(state, fighter)
    held.owl.visible = side === 'player' && Boolean(activeNen && target)
    if (target)
      held.owl.position.set(
        options.worldX(target.x) - 0.3,
        options.worldY(target.y + 12.5) + Math.sin(seconds * 5) * 0.04,
        0.35,
      )
    held.rectangle.visible = activeNen && rectangleVisible(fighter)
    held.rectangle.position.set(
      options.worldX(fighter.x) + fighter.facing * 0.65,
      options.worldY(fighter.y + 6.1),
      0.4,
    )
    held.card.visible = Boolean(activeNen && baton?.card)
    held.card.position.set(
      options.worldX(fighter.x) - fighter.facing * 0.4,
      options.worldY(fighter.y + 8),
      0.4,
    )
  }
  return {
    sync: (state, seconds) => {
      syncSide(state, 'player', seconds)
      syncSide(state, 'opponent', seconds)
    },
    dispose: () => {
      for (const held of Object.values(sides)) {
        scene.remove(held.gun, held.rectangle, held.card)
        held.owlModel.dispose()
      }
      geometries.forEach((geometry) => geometry.dispose())
      for (const material of [metal, aura, dark, flash]) material.dispose()
    },
  }
}

function burstFlash(fighter: ArcadeFighter): boolean {
  if (fighter.attack?.kind !== 'ranged' || attackPhase(fighter) !== 'active') return false
  return (fighter.attack.frame - attackData('ranged', fighter).startup) % 6 < 2
}

function gunHeld(fighter: ArcadeFighter): boolean {
  return (
    fighter.id === 'benjamin' &&
    (fighter.attack?.kind === 'ranged' || fighter.attack?.moveId === 'benjamin:backSpecial')
  )
}

function markedFighter(state: FightState, fighter: ArcadeFighter): ArcadeFighter | null {
  const target = fighter.hatsuEffects.baton?.markedTarget
  return target ? state[target] : null
}

function rectangleVisible(fighter: ArcadeFighter): boolean {
  return fighter.attack?.moveId === 'benjamin:downSpecial' && attackPhase(fighter) !== 'recovery'
}
