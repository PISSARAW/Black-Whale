import { Vector3 } from 'three'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { threadVisible } from '../fineControlAnchors'
import { paperAvailable } from '../kallutoPaper'
import { signatureNenAvailable } from './selection'
import { throwPerformance } from './catalogue'
import { throwSmooth } from './sample'
import type { EffectSceneOptions } from '../fighterEffectScene'
import type { ThrowCinematicFrame } from '../throwCinematic'
import type { FightState } from '../types'

/** Cosmetic strands and scraps follow a confirmed grab; they never create binds or projectiles. */
export function createThrowTextiles(options: EffectSceneOptions) {
  const { THREE, scene } = options
  const thread = new THREE.Group(),
    paper = new THREE.Group()
  thread.name = 'throw-signature:thread'
  paper.name = 'throw-signature:paper'
  const material = new THREE.LineBasicMaterial({
    color: 0xffa7d8,
    transparent: true,
    opacity: 0.95,
  })
  const lines = [0, 1].map(() => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(65 * 3), 3))
    const line = new THREE.Line(geometry, material)
    line.frustumCulled = false
    thread.add(line)
    return line
  })
  const sheet = new THREE.BoxGeometry(0.055, 0.085, 0.007)
  const white = new THREE.MeshBasicMaterial({ color: 0xf4eee7, side: THREE.DoubleSide })
  const pieces = Array.from({ length: 32 }, () => new THREE.Mesh(sheet, white))
  paper.add(...pieces)
  scene.add(thread, paper)
  const hide = () => {
    thread.visible = paper.visible = false
  }
  hide()
  return {
    hide,
    sync(state: FightState, frame: ThrowCinematicFrame) {
      if (frame.age / frame.duration > 0.86 || !threadVisible(options, state, frame.attacker))
        return
      const bodies = textileBodies(options, frame)
      if (!bodies) return
      const effect = throwPerformance(frame.performance)?.effect
      if (effect === 'thread' && signatureNenAvailable(state, frame.attacker)) {
        thread.visible = true
        drawThreads(lines, { ...bodies, frame })
      }
      if (effect === 'paper' && paperAvailable(state[frame.attacker])) {
        paper.visible = true
        drawPaper(paper, pieces, { ...bodies, frame })
      }
    },
    dispose() {
      thread.removeFromParent()
      paper.removeFromParent()
      lines.forEach((line) => line.geometry.dispose())
      material.dispose()
      sheet.dispose()
      white.dispose()
    },
  }
}

function textileBodies(options: EffectSceneOptions, frame: ThrowCinematicFrame) {
  const own = options.figureOf?.(frame.attacker),
    rival = options.figureOf?.(frame.victim)
  if (!own || !rival) return undefined
  const hero = humanAnimationRig(own),
    victim = humanAnimationRig(rival)
  return hero && victim ? { hero, victim } : undefined
}
type Bodies = NonNullable<ReturnType<typeof textileBodies>> & { frame: ThrowCinematicFrame }

function drawThreads(lines: import('three').Line[], bodies: Bodies) {
  const { hero, victim, frame } = bodies
  const spool = frame.performance === 'machi-spool'
  lines.forEach((line, index) => {
    const hand = hero.figure.getObjectByName(index === 0 ? 'hand-left' : 'hand-right')!
    const from = hand.getWorldPosition(new Vector3())
    const target = threadTarget(victim, index, spool)
    const radius = spool && index === 0 ? 0.2 : 0.075
    const centre = target.getWorldPosition(new Vector3())
    const positions = line.geometry.getAttribute('position')
    for (let i = 0; i < 65; i++) {
      const t = i / 64
      const angle = Math.max(0, t - 0.5) * Math.PI * (spool ? 12 : 4)
      const cuff = new Vector3(
        Math.sin(angle) * radius,
        (t - 0.75) * (spool ? 0.35 : 0.025),
        Math.cos(angle) * radius * 0.9,
      )
      const point = t < 0.5 ? from.clone().lerp(centre, t * 2) : target.localToWorld(cuff)
      positions.setXYZ(i, point.x, point.y, point.z)
    }
    positions.needsUpdate = true
    line.geometry.computeBoundingSphere()
  })
}

function threadTarget(victim: Bodies['victim'], index: number, spool: boolean) {
  if (index !== 0) return victim.knees[1].children[1]
  return spool ? victim.torso : victim.figure.getObjectByName('hand-right')!
}

function drawPaper(root: import('three').Group, pieces: import('three').Mesh[], bodies: Bodies) {
  const { hero, victim, frame } = bodies
  const t = frame.age / frame.duration
  const hand = hero.figure.getObjectByName('hand-right')!.getWorldPosition(new Vector3())
  const target = victim.torso.getWorldPosition(new Vector3())
  root.position.copy(hand)
  const gather = throwSmooth((t - 0.2) / 0.5)
  pieces.forEach((piece, index) => {
    const angle = index * 2.4 + t * Math.PI * (frame.powered ? 5 : 3)
    const point = hand.clone().lerp(target, 0.35 + gather * 0.65)
    point.x += Math.cos(angle) * (0.25 + gather * 0.2)
    point.y += Math.sin(angle * 1.7) * 0.35 - Math.max(0, t - 0.7) * 2
    point.z += Math.sin(angle) * (0.2 + gather * 0.2)
    piece.position.copy(point.sub(hand))
    piece.rotation.set(angle * 0.4, angle, t * 4 + index)
  })
}
