import type * as Three from 'three'
import type { Vec2 } from './types'

export interface PortalPane {
  id: string
  pane: Three.Mesh
  pair: { at: Vec2; y: number }
}

/** Owns every GPU resource and render pass used by Nen portals. */
export class PortalRenderer {
  readonly #targets = new Map<string, Three.WebGLRenderTarget>()
  readonly #camera: Three.PerspectiveCamera

  constructor(
    private readonly THREE: typeof Three,
    private readonly options: {
      renderer: Three.WebGLRenderer
      scene: Three.Scene
      viewDistance: number
    },
  ) {
    this.#camera = new THREE.PerspectiveCamera(50, 1, 0.1, options.viewDistance)
  }

  private get renderer(): Three.WebGLRenderer {
    return this.options.renderer
  }
  private get scene(): Three.Scene {
    return this.options.scene
  }

  targets(): Iterable<Three.WebGLRenderTarget> {
    return this.#targets.values()
  }

  target(id: string): Three.WebGLRenderTarget {
    const held = this.#targets.get(id)
    if (held) return held
    const { width, height } = this.renderer.getSize(new this.THREE.Vector2())
    const made = new this.THREE.WebGLRenderTarget(
      Math.max(2, Math.round(width)),
      Math.max(2, Math.round(height)),
    )
    this.#targets.set(id, made)
    return made
  }

  material(id: string): Three.ShaderMaterial {
    return new this.THREE.ShaderMaterial({
      uniforms: { pane: { value: this.target(id).texture } },
      vertexShader: `
        varying vec4 vClip;
        void main() {
          vClip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_Position = vClip;
        }
      `,
      fragmentShader: `
        uniform sampler2D pane;
        varying vec4 vClip;
        void main() {
          vec2 uv = (vClip.xy / vClip.w) * 0.5 + 0.5;
          gl_FragColor = texture2D(pane, uv);
        }
      `,
      side: this.THREE.DoubleSide,
    })
  }

  render(portals: readonly PortalPane[], viewpoint: Three.PerspectiveCamera): void {
    if (!portals.length) return
    for (const portal of portals) portal.pane.visible = false
    for (const portal of portals) {
      this.#camera.fov = viewpoint.fov
      this.#camera.aspect = viewpoint.aspect
      this.#camera.updateProjectionMatrix()
      this.#camera.position.set(portal.pair.at[0], portal.pair.y, portal.pair.at[1])
      this.#camera.quaternion.copy(viewpoint.quaternion)
      this.renderer.setRenderTarget(this.target(portal.id))
      this.renderer.clear()
      this.renderer.render(this.scene, this.#camera)
      this.renderer.setRenderTarget(null)
    }
    for (const portal of portals) portal.pane.visible = true
  }

  drop(id: string): void {
    this.#targets.get(id)?.dispose()
    this.#targets.delete(id)
  }

  dispose(): void {
    for (const target of this.#targets.values()) target.dispose()
    this.#targets.clear()
  }
}
