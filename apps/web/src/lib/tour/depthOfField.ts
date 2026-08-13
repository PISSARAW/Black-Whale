/**
 * Depth of Field (Bokeh) pass.
 *
 * It uses the `BokehShader` from three.js but configured to read the existing
 * native depth texture (`tDepth`) instead of requiring the scene to be re-rendered
 * just for depth (by setting `DEPTH_PACKING` to 0).
 */
import type * as Three from 'three'
import type { PostPass } from './postTypes'

export interface DepthOfFieldPassOptions {
  camera: Three.PerspectiveCamera
  depth: Three.Texture
}

export async function createDepthOfFieldPass(options: DepthOfFieldPassOptions): Promise<PostPass> {
  const { camera, depth } = options

  const { ShaderPass } = await import('three/examples/jsm/postprocessing/ShaderPass.js')
  const { BokehShader } = await import('three/examples/jsm/shaders/BokehShader.js')

  // We clone the shader to modify its defines without mutating the global object.
  // Setting DEPTH_PACKING to 0 tells the shader that tDepth is a single-channel
  // native depth texture, not an RGBA-packed depth texture.
  const shader = {
    ...BokehShader,
    defines: {
      ...BokehShader.defines,
      DEPTH_PACKING: 0,
    },
  }

  const pass = new ShaderPass(shader)

  pass.uniforms.tDepth.value = depth
  // The distance from the camera to the focal plane.
  pass.uniforms.focus.value = 10.0
  pass.uniforms.aspect.value = camera.aspect
  // How wide the aperture is (more blur).
  pass.uniforms.aperture.value = 0.015
  // Cap the blur radius so it doesn't turn the screen into a single smudge.
  pass.uniforms.maxblur.value = 0.01
  pass.uniforms.nearClip.value = camera.near
  pass.uniforms.farClip.value = camera.far

  return pass
}
