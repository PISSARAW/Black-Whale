import type { Object3D } from 'three'
import { expressionDefinition } from './catalogue'
import {
  EXPRESSION_CONTROLS,
  EXPRESSION_REST,
  type ExpressionCue,
  type ExpressionPose,
} from './types'

const ACTIVE = new WeakMap<Object3D, ExpressionCue>()
const FRAME = new WeakMap<Object3D, ExpressionCue>()
const OWNERS = new WeakMap<Object3D, Object3D>()
export function registerExpressionOwner(root: Object3D, figure: Object3D): void {
  OWNERS.set(root, figure)
}
function owner(root: Object3D) {
  return OWNERS.get(root) ?? root
}
export function setHumanExpression(root: Object3D, cue?: ExpressionCue): void {
  if (!cue) {
    ACTIVE.delete(owner(root))
    return
  }
  validateExpressionCue(cue)
  ACTIVE.set(owner(root), { ...cue, secondary: cue.secondary && { ...cue.secondary } })
}
export function setFrameExpression(root: Object3D, layer?: { expression?: ExpressionCue }): void {
  const cue = layer?.expression
  if (cue) {
    validateExpressionCue(cue)
    FRAME.set(root, cue)
  } else FRAME.delete(root)
}
export function validateExpressionCue(cue: ExpressionCue): void {
  if (!expressionDefinition(cue.id)) throw new Error(`Unknown expression: ${cue.id}`)
  if (cue.secondary && !expressionDefinition(cue.secondary.id))
    throw new Error(`Unknown secondary expression: ${cue.secondary.id}`)
  validateTimes(cue)
}
function validateTimes(cue: ExpressionCue) {
  for (const value of [cue.intensity, cue.start, cue.duration, cue.fade, cue.secondary?.weight])
    if (value !== undefined && !Number.isFinite(value))
      throw new Error('Expression values must be finite')
  if ((cue.duration ?? 0) < 0 || (cue.fade ?? 0) < 0)
    throw new Error('Expression times must be positive')
}
export function expressionEnvelope(cue: ExpressionCue, seconds: number): number {
  const elapsed = seconds - (cue.start ?? 0)
  if (elapsed < 0 || elapsed >= (cue.duration ?? Infinity)) return 0
  const fade = cue.fade ?? 0.12
  if (fade === 0) return 1
  return Math.max(0, Math.min(1, elapsed / fade, ((cue.duration ?? Infinity) - elapsed) / fade))
}
function clamp(value: number) {
  return Math.max(0, Math.min(1, value))
}
function animatedPose(id: string, elapsed: number): ExpressionPose | undefined {
  const definition = expressionDefinition(id)
  if (!definition) return
  const pose = { ...definition.pose }
  const wave = Math.sin(elapsed * 7)
  const rhythm = definition.rhythm
  if (rhythm === 'laugh') {
    pose.jaw += Math.max(0, wave) * 0.12
    pose.cheekRaise += wave * 0.04
  }
  if (rhythm === 'breath') pose.jaw += Math.max(0, Math.sin(elapsed * 3.2)) * 0.12
  if (pose.tremble > 0) {
    pose.headRoll += Math.sin(elapsed * 39) * pose.tremble * 0.012
    pose.mouthSkew += Math.sin(elapsed * 43) * pose.tremble * 0.035
  }
  if (pose.tears > 0.5 && pose.jaw > 0) {
    pose.jaw += Math.max(0, Math.sin(elapsed * 5.5)) * 0.1
    pose.headPitch += Math.sin(elapsed * 5.5) * 0.008
  }
  animateGaze(pose, id, elapsed)
  pose.eye *= 1 - blinkAmount(definition.blink, id, elapsed) * 0.94
  return pose
}
function animateGaze(pose: ExpressionPose, id: string, seconds: number) {
  if (id === 'regard/balayage-inquiet') pose.gaze = Math.sin(seconds * 3.2) * 0.011
  if (id === 'regard/fuyant') pose.gaze *= Math.sin(seconds * 1.8)
  if (id === 'destabilisation/regard-qui-cherche-a-se-fixer') {
    pose.gaze = Math.sin(seconds * 11) * 0.008
    pose.gazeY = Math.sin(seconds * 7.3) * 0.004
  }
}
function blinkAmount(rate: number, id: string, seconds: number) {
  if (id === 'paupieres/clignement-lent') return blinkPulse(seconds, 2.8, 0.7)
  if (id === 'paupieres/clignement-rapide') return blinkPulse(seconds, 0.8, 0.14)
  if (rate === 0) return 0
  return blinkPulse(seconds, 4.6 / rate, 0.18)
}
function blinkPulse(seconds: number, period: number, length: number) {
  const phase = ((seconds % period) + period) % period
  return phase < length ? Math.sin((phase / length) * Math.PI) ** 2 : 0
}
export function sampleExpression(cue: ExpressionCue, seconds: number): ExpressionPose | undefined {
  const envelope = expressionEnvelope(cue, seconds)
  if (envelope === 0) return
  const primary = animatedPose(cue.id, seconds - (cue.start ?? 0))
  if (!primary) return
  return mixExpression(primary, cue, { seconds, envelope })
}
function mixExpression(
  primary: ExpressionPose,
  cue: ExpressionCue,
  frame: { seconds: number; envelope: number },
) {
  const secondary =
    cue.secondary && animatedPose(cue.secondary.id, frame.seconds - (cue.start ?? 0))
  const weight = clamp(cue.secondary?.weight ?? 0)
  const amount = clamp(cue.intensity ?? 1) * frame.envelope
  for (const key of EXPRESSION_CONTROLS) {
    const mixed = secondary ? primary[key] * (1 - weight) + secondary[key] * weight : primary[key]
    primary[key] = EXPRESSION_REST[key] + (mixed - EXPRESSION_REST[key]) * amount
  }
  return primary
}
export function sampleHumanExpression(root: Object3D, seconds: number): ExpressionPose | undefined {
  const cue = FRAME.get(owner(root)) ?? ACTIVE.get(owner(root))
  return cue && sampleExpression(cue, seconds)
}
