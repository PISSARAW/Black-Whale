import { Vector3 } from 'three'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { maryAuthority, maryState } from '../bloodyMary'
import { threadVisible } from '../fineControlAnchors'
import type { EffectSceneOptions } from '../fighterEffectScene'
import type { ThrowCinematicFrame } from '../throwCinematic'
import type { FightState } from '../types'

export function throwBloodAvailable(actor: FightState['player']) {
  return maryAuthority(actor) && (actor.openWounds ?? 0) > 0 && maryState(actor).available >= 3
}

/** The prepared blood illustrates this temporary grip; no Mary capture or wound is created. */
export function createThrowBloodGrip(options: EffectSceneOptions) {
  const { THREE, scene } = options
  const root = new THREE.Group()
  root.name = 'throw-signature:blood'
  const material = new THREE.LineBasicMaterial({ color: 0xb32246 })
  const lines = [0, 1].map(() => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(65 * 3), 3))
    const line = new THREE.Line(geometry, material)
    line.frustumCulled = false
    root.add(line)
    return line
  })
  scene.add(root)
  const hide = () => {
    root.visible = false
  }
  hide()
  return {
    hide,
    sync(state: FightState, frame: ThrowCinematicFrame) {
      if (!bloodFrame(frame)) return
      if (
        !throwBloodAvailable(state[frame.attacker]) ||
        !threadVisible(options, state, frame.attacker)
      )
        return
      const own = options.figureOf?.(frame.attacker),
        rival = options.figureOf?.(frame.victim)
      if (!own || !rival) return
      const target = humanAnimationRig(rival)
      if (!target) return
      root.visible = true
      lines.forEach((line, index) => {
        const hand = own.getObjectByName(index === 0 ? 'hand-left' : 'hand-right')!
        const end =
          frame.powered && index === 1
            ? target.arms[1].children[1]
            : target.knees[index].children[1]
        drawBloodLine(line, hand.getWorldPosition(new Vector3()), end)
      })
    },
    dispose() {
      root.removeFromParent()
      lines.forEach((line) => line.geometry.dispose())
      material.dispose()
    },
  }
}

function bloodFrame(frame: ThrowCinematicFrame) {
  return frame.performance?.startsWith('zakuro') && frame.age / frame.duration <= 0.78
}

function drawBloodLine(line: import('three').Line, from: Vector3, node: import('three').Object3D) {
  const centre = node.getWorldPosition(new Vector3())
  const positions = line.geometry.getAttribute('position')
  for (let i = 0; i < 65; i++) {
    const t = i / 64
    const angle = Math.max(0, t - 0.55) * Math.PI * 8
    const cuff = node.localToWorld(
      new Vector3(Math.sin(angle) * 0.085, (t - 0.75) * 0.05, Math.cos(angle) * 0.085),
    )
    const point = t < 0.55 ? from.clone().lerp(centre, t / 0.55) : cuff
    positions.setXYZ(i, point.x, point.y, point.z)
  }
  positions.needsUpdate = true
  line.geometry.computeBoundingSphere()
}
