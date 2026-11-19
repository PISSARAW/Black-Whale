import type { BufferGeometry, Mesh, Object3D, ShaderMaterial } from 'three'
import type { AuraPsychology } from './nenPsychology'

export interface RenExpression {
  pressure: number
  stability: number
  intent: number
}

type RenShell = Mesh<BufferGeometry, ShaderMaterial>
const shells = new WeakMap<Object3D, RenShell | null>()

/** Map simulation values onto bounded shader controls without changing aura colour or shape. */
export function renExpression(psychology: AuraPsychology): RenExpression {
  return {
    pressure: clamp01(psychology.pressure / 100),
    stability: clamp01(psychology.stability),
    intent: clamp01(psychology.intent),
  }
}

/**
 * Give a shared Ren material per-fighter values immediately before its draw.
 * The callback is essential: writing once here would make the last fighter's
 * psychology leak onto every mesh sharing the material.
 */
export function syncRenExpression(root: Object3D, psychology: AuraPsychology): void {
  let shell = shells.get(root)
  if (shell === undefined) {
    shell = (root.getObjectByName('nen-visitor-ren') as RenShell | undefined) ?? null
    if (shell) {
      const bound = shell
      bound.onBeforeRender = () => {
        const expression = bound.userData.renExpression as RenExpression
        bound.material.uniforms.u_renPressure.value = expression.pressure
        bound.material.uniforms.u_renStability.value = expression.stability
        bound.material.uniforms.u_renIntent.value = expression.intent
        bound.material.uniforms.u_opacity.value = 0.22 + Math.pow(expression.pressure, 1.3) * 0.78
      }
    }
    shells.set(root, shell)
  }
  if (!shell) return
  const expression = renExpression(psychology)
  shell.userData.renExpression = expression
  // Pressure must read in the silhouette, not only in animated shader noise.
  // A contained Ren stays close to the body; a dominant one occupies the room.
  const blaze =
    clamp01((expression.pressure - 0.7) / 0.3) *
    expression.stability *
    (1 - expression.intent * 0.65)
  const width = 0.68 + Math.pow(expression.pressure, 1.3) * 0.62 + blaze * 0.08
  const height = 0.78 + Math.pow(expression.pressure, 1.6) * 0.6 + blaze * 0.35
  shell.scale.set(width, height, width)
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}
