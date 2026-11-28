import type { Object3D } from 'three'
import type { HumanAnimationChannel, HumanPose } from './humanAnimation'
import type { HumanProfile } from './humanProfiles'

/** Stable per-character timing, independent of frame rate and replay direction. */
export function humanBlink(seconds: number, identity: string): number {
  let seed = 0
  for (let i = 0; i < identity.length; i++) seed = (seed * 31 + identity.charCodeAt(i)) >>> 0
  const period = 4.1 + (seed % 17) * 0.1
  const phase = (((seconds + (seed % 101) * 0.037) % period) + period) % period
  const t = (phase - (period - 0.2)) / 0.2
  return t > 0 && t < 1 ? Math.sin(t * Math.PI) ** 2 : 0
}

function poseExpression(pose: HumanPose) {
  switch (pose) {
    case 'attack':
      return { eye: 0.72, brow: 0.18, lift: -0.004, mouth: 1.18 }
    case 'guard':
    case 'brace':
      return { eye: 0.82, brow: 0.12, lift: -0.003, mouth: 0.86 }
    case 'search':
    case 'listen':
      return { eye: 1.12, brow: -0.08, lift: 0.006, mouth: 1 }
    case 'held':
      return { eye: 0.62, brow: -0.16, lift: 0.008, mouth: 1.25 }
    case 'fallen':
      return { eye: 0.08, brow: -0.1, lift: 0.002, mouth: 0.9 }
    case 'zetsu':
      return { eye: 0.06, brow: 0, lift: 0, mouth: 1 }
    case 'flute':
      return { eye: 0.3, brow: 0, lift: 0, mouth: 1 }
    default:
      return { eye: 1, brow: 0, lift: 0, mouth: 1 }
  }
}

interface FacePart {
  node: Object3D
  side: number
  kind: string
  y: number
  scale: number
  rotation: number
}

function captureParts(
  head: Object3D,
  restingEyes: ReadonlyMap<Object3D | undefined, number | undefined>,
): FacePart[] {
  return ['eye', 'brow', 'mouth'].flatMap((kind) =>
    (kind === 'mouth' ? [''] : ['left', 'right']).flatMap((side) => {
      const node = head.getObjectByName(`face-${kind}${side ? `-${side}` : ''}`)
      return node?.visible
        ? [
            {
              node,
              kind,
              side: side === 'left' ? -1 : 1,
              y: node.position.y,
              scale: kind === 'eye' ? (restingEyes.get(node) ?? node.scale.y) : node.scale.y,
              rotation: node.rotation.z,
            },
          ]
        : []
    }),
  )
}

function drawParts(
  parts: FacePart[],
  frame: { current: ReturnType<typeof poseExpression>; blink: number; identity: string },
) {
  const { current, blink, identity } = frame
  for (const part of parts) {
    if (part.kind === 'eye' && identity !== 'hisoka')
      part.node.scale.y = part.scale * current.eye * (1 - blink * 0.94)
    if (part.kind === 'brow') {
      part.node.rotation.z = part.rotation + part.side * current.brow
      part.node.position.y = part.y + current.lift
    }
    // Hidden native mouths and masks retain their drawing and visibility.
    if (part.kind === 'mouth' && !['feitan', 'illumi', 'bonolenov'].includes(identity))
      part.node.scale.y = part.scale * current.mouth
  }
}

function blendAmount(seconds: number, previousSeconds: number | undefined) {
  const dt = previousSeconds === undefined ? Infinity : seconds - previousSeconds
  return dt < 0 || dt > 0.5 ? 1 : 1 - Math.exp(-dt / 0.09)
}

const IMPASSIVE = new Set(['illumi', 'bonolenov'])
const NO_BLINK_POSES = new Set(['fallen', 'zetsu', 'flute'])
function faceBlink(seconds: number, identity: string, pose: HumanPose) {
  return IMPASSIVE.has(identity) || identity === 'hisoka' || NO_BLINK_POSES.has(pose)
    ? 0
    : humanBlink(seconds, identity)
}

/** Tour's expressions retain the authored face; no geometry or material is changed. */
export function humanFaceMotion(head: Object3D, profile: HumanProfile): HumanAnimationChannel {
  const restingEyes = new Map(
    ['left', 'right'].map((side) => {
      const node = head.getObjectByName(`face-eye-${side}`)
      return [node, node?.scale.y] as const
    }),
  )
  // Other details are captured lazily, after model finishing.
  let parts: FacePart[] | undefined
  const current = poseExpression('idle')
  let previousSeconds: number | undefined
  const nativeIdentity = profile.likeness ?? head.name
  const identity = nativeIdentity === 'hisoka' && !head.getObjectByName('hisoka-gaze')
    ? 'hisoka-generic' : nativeIdentity
  return {
    afterFrame: ({ seconds, pose, layer }) => {
      if (layer?.motion || layer?.afterMotion) return
      parts ??= captureParts(head, restingEyes)
      const target = poseExpression(IMPASSIVE.has(identity) ? 'idle' : pose)
      const alpha = blendAmount(seconds, previousSeconds)
      for (const key of ['eye', 'brow', 'lift', 'mouth'] as const)
        current[key] += (target[key] - current[key]) * alpha
      previousSeconds = seconds
      drawParts(parts, { current, blink: faceBlink(seconds, identity, pose), identity })
    },
  }
}
