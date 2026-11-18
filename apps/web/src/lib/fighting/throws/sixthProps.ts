import { Vector3 } from 'three'
import { entitiesFor, readyCohort } from '../preparationWorld'
import { threadVisible } from '../fineControlAnchors'
import { throwCohortReady } from './sixthConditions'
import type { EffectSceneOptions } from '../fighterEffectScene'
import type { ThrowCinematicFrame } from '../throwCinematic'
import type { FightState } from '../types'

/** Existing supporters and a grown living seed keep their own simulation. */
export function createThrowSixthProps(options: EffectSceneOptions) {
  const { THREE, scene } = options
  const cohort = new THREE.Group(),
    growth = new THREE.Object3D()
  cohort.name = 'throw-signature:archer'
  growth.name = 'throw-signature:growth'
  const material = new THREE.LineBasicMaterial({
    color: 0xe9f5ff,
    transparent: true,
    opacity: 0.45,
  })
  const lines = [0, 1, 2].map(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints([new Vector3(), new Vector3()])
    const line = new THREE.Line(geometry, material)
    line.frustumCulled = false
    cohort.add(line)
    return line
  })
  scene.add(cohort, growth)
  const hide = () => {
    cohort.visible = growth.visible = false
  }
  hide()
  return {
    hide,
    sync(state: FightState, frame: ThrowCinematicFrame) {
      if (frame.performance?.startsWith('halkenburg'))
        poseCohort(options, { state, frame, root: cohort, lines })
      const plant = actualGrowth(options, state, frame)
      if (plant?.visible) {
        growth.visible = true
        plant.getWorldPosition(growth.position)
      }
    },
    dispose() {
      cohort.removeFromParent()
      growth.removeFromParent()
      lines.forEach((line) => line.geometry.dispose())
      material.dispose()
    },
  }
}

function poseCohort(
  options: EffectSceneOptions,
  context: {
    state: FightState
    frame: ThrowCinematicFrame
    root: import('three').Group
    lines: import('three').Line[]
  },
) {
  const { state, frame, root, lines } = context
  if (!frame.powered || !throwCohortReady(state, frame.attacker)) return
  if (!threadVisible(options, state, frame.attacker) || options.comfort?.().flashes === false)
    return
  const hero = options.figureOf?.(frame.attacker)?.getObjectByName('fight-chest')
  if (!hero) return
  const target = hero.getWorldPosition(new Vector3())
  const supporters = readyCohort(state, frame.attacker).slice(0, 3)
  lines.forEach((line, index) => {
    const source =
      supporters[index] && options.scene.getObjectByName(`prepared:${supporters[index].id}`)
    line.visible = Boolean(source?.visible)
    if (!source) return
    const from = source.getWorldPosition(new Vector3())
    from.y += 0.9
    const positions = line.geometry.getAttribute('position')
    positions.setXYZ(0, from.x, from.y, from.z)
    positions.setXYZ(1, target.x, target.y, target.z)
    positions.needsUpdate = true
    line.geometry.computeBoundingSphere()
  })
  root.visible = lines.some((line) => line.visible)
}
function actualGrowth(options: EffectSceneOptions, state: FightState, frame: ThrowCinematicFrame) {
  if (!frame.performance?.startsWith('bill')) return
  const seed = entitiesFor(state, frame.attacker, 'seed').find(
    (entry) => entry.growth && Math.abs(entry.x - state[frame.attacker].x) < 18,
  )
  return seed ? options.scene.getObjectByName(`prepared:${seed.id}`) : undefined
}
