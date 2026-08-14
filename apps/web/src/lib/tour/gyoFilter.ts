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
    
    // Calculate brightness from the incoming frame.
    float luma = dot(texel.rgb, LUMA);

    // Keep the world readable: retain a lifted monochrome floor so Gyo does
    // not collapse dark decks into full black.
    float lifted = max(luma, 0.08);
    vec3 environment = vec3(pow(lifted, 0.75) * 0.55);

    // Isolate brighter Nen cues and light sources while leaving low/mid tones
    // mostly in monochrome.
    float glowMask = smoothstep(0.22, 0.95, luma);

    // Preserve color where Nen effects are bright enough to stand out.
    vec3 finalColor = mix(environment, texel.rgb, glowMask);

    // Panic fallback: if a pixel is still near-black after the filter, recover
    // a guarded part of the source so the scene never collapses into void.
    float panic = 1.0 - smoothstep(0.02, 0.10, luma);
    vec3 guardedSource = texel.rgb * 0.85 + vec3(0.03);
    finalColor = mix(finalColor, guardedSource, panic * 0.75);

    gl_FragColor = vec4(finalColor, texel.a);
  }
`

export const GYO_SHADER = {
  uniforms: {
    tDiffuse: { value: null },
  },
  vertexShader,
  fragmentShader,
}

export async function createGyoPass(): Promise<PostPass> {
  const { ShaderPass } = await import('three/examples/jsm/postprocessing/ShaderPass.js')
  const pass = new ShaderPass(GYO_SHADER)
  pass.enabled = false // Disabled by default
  return pass as unknown as PostPass
}
