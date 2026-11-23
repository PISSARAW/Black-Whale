import type { Euler, Object3D, Vector3 } from 'three'
import { KURAPIKA_GOLDEN_HEAVY } from './kurapikaGoldenHeavy'
import type { ArcadeFighter } from './types'

interface RestTransform {
  position: Vector3
  rotation: Euler
}

const REST = new WeakMap<Object3D, RestTransform>()
const ACTIVE = new WeakSet<Object3D>()

export interface GoldenHeavySecondary {
  chainLag: number
  lapelLag: number
  guardTension: number
}

/** Deterministic secondary timing: hitstop repeats the same visible transform. */
export function goldenHeavySecondary(frame: number): GoldenHeavySecondary {
  const { startup, active, recovery } = KURAPIKA_GOLDEN_HEAVY.frames
  if (frame < startup) {
    const load = frame / startup
    return { chainLag: -0.12 * load, lapelLag: -0.035 * load, guardTension: load }
  }
  if (frame < startup + active) {
    const contact = (frame - startup) / active
    return {
      chainLag: 0.24 - contact * 0.06,
      lapelLag: 0.07 - contact * 0.015,
      guardTension: 1,
    }
  }
  const release = Math.min(1, (frame - startup - active) / recovery)
  const decay = (1 - release) ** 2
  return {
    chainLag: Math.sin(release * Math.PI * 2.4) * 0.18 * decay,
    lapelLag: Math.sin(release * Math.PI * 1.6) * 0.055 * decay,
    guardTension: decay,
  }
}

/** Chain and lapels follow the body after the articulated pose has been applied. */
export function animateKurapikaGoldenHeavyIdentity(figure: Object3D, fighter: ArcadeFighter): void {
  const golden = fighter.attack?.moveId === 'kurapika:standingHeavy'
  if (!golden && !ACTIVE.has(figure)) return
  const secondary = golden ? goldenHeavySecondary(fighter.attack!.frame) : null
  figure.traverse((part) => {
    const chain = part.name.startsWith('signature-chain-')
    const lapel = part.name.startsWith('kurapika-lapel-')
    if (!chain && !lapel) return
    const rest = restOf(part)
    part.position.copy(rest.position)
    part.rotation.copy(rest.rotation)
    if (chain) part.visible = golden
    if (!secondary) return
    const index = chain ? Number(part.name.split('-').at(-1) ?? 0) : 0
    if (chain) {
      part.rotation.z += secondary.chainLag * (1 + index * 0.12) * fighter.facing
      part.position.x -= secondary.chainLag * index * 0.004 * fighter.facing
      part.position.z += Math.abs(secondary.chainLag) * index * 0.0025
    } else {
      const side = part.name.endsWith('-1') ? 1 : -1
      part.rotation.y += secondary.lapelLag * side
      part.rotation.z -= secondary.lapelLag * fighter.facing * 0.35
    }
  })
  if (golden) ACTIVE.add(figure)
  else ACTIVE.delete(figure)
}

function restOf(part: Object3D): RestTransform {
  const held = REST.get(part)
  if (held) return held
  const made = { position: part.position.clone(), rotation: part.rotation.clone() }
  REST.set(part, made)
  return made
}
