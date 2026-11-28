import * as THREE from 'three'
import type { VictoryContext } from './types'
import type { VictoryJupiter } from './bonolenovJupiter'
import { disposeVictoryObject, ease } from './resources'
import timing from './bonolenovTiming.json'

function makeShadow() {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms: { coverage: { value: 0 } },
      vertexShader: `
        varying vec2 point;
        void main() {
          point = 2.0 * uv - 1.0;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float coverage;
        varying vec2 point;
        void main() {
          float shade = 1.0 - smoothstep(0.68, 1.0, length(point));
          gl_FragColor = vec4(0.025, 0.020, 0.027, shade * coverage);
        }
      `,
      depthWrite: false,
      transparent: true,
    }),
  )
  mesh.rotation.x = -Math.PI / 2
  mesh.renderOrder = 1
  return mesh
}

function makeImprint() {
  const segments = 32
  const positions: number[] = [0, 0, 0]
  const colours = [0.025, 0.018, 0.019]
  const indices: number[] = []
  const radius = [0.68, 0.81, 0.91, 1]
  const height = [0.018, 0.095, 0.17, 0]
  const palette = [0x292123, 0x52413b, 0x8c7868, 0x64584e].map((hex) => new THREE.Color(hex))
  for (let ring = 0; ring < radius.length; ring++) {
    for (let index = 0; index < segments; index++) {
      const angle = (index / segments) * Math.PI * 2
      const edge = 0.93 + Math.sin(index * 4.7) * 0.085
      positions.push(
        Math.cos(angle) * radius[ring] * edge * 1.34,
        height[ring] * (0.77 + Math.sin(index * 2.1) * 0.22),
        Math.sin(angle) * radius[ring] * edge * 1.12,
      )
      const base = index + 1 + ring * segments
      const next = ((index + 1) % segments) + 1 + ring * segments
      const tone = palette[ring].clone().multiplyScalar(0.87 + (index % 5) * 0.065)
      colours.push(tone.r, tone.g, tone.b)
      if (ring === 0) indices.push(0, next, base)
      else indices.push(base - segments, next - segments, base, base, next - segments, next)
    }
  }
  const shape = new THREE.BufferGeometry()
  shape.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  shape.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3))
  const level = positions.map((value, axis) => (axis % 3 === 1 ? 0.08 : value))
  shape.morphAttributes.position = [new THREE.Float32BufferAttribute(level, 3)]
  shape.setIndex(indices)
  return new THREE.Mesh(
    shape,
    new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }),
  )
}

function shadeRival(
  context: VictoryContext,
  strength: number,
  cache: Map<THREE.Material, THREE.Material>,
) {
  if (strength <= 0) return
  context.victim.root.traverseVisible((node) => {
    if (!(node instanceof THREE.Mesh)) return
    const shade = (source: THREE.Material) => {
      const original = source as THREE.MeshBasicMaterial
      if (!original.color) return source
      const material = (cache.get(source) ?? source.clone()) as THREE.MeshBasicMaterial
      cache.set(source, material)
      material.color.copy(original.color).multiplyScalar(1 - strength * 0.46)
      return material
    }
    context.material(
      node,
      Array.isArray(node.material) ? node.material.map(shade) : shade(node.material),
    )
  })
}

export function createBonolenovFloor() {
  const root = new THREE.Group()
  root.name = 'bonolenov-jupiter-imprint'
  const shadow = makeShadow()
  const imprint = makeImprint()
  imprint.name = 'bonolenov-sunken-slabs'
  const joint = new THREE.Mesh(
    new THREE.PlaneGeometry(0.038, 3.6),
    new THREE.MeshBasicMaterial({ color: 0x121217 }),
  )
  joint.rotation.x = -Math.PI / 2
  const shaded = new Map<THREE.Material, THREE.Material>()
  root.add(joint, imprint, shadow)

  return {
    root,
    sync(context: VictoryContext, planet: VictoryJupiter, impactX: number) {
      const { age } = context
      const depth = ease((age - timing.sink) / 16)
      imprint.visible = depth > 0
      imprint.position.set(impactX - 0.21, 0.023, 0)
      imprint.scale.set(depth, 1, depth)
      imprint.morphTargetInfluences![0] = 1 - depth
      joint.visible =
        context.state.environment.stageId !== 'heavens-arena' ||
        Boolean(context.state.stageTransition)
      joint.position.set(impactX - 0.57, 0.014, 0)
      const shadowX = planet.centre.x + planet.surfaceRadius * 0.6
      const shadowSize = planet.surfaceRadius * 0.97
      const coverage = planet.surfaceRadius / planet.radius
      shadow.visible = coverage > 0
      shadow.position.set(shadowX, 0.019, planet.centre.z)
      shadow.scale.set(shadowSize, shadowSize * 0.64, 1)
      shadow.material.uniforms.coverage.value = coverage * 0.76
      const rivalShadow =
        1 - ease((Math.abs(context.victim.root.position.x - shadowX) - shadowSize * 0.65) / 0.35)
      shadeRival(context, rivalShadow * coverage, shaded)
    },
    dispose() {
      disposeVictoryObject(root)
      shaded.forEach((material) => material.dispose())
      shaded.clear()
    },
  }
}
