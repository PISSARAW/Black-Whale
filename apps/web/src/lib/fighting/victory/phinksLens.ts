import {
  DepthTexture,
  HalfFloatType,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderTarget,
} from 'three'
import type { PerspectiveCamera, WebGLRenderer } from 'three'

export interface PhinksFocus {
  distance: number
  aperture: number
  age: number
}

export function createPhinksLens(renderer: WebGLRenderer) {
  const target = new WebGLRenderTarget(1, 1, {
    type: HalfFloatType,
    depthTexture: new DepthTexture(1, 1),
  })
  const size = new Vector2()
  const uniforms = {
    plate: { value: target.texture },
    depth: { value: target.depthTexture },
    resolution: { value: size },
    nearClip: { value: 0.1 },
    farClip: { value: 100 },
    focus: { value: 3 },
    aperture: { value: 0 },
    grainTime: { value: 0 },
  }
  const material = new ShaderMaterial({
    uniforms,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    vertexShader: `
      varying vec2 plateUv;
      void main() {
        plateUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 plateUv;
      uniform sampler2D plate;
      uniform sampler2D depth;
      uniform vec2 resolution;
      uniform float nearClip, farClip, focus, aperture, grainTime;
      #include <packing>
      void main() {
        vec2 uv = plateUv;
        float metres = -perspectiveDepthToViewZ(texture2D(depth, uv).r, nearClip, farClip);
        float separation = abs(metres - focus) / max(metres, 0.1);
        float radius = smoothstep(0.035, 0.68, separation) * aperture;
        vec3 colour = texture2D(plate, uv).rgb;
        if (radius > 0.7) {
          vec3 blur = colour * 2.0;
          vec2 stepSize = radius / resolution;
          for (int tap = 0; tap < 8; tap++) {
            float angle = float(tap) * 0.785398;
            vec2 offset = vec2(cos(angle), sin(angle)) * stepSize;
            blur += texture2D(plate, uv + offset).rgb;
            blur += texture2D(plate, uv + offset * 0.47).rgb;
          }
          colour = blur / 18.0;
        }
        float vignette = smoothstep(0.23, 0.76, length((uv - 0.5) * vec2(1.0, 0.75)));
        float luma = dot(colour, vec3(0.2126, 0.7152, 0.0722));
        colour = mix(vec3(luma), colour, 0.88);
        colour /= 1.0 + max(0.0, luma - 0.65) * 0.56;
        colour *= vec3(1.035, 0.985, 1.015) * (1.0 - vignette * 0.30);
        float seed = fract(sin(dot(gl_FragCoord.xy + grainTime, vec2(12.9898, 78.233))) * 43758.5453);
        colour += (seed - 0.5) * 0.014 * smoothstep(0.01, 0.24, luma);
        gl_FragColor = vec4(max(colour, 0.0), 1.0);
        #include <colorspace_fragment>
      }
    `,
  })
  const geometry = new PlaneGeometry(2, 2)
  const quad = new Mesh(geometry, material)
  quad.frustumCulled = false
  const screen = new Scene()
  screen.add(quad)
  const screenCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  return {
    render(scene: Scene, camera: PerspectiveCamera, lens: PhinksFocus) {
      renderer.getDrawingBufferSize(size)
      if (size.x !== target.width || size.y !== target.height) target.setSize(size.x, size.y)
      uniforms.nearClip.value = camera.near
      uniforms.farClip.value = camera.far
      uniforms.focus.value = lens.distance
      uniforms.aperture.value = (lens.aperture * size.y) / 1080
      uniforms.grainTime.value = Math.floor(lens.age * 0.5)
      const previous = renderer.getRenderTarget()
      try {
        renderer.setRenderTarget(target)
        renderer.clear()
        renderer.render(scene, camera)
      } finally {
        renderer.setRenderTarget(previous)
      }
      renderer.render(screen, screenCamera)
    },
    dispose() {
      target.dispose()
      material.dispose()
      geometry.dispose()
    },
  }
}
