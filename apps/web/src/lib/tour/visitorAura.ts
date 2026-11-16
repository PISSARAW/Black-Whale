import { NEN_PRESENTATION } from '@black-whale/nen-engine'
import type { ShaderMaterial } from 'three'
import { onFragmentShader, onVertexShader, renFragmentShader, renVertexShader } from './auraShaders'

type Three = typeof import('three')
export type VisitorAuraTechnique = 'ren' | 'on'

/** The visitor's envelope, shared by the first-person visit and fighting rigs. */
export function visitorAuraGeometry(THREE: Three) {
  const geometry = new THREE.CylinderGeometry(0.7, 0.9, 2.4, 32, 32, true)
  geometry.translate(0, 1.2, 0)
  return geometry
}

export function visitorAuraMaterial(THREE: Three, technique: VisitorAuraTechnique) {
  const on = technique === 'on'
  const colours = NEN_PRESENTATION[technique].colours
  return new THREE.ShaderMaterial({
    vertexShader: on ? onVertexShader : renVertexShader,
    fragmentShader: on ? onFragmentShader : renFragmentShader,
    uniforms: {
      u_time: { value: 0 },
      u_colorCore: { value: new THREE.Color(colours[0]) },
      u_colorEdge: { value: new THREE.Color(colours[1] || colours[0]) },
      u_opacity: { value: 0.8 },
      ...(on ? { u_intensityMultiplier: { value: 1 } } : {}),
    },
    transparent: true,
    premultipliedAlpha: on,
    depthWrite: false,
    blending: on ? THREE.MultiplyBlending : THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  })
}

const figureMaterials = new WeakMap<Three, Map<VisitorAuraTechnique, ShaderMaterial>>()

/** Like human aura skins, rigs share two materials and animate one scene clock. */
export function sharedVisitorAuraMaterial(THREE: Three, technique: VisitorAuraTechnique) {
  let materials = figureMaterials.get(THREE)
  if (!materials) {
    materials = new Map()
    figureMaterials.set(THREE, materials)
  }
  let material = materials.get(technique)
  if (!material) {
    material = visitorAuraMaterial(THREE, technique)
    materials.set(technique, material)
  }
  return material
}
