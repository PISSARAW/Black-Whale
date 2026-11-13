import type * as Three from 'three'

import { floorOf, type TierPlan } from './blueprint'
import { distanceToBoundary } from './geometry'
import type { TierMesh } from './mesh'
import { roomConditionOf, type RoomCondition } from './roomCondition'
import type { Space } from './types'

const CONDITION_KEY = 'tourSurfaceCondition'
const TRAFFIC_REACH = 1.8

export interface SurfaceConditionUniforms {
  uRoomWear: { value: number }
  uRoomSoil: { value: number }
  uRoomFloor: { value: number }
}

const vertexHead = /* glsl */ `
  attribute float aTraffic;
  varying float vTraffic;
  varying vec3 vConditionPosition;
  varying vec3 vConditionNormal;
`

const vertexBody = /* glsl */ `
  vTraffic = aTraffic;
  vConditionPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
  vConditionNormal = normalize(mat3(modelMatrix) * objectNormal);
`

const fragmentHead = /* glsl */ `
  uniform float uRoomWear;
  uniform float uRoomSoil;
  uniform float uRoomFloor;
  varying float vTraffic;
  varying vec3 vConditionPosition;
  varying vec3 vConditionNormal;

  float conditionHash(vec2 point) {
    return fract(sin(dot(floor(point), vec2(91.7, 271.9))) * 43758.5453);
  }
`

/** Dirt changes the existing albedo; it never adds light or a new material. */
const colourBody = /* glsl */ `
  {
    vec3 conditionNormal = normalize(vConditionNormal);
    float floorFace = smoothstep(0.62, 0.9, conditionNormal.y);
    float wallFace = smoothstep(0.62, 0.9, 1.0 - abs(conditionNormal.y));
    float atWallFoot = exp(-max(0.0, vConditionPosition.y - uRoomFloor) * 3.6) * wallFace;
    float atFloorEdge = (1.0 - vTraffic) * floorFace;
    float patches = 0.62 + conditionHash(vConditionPosition.xz * 2.3) * 0.38;
    float residue = clamp((atWallFoot + atFloorEdge * 0.72) * patches, 0.0, 1.0);
    diffuseColor.rgb *= 1.0 - residue * uRoomSoil * 0.24;

    // A used route is smoother than its edges. This is a tiny value lift, not a
    // colour: the room keeps the light and palette already baked into it.
    float polish = floorFace * vTraffic * uRoomWear;
    diffuseColor.rgb *= 1.0 + polish * 0.045;
  }
`

/** A clean finish is continuous at a glance; soil breaks it into oily islands. */
const finishBody = /* glsl */ `
  {
    vec3 conditionNormal = normalize(normal);
    float facing = clamp(dot(conditionNormal, normalize(vViewPosition)), 0.0, 1.0);
    float grazing = pow(1.0 - facing, 5.0);
    float breakup = mix(1.0, 0.35 + conditionHash(vConditionPosition.xz * 1.7) * 0.65, uRoomSoil);
    outgoingLight *= 1.0 + grazing * (0.05 + uRoomWear * 0.08) * breakup;
  }
`

export function surfaceConditionUniforms(): SurfaceConditionUniforms {
  return {
    uRoomWear: { value: 0 },
    uRoomSoil: { value: 0 },
    uRoomFloor: { value: 0 },
  }
}

/** Adds the room-state hook after the existing steel grain hook. */
export function applySurfaceCondition(material: Three.Material): SurfaceConditionUniforms {
  const uniforms = surfaceConditionUniforms()
  material.userData[CONDITION_KEY] = uniforms
  const earlier = material.onBeforeCompile
  const earlierKey = material.customProgramCacheKey
  material.onBeforeCompile = (shader, renderer) => {
    earlier?.call(material, shader, renderer)
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${vertexHead}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n${vertexBody}`)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${fragmentHead}`)
      .replace('#include <color_fragment>', `#include <color_fragment>\n${colourBody}`)
      .replace('#include <opaque_fragment>', `${finishBody}\n#include <opaque_fragment>`)
  }
  material.customProgramCacheKey = () => `${earlierKey?.call(material) ?? ''}|tour-condition-v1`
  material.needsUpdate = true
  return uniforms
}

export function conditionUniformsOf(material: Three.Material): SurfaceConditionUniforms | null {
  return (material.userData[CONDITION_KEY] as SurfaceConditionUniforms | undefined) ?? null
}

/**
 * One normalized byte per surface vertex: zero at a wall, one in the travelled
 * middle. Built beside TierView from existing draw ranges, never in mesh.ts.
 */
export function trafficAttribute(mesh: TierMesh, plan: TierPlan): Uint8Array {
  const traffic = new Uint8Array(mesh.positions.length / 3)
  const byId = new Map(plan.spaces.map((space) => [space.id, space]))
  for (const group of mesh.groups) {
    const space = byId.get(group.spaceId)
    if (!space) continue
    const end = group.start + group.count
    for (let vertex = group.start; vertex < end; vertex++) {
      const offset = vertex * 3
      const distance = distanceToBoundary(
        [mesh.positions[offset], mesh.positions[offset + 2]],
        space.footprint,
      )
      traffic[vertex] = Math.round(Math.min(1, Math.max(0, distance / TRAFFIC_REACH)) * 255)
    }
  }
  return traffic
}

/** Writes shared uniforms immediately before this room's draw call. */
export function bindSurfaceCondition(options: {
  mesh: Three.Mesh
  material: Three.Material
  condition: RoomCondition | null
  floor: number
}): void {
  const uniforms = conditionUniformsOf(options.material)
  if (!uniforms) return
  options.mesh.onBeforeRender = () => {
    uniforms.uRoomWear.value = options.condition?.wear ?? 0
    uniforms.uRoomSoil.value = options.condition?.soil ?? 0
    uniforms.uRoomFloor.value = options.floor
  }
}

export const roomFloorForCondition = (plan: TierPlan, spaceId: string): number => {
  const space = plan.spaces.find((candidate) => candidate.id === spaceId)
  return space ? floorOf(space, plan.tier) : plan.tier.elevation
}

/** Creates the room mesh and binds its per-draw state when the high shader exists. */
export function conditionedRoomSurface(options: {
  THREE: typeof Three
  geometry: Three.BufferGeometry
  material: Three.Material
  space: Space | undefined
  plan: TierPlan | undefined
  reveal: boolean
}): Three.Mesh {
  const { THREE, geometry, material, space, plan, reveal } = options
  const mesh = new THREE.Mesh(geometry, material)
  if (!space || !plan) return mesh
  bindSurfaceCondition({
    mesh,
    material,
    condition: reveal ? null : roomConditionOf({ space, tier: plan.tier }),
    floor: roomFloorForCondition(plan, space.id),
  })
  return mesh
}
