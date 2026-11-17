import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightSide, FightState } from './types'
import { createFineControlClock } from './fineControlPresentation'
import {
  controlChest,
  controlHand,
  fineControlEase,
  fineControlReduced,
  threadVisible,
} from './fineControlAnchors'

/** The visible line and target loop use the exact link that maintains the bind. */
export function createMachiThreadScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene } = options
  const clock = createFineControlClock()
  const needleGeometry = new THREE.BoxGeometry(0.025, 0.2, 0.025)
  const needleMaterial = new THREE.MeshBasicMaterial({ color: 0xe5e7eb })
  const needles = (['player', 'opponent'] as const).map((side) => {
    const geometry = new THREE.BufferGeometry()
    const material = new THREE.LineBasicMaterial({
      color: 0xf69ccd,
      transparent: true,
      opacity: 0.8,
    })
    const line = new THREE.Line(geometry, material)
    const suture = new THREE.Line(new THREE.BufferGeometry(), material)
    const needle = new THREE.Mesh(needleGeometry, needleMaterial)
    line.name = `machi-thread:${side}`
    needle.name = `machi-needle:${side}`
    suture.name = `machi-suture:${side}`
    scene.add(line, needle, suture)
    return { side, geometry, line, needle, suture, material }
  })
  function threadPath(state: FightState, side: FightSide, age: number | null) {
    const thread = state[side].machiThread!
    const centre = controlChest(options, state, side)
    const points = [controlHand(options, state, thread.owner)]
    const turns = thread.kind === 'bind' ? 2 : 0
    const gather = age === null || !turns ? 0 : (1 - fineControlEase(age / 18)) * 0.12
    for (let i = 0; i <= 32; i++) {
      const angle = (i / 32) * Math.PI * 2 * turns
      points.push(
        new THREE.Vector3(
          centre.x + Math.sin(angle) * (0.22 + gather),
          centre.y + (turns ? (i / 32 - 0.5) * 0.45 : 0),
          centre.z + Math.cos(angle) * (0.16 + gather),
        ),
      )
    }
    return { centre, points }
  }
  return {
    sync: (state: FightState) => {
      const frames = clock(state)
      for (const entry of needles) {
        const target = state[entry.side]
        const thread = target.machiThread
        entry.line.visible = Boolean(thread)
        entry.needle.visible = Boolean(thread)
        entry.suture.visible =
          frames[entry.side].suture !== null && threadVisible(options, state, entry.side)
        syncSuture(options, {
          state,
          side: entry.side,
          line: entry.suture,
          age: frames[entry.side].suture,
        })
        entry.line.userData.events = frames
        if (!thread) continue
        entry.line.visible = threadVisible(options, state, thread.owner)
        const age = fineControlReduced(options) ? null : frames[thread.owner].thread
        const envelope = age === null ? 0 : Math.sin((Math.PI * age) / 18)
        entry.material.opacity = 0.8 + (options.comfort?.().flashes === false ? 0 : envelope * 0.1)
        const { centre, points } = threadPath(state, entry.side, age)
        entry.geometry.setFromPoints(points)
        entry.geometry.computeBoundingSphere()
        entry.needle.position.copy(centre)
        entry.needle.position.z += 0.2
      }
    },
    dispose: () => {
      for (const entry of needles) {
        scene.remove(entry.line, entry.needle, entry.suture)
        entry.geometry.dispose()
        entry.suture.geometry.dispose()
        entry.material.dispose()
      }
      needleGeometry.dispose()
      needleMaterial.dispose()
    },
  }
}

function syncSuture(
  options: EffectSceneOptions,
  c: {
    state: FightState
    side: 'player' | 'opponent'
    line: import('three').Line
    age: number | null
  },
) {
  if (c.age === null) return
  const centre = controlChest(options, c.state, c.side)
  const reduced = fineControlReduced(options)
  const radius = reduced ? 0.08 : 0.16 - fineControlEase(c.age / 18) * 0.08
  const points = Array.from({ length: 25 }, (_, i) => {
    const angle = (i / 24) * Math.PI * 4
    return centre
      .clone()
      .add(new options.THREE.Vector3(Math.sin(angle) * radius, (i / 24 - 0.5) * 0.2, 0.03))
  })
  c.line.geometry.setFromPoints(points)
  c.line.geometry.computeBoundingSphere()
  c.line.visible &&= !reduced
}
