import * as THREE from 'three'
import type { PostPass } from './postTypes'

const MotionBlurShader = {
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: null },
    clipToWorldMatrix: { value: new THREE.Matrix4() },
    prevWorldToClipMatrix: { value: new THREE.Matrix4() },
    velocityScale: { value: 1.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    uniform mat4 clipToWorldMatrix;
    uniform mat4 prevWorldToClipMatrix;
    uniform float velocityScale;

    varying vec2 vUv;

    void main() {
      // Get the native non-linear depth from the depth buffer
      float z = texture2D(tDepth, vUv).x;

      // Convert UV and Depth to NDC (Normalized Device Coordinates) [-1, 1]
      vec4 clipPos = vec4(vUv.x * 2.0 - 1.0, vUv.y * 2.0 - 1.0, z * 2.0 - 1.0, 1.0);

      // Reconstruct world position
      vec4 worldPos = clipToWorldMatrix * clipPos;
      worldPos /= worldPos.w;

      // Project into previous frame
      vec4 prevClipPos = prevWorldToClipMatrix * worldPos;
      prevClipPos /= prevClipPos.w;

      // Previous UV
      vec2 prevUv = prevClipPos.xy * 0.5 + 0.5;

      // Calculate velocity
      vec2 velocity = (vUv - prevUv) * velocityScale;

      // Cap velocity to prevent huge blurs if there's a camera cut/teleport
      float speed = length(velocity);
      if (speed > 0.05) {
        velocity = (velocity / speed) * 0.05;
      }

      // Sample along velocity vector (8 samples)
      vec4 color = texture2D(tDiffuse, vUv);
      vec2 offset = velocity / 8.0;
      
      for(float i = 1.0; i < 8.0; i++) {
        color += texture2D(tDiffuse, vUv - offset * i);
      }
      color /= 8.0;

      gl_FragColor = color;
    }
  `,
}

export interface MotionBlurPassOptions {
  camera: THREE.PerspectiveCamera
  depth: THREE.Texture
}

export interface MotionBlurPass extends PostPass {
  update: (camera: THREE.PerspectiveCamera, delta: number) => void
}

export async function createMotionBlurPass(
  options: MotionBlurPassOptions,
): Promise<MotionBlurPass> {
  const { ShaderPass } = await import('three/examples/jsm/postprocessing/ShaderPass.js')

  const pass = new ShaderPass(MotionBlurShader) as MotionBlurPass
  pass.uniforms.tDepth.value = options.depth

  const prevViewProj = new THREE.Matrix4()
  const currentViewProj = new THREE.Matrix4()

  // Initialize with the current matrices to avoid a huge blur on the first frame
  options.camera.updateMatrixWorld()
  prevViewProj.multiplyMatrices(options.camera.projectionMatrix, options.camera.matrixWorldInverse)

  pass.update = (camera: THREE.PerspectiveCamera, _delta: number) => {
    // Current frame's ViewProjection matrix
    currentViewProj.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)

    // Pass uniforms to the shader
    pass.uniforms.clipToWorldMatrix.value.copy(currentViewProj).invert()
    pass.uniforms.prevWorldToClipMatrix.value.copy(prevViewProj)

    // Scale velocity by delta to ensure consistent blur regardless of framerate
    // Assuming 60fps as baseline (1/60 ~ 0.016s).
    // We clamp delta to avoid huge blur on lag spikes.
    pass.uniforms.velocityScale.value = 1.0

    // Store current matrix as previous for the next frame
    prevViewProj.copy(currentViewProj)
  }

  return pass
}
