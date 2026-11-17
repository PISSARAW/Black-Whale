import type * as Three from 'three'
import { fightGraphics, type FightGraphics } from './fightGraphics'

export function createFightRenderer(
  THREE: typeof Three,
  canvas: HTMLCanvasElement,
  graphics?: FightGraphics,
) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: fightGraphics(graphics).antialias,
    powerPreference: 'high-performance',
  })
  renderer.setClearColor(0x05090d, 1)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  return renderer
}

/** Own the canvas and temporary pools, including cancellation during async stage loading. */
export function createFightRenderResources(
  THREE: typeof Three,
  canvas: HTMLCanvasElement,
  graphics?: FightGraphics,
) {
  const renderer = createFightRenderer(THREE, canvas, graphics)
  const materials: Array<[string, Three.MeshBasicMaterial]> = []
  const geometries: Three.BufferGeometry[] = []
  let released = false
  return {
    renderer,
    glow(colour: number, opacity: number) {
      const key = `${colour}:${opacity}`
      const held = materials.find(([candidate]) => candidate === key)?.[1]
      if (held) return held
      const material = new THREE.MeshBasicMaterial({
        color: colour,
        opacity,
        transparent: opacity < 1,
        depthWrite: opacity >= 1,
      })
      materials.push([key, material])
      return material
    },
    geometry<T extends Three.BufferGeometry>(made: T): T {
      geometries.push(made)
      return made
    },
    dispose() {
      materials.splice(0).forEach(([, material]) => material.dispose())
      geometries.splice(0).forEach((item) => item.dispose())
      if (released) return
      released = true
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}

export async function createFightPost(options: {
  THREE: typeof Three
  renderer: Three.WebGLRenderer
  scene: Three.Scene
  camera: Three.Camera
  bloom?: boolean
  graphics?: FightGraphics
}) {
  const profile = fightGraphics(options.graphics)
  if (!options.bloom || !profile.bloom) return null
  const { createStagePost } = await import('./stagePost')
  return createStagePost({ ...options, samples: profile.samples })
}
