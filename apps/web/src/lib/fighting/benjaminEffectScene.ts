import { createVisitHatsuModel } from './visitHatsuModel'
import { benjaminNenActive } from './benjaminBaton'
import { secretWindowTarget, secretWindowVisibleTo } from './secretWindow'
import { secretWindowBirdHeight } from './secretWindowPlacement'
import { sleepingBody } from './hanzoProjection'
import { attackPhase } from './frameData'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { ArcadeFighter, FightSide, FightState } from './types'

/** Inherited Nen effects; the physical firearm belongs to Benjamin's animated hands. */
export function createBenjaminEffectScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene } = options
  const aura = new THREE.MeshBasicMaterial({ color: '#eeeeec', transparent: true, opacity: 0.8 })
  const dark = new THREE.MeshBasicMaterial({ color: '#24252a' })
  const geometries: import('three').BufferGeometry[] = []
  const box = (size: [number, number, number]) => {
    const made = new THREE.BoxGeometry(...size)
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
  const build = (side: FightSide) => {
    const owlModel = createVisitHatsuModel(THREE, { model: 'secret-window' })
    owlModel.fit({ height: 0.48, width: 0.34 })
    const owl = owlModel.root
    owl.name = side === 'player' ? 'benjamin-secret-window' : `benjamin-secret-window:${side}`
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
    owl.name = side === 'player' ? 'benjamin-secret-window' : `benjamin-secret-window:${side}`
    rectangle.name =
      side === 'player' ? 'benjamin-culdcept-rectangle' : `benjamin-culdcept-rectangle:${side}`
    card.name = side === 'player' ? 'benjamin-culdcept-card' : `benjamin-culdcept-card:${side}`
    scene.add(owl, rectangle, card)
    return { owl, owlModel, rectangle, card }
  }
  const sides = { player: build('player'), opponent: build('opponent') }
  const syncSide = (state: FightState, side: FightSide, seconds: number) => {
    const fighter = state[side]
    const held = sides[side]
    const benjamin = fighter.id === 'benjamin'
    const activeNen = benjamin && benjaminNenActive(fighter)
    const baton = fighter.hatsuEffects.baton
    const target = markedWindowBody(state, fighter)
    held.owl.visible =
      benjamin && secretWindowVisibleTo(state, side, options.viewer?.() ?? 'player')
    if (target)
      held.owl.position.set(
        options.worldX(target.body.x) - 0.3,
        options.worldY(target.body.y + target.height) + Math.sin(seconds * 5) * 0.04,
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
        scene.remove(held.rectangle, held.card)
        held.owlModel.dispose()
      }
      geometries.forEach((geometry) => geometry.dispose())
      for (const material of [aura, dark]) material.dispose()
    },
  }
}

function rectangleVisible(fighter: ArcadeFighter): boolean {
  return fighter.attack?.moveId === 'benjamin:downSpecial' && attackPhase(fighter) !== 'recovery'
}

function markedWindowBody(state: FightState, fighter: ArcadeFighter) {
  const original = fighter.secretWindow && secretWindowTarget(state, fighter.secretWindow)
  return original
    ? { body: sleepingBody(original), height: secretWindowBirdHeight(original) }
    : null
}
