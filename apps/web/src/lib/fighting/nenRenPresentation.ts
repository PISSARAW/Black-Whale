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
      }
    }
    shells.set(root, shell)
  }
  if (!shell) return
  shell.userData.renExpression = renExpression(psychology)
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}
