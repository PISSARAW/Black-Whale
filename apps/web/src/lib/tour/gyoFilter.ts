/**
 * Post-processing pass for the "Gyo" (Nen Vision) mode.
 * Desaturates the environment and deepens the blacks to highlight the emissive Nen elements.
 */
import type { PostPass } from './postTypes'

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D tDiffuse;
  varying vec2 vUv;

  const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

  void main() {
    vec4 texel = texture2D(tDiffuse, vUv);
    
    // Calculate the brightness of the pixel
    float luma = dot(texel.rgb, LUMA);

    // Isolate high-intensity pixels (aura bloom and light sources)
    float glowMask = smoothstep(0.6, 1.2, luma);
    
    // The environment becomes a very dark, low-contrast monochrome 
    vec3 environment = vec3(luma * 0.25);
    
    // Mix the dark environment with the original vibrant color for emissive parts
    vec3 finalColor = mix(environment, texel.rgb, glowMask);

    gl_FragColor = vec4(finalColor, texel.a);
  }
`

export const GYO_SHADER = {
  uniforms: {
    tDiffuse: { value: null }
  },
  vertexShader,
  fragmentShader
}

export async function createGyoPass(): Promise<PostPass> {
  const { ShaderPass } = await import('three/examples/jsm/postprocessing/ShaderPass.js')
  const pass = new ShaderPass(GYO_SHADER)
  pass.enabled = false // Disabled by default
  return pass as unknown as PostPass
}
