import { Group, Mesh, PlaneGeometry, ShaderMaterial, Vector2, Vector3 } from 'three'
import { ease } from './resources'
import {
  CAMILLA_EYES_OPEN,
  CAMILLA_PAW_LANDS,
  CAMILLA_REVEAL,
  CAMILLA_RISE,
  CAMILLA_TAIL_CHARGED,
} from './camillaTiming'
import type { VictoryContext } from './types'
import type { camillaVictoryPose } from './camillaPose'

export function createCamillaAtmosphere() {
  const root = new Group()
  root.name = 'camilla-atmosphere'
  const intensity = { value: 0 }
  const portrait = { value: 0 }
  const focus = { value: new Vector2() }
  const mist = new Mesh(
    new PlaneGeometry(13.5, 3.8),
    new ShaderMaterial({
      uniforms: { intensity, portrait },
      transparent: true,
      depthWrite: false,
      vertexShader: `
        varying vec2 screen;
        void main() {
          screen = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        varying vec2 screen;
        uniform float intensity;
        uniform float portrait;
        void main() {
          vec2 p = screen - vec2(0.54, 0.36);
          float light = exp(-dot(p * vec2(3.5, 2.55), p * vec2(3.5, 2.55)) * 2.5);
          float floor = smoothstep(0.03, 0.30, screen.y);
          float edge = smoothstep(0.04, 0.28, screen.x) * (1.0 - smoothstep(0.75, 0.98, screen.x));
          gl_FragColor = vec4(0.29, 0.37, 0.50, light * floor * edge * intensity * (1.0 - portrait));
        }`,
    }),
  )
  mist.position.set(0, 1.52, -0.93)
  root.add(mist)

  const mask = new Mesh(
    new PlaneGeometry(2, 2),
    new ShaderMaterial({
      uniforms: { focus, portrait },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      vertexShader: `
        varying vec2 screen;
        void main() {
          screen = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }`,
      fragmentShader: `
        varying vec2 screen;
        uniform vec2 focus;
        uniform float portrait;
        void main() {
          vec2 p = screen - mix(vec2(0.5), focus, 0.31);
          float edge = smoothstep(0.26, 0.70, length(p * vec2(1.0, 0.90)));
          float darkness = edge * (0.34 + 0.23 * portrait);
          gl_FragColor = vec4(0.020, 0.030, 0.068, darkness);
        }`,
    }),
  )
  mask.frustumCulled = false
  mask.renderOrder = 1000
  root.add(mask)

  return {
    sync(context: VictoryContext, pose: ReturnType<typeof camillaVictoryPose>) {
      if (context.comfort.highContrast) return
      const { age, centre, camera } = context
      intensity.value = 0.15 + 0.3 * ease((age - CAMILLA_PAW_LANDS + 14) / 45)
      portrait.value =
        ease((age - CAMILLA_EYES_OPEN + 15) / 22) * (1 - ease((age - CAMILLA_RISE) / 28))
      mist.position.x = centre + 0.8
      mist.visible = age < CAMILLA_TAIL_CHARGED
      const subject = new Vector3(centre - 0.05, 0.92, 0.18)
      if (age >= CAMILLA_REVEAL) subject.set(pose.catX, 1.72 * pose.ratio, 0.23)
      if (age >= CAMILLA_TAIL_CHARGED) subject.copy(pose.lips)
      subject.project(camera)
      focus.value.set(0.5 + subject.x * 0.5, 0.5 + subject.y * 0.5)
      context.add(root)
    },
    dispose() {
      root.removeFromParent()
      for (const mesh of [mist, mask]) {
        mesh.geometry.dispose()
        mesh.material.dispose()
      }
    },
  }
}
