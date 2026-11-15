import type * as Three from 'three'

import type { TierPlan } from './blueprint'
import type { TierMesh } from './mesh'
import { roomConditionOf } from './roomCondition'

const FLICKER_KEY = 'tourFittingFlicker'

export interface FittingFlickerUniforms {
  uFlickerTime: { value: number }
}

const vertexHead = /* glsl */ `
  attribute vec2 aFlicker;
  varying vec2 vFlicker;
`

const vertexBody = /* glsl */ `
  vFlicker = aFlicker;
`

const fragmentHead = /* glsl */ `
  uniform float uFlickerTime;
  varying vec2 vFlicker;
`

const fragmentBody = /* glsl */ `
  {
    float phase = vFlicker.x * 6.28318530718;
    float slow = sin(uFlickerTime * 2.7 + phase) * 0.5 + 0.5;
    float chatter = sin(uFlickerTime * 19.0 + phase * 3.7) * 0.5 + 0.5;
    float dropout = smoothstep(0.91, 0.995, chatter);
    float flicker = 1.0 - vFlicker.y * (0.10 + slow * 0.12 + dropout * 0.58);
    diffuseColor.rgb *= flicker;
  }
`

export function applyFittingFlicker(material: Three.Material): FittingFlickerUniforms {
  const uniforms = { uFlickerTime: { value: 0 } }
  material.userData[FLICKER_KEY] = uniforms
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
      .replace('#include <color_fragment>', `#include <color_fragment>\n${fragmentBody}`)
  }
  material.customProgramCacheKey = () => `${earlierKey?.call(material) ?? ''}|tour-flicker-v1`
  material.needsUpdate = true
  return uniforms
}

export function fittingFlickerUniformsOf(material: Three.Material): FittingFlickerUniforms | null {
  return (material.userData[FLICKER_KEY] as FittingFlickerUniforms | undefined) ?? null
}

const fixtureHash = (x: number, z: number): number => {
  const raw = Math.sin(x * 91.7 + z * 271.9) * 43758.5453
  return raw - Math.floor(raw)
}

/** Phase and dropout depth per fitting vertex, derived from existing room condition. */
export function fittingFlickerAttribute(mesh: TierMesh, plan: TierPlan): Float32Array {
  const values = new Float32Array((mesh.fittings.length / 3) * 2)
  const byId = new Map(plan.spaces.map((space) => [space.id, space]))
  for (const group of mesh.groups) {
    const space = byId.get(group.spaceId)
    if (!space) continue
    const condition = roomConditionOf({ space, tier: plan.tier })
    const instability = 1 - condition.ventilationStability
    const roomAmount = Math.min(1, Math.max(0, instability * 0.9 + condition.wear * 0.2 - 0.32))
    for (
      let vertex = group.fittingStart;
      vertex < group.fittingStart + group.fittingCount;
      vertex += 6
    ) {
      const offset = vertex * 3
      const hash = fixtureHash(mesh.fittings[offset], mesh.fittings[offset + 2])
      const amount = hash > 0.62 ? roomAmount * (0.55 + hash * 0.45) : 0
      const end = Math.min(vertex + 6, group.fittingStart + group.fittingCount)
      for (let each = vertex; each < end; each++) {
        values[each * 2] = hash
        values[each * 2 + 1] = amount
      }
    }
  }
  return values
}

/** The visible fitting changes; the vertex-baked light around it deliberately does not. */
export function bindFittingFlicker(mesh: Three.Mesh, material: Three.Material): void {
  const uniforms = fittingFlickerUniformsOf(material)
  if (!uniforms) return
  const earlier = mesh.onBeforeRender
  mesh.onBeforeRender = (...args) => {
    earlier?.apply(mesh, args)
    uniforms.uFlickerTime.value = performance.now() / 1000
  }
}
