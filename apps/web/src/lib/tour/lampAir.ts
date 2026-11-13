import type * as Three from 'three'

import type { TierPlan } from './blueprint'
import type { TierMesh } from './mesh'
import { roomConditionOf } from './roomCondition'

const vertexShader = /* glsl */ `
  attribute float aHaloSize;
  varying vec3 vHaloColour;
  varying float vHaloAlpha;

  void main() {
    vHaloColour = color;
    vHaloAlpha = clamp((aHaloSize - 8.0) / 34.0, 0.12, 1.0);
    vec4 view = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * view;
    gl_PointSize = clamp(aHaloSize * (180.0 / max(1.0, -view.z)), 5.0, 54.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uTint;
  varying vec3 vHaloColour;
  varying float vHaloAlpha;

  void main() {
    vec2 centred = gl_PointCoord * 2.0 - 1.0;
    float radius = dot(centred, centred);
    float veil = smoothstep(1.0, 0.0, radius) * (1.0 - smoothstep(0.0, 0.18, radius));
    gl_FragColor = vec4(vHaloColour * uTint, veil * vHaloAlpha * 0.22);
  }
`

export function createLampAirMaterial(
  THREE: typeof Three,
  enabled: boolean,
): Three.ShaderMaterial | null {
  if (!enabled) return null
  return new THREE.ShaderMaterial({
    uniforms: { uTint: { value: new THREE.Color(1, 1, 1) } },
    vertexShader,
    fragmentShader,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
  })
}

/** One soft point per already-derived ceiling fitting, batched for the whole deck. */
export function lampAirOf(options: {
  THREE: typeof Three
  mesh: TierMesh
  plan: TierPlan
  material: Three.ShaderMaterial | null
}): Three.Points | null {
  const { THREE, mesh, plan, material } = options
  if (!material) return null
  const positions: number[] = []
  const colours: number[] = []
  const sizes: number[] = []
  const byId = new Map(plan.spaces.map((space) => [space.id, space]))

  for (const group of mesh.groups) {
    const space = byId.get(group.spaceId)
    if (!space) continue
    const condition = roomConditionOf({ space, tier: plan.tier })
    // Every fitting is one non-indexed quad: six consecutive vertices.
    for (
      let vertex = group.fittingStart;
      vertex < group.fittingStart + group.fittingCount;
      vertex += 6
    ) {
      const end = Math.min(vertex + 6, group.fittingStart + group.fittingCount)
      let x = 0
      let y = 0
      let z = 0
      let red = 0
      let green = 0
      let blue = 0
      const count = end - vertex
      for (let each = vertex; each < end; each++) {
        const offset = each * 3
        x += mesh.fittings[offset]
        y += mesh.fittings[offset + 1]
        z += mesh.fittings[offset + 2]
        red += mesh.fittingColors[offset]
        green += mesh.fittingColors[offset + 1]
        blue += mesh.fittingColors[offset + 2]
      }
      positions.push(x / count, y / count - 0.025, z / count)
      colours.push(red / count, green / count, blue / count)
      sizes.push(8 + condition.airLoad * 34)
    }
  }

  if (!sizes.length) return null
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3))
  geometry.setAttribute('aHaloSize', new THREE.Float32BufferAttribute(sizes, 1))
  return new THREE.Points(geometry, material)
}
