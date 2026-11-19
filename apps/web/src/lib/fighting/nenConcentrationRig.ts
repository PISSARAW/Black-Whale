import type { Object3D, Mesh, ShaderMaterial } from 'three'
import type { FightNenZone } from './types'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { concentrationShare, type AuraConcentration } from './nenConcentration'

type Three = typeof import('three')
interface Region {
  zone: FightNenZone
  limb?: 'left' | 'right'
  anchor: Object3D
  material: ShaderMaterial
  meshes: Mesh[]
  path: Object3D[]
}

const vertexShader = `
uniform float u_thickness;
varying vec3 vNormal;
varying vec3 vEye;
varying float vAlong;
void main() {
  vec4 world = modelMatrix * vec4(position + normal * u_thickness, 1.0);
  vNormal = normalize(mat3(modelMatrix) * normal);
  vEye = normalize(cameraPosition - world.xyz);
  vAlong = position.y;
  gl_Position = projectionMatrix * viewMatrix * world;
}`
const fragmentShader = `
uniform vec3 u_colour;
uniform float u_share;
uniform float u_time;
uniform float u_strength;
varying vec3 vNormal;
varying vec3 vEye;
varying float vAlong;
void main() {
  float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vEye))), 1.35);
  float flow = 0.84 + 0.16 * sin(vAlong * 30.0 + u_time * 12.0);
  gl_FragColor = vec4(u_colour, rim * (0.16 + u_share * 0.72) * flow * u_strength);
}`

/** Reuse the posed body's geometry, so a reinforced fist remains a fist, including side switches. */
export function createNenConcentrationRig(THREE: Three, figure: Object3D, colour: number) {
  const regions: Region[] = []
  const suppressed: Array<{ node: Object3D; visible: boolean }> = []
  figure.traverse((node) => {
    if (/^nen-(skin-|visitor-|ko-|ryu-)/.test(node.name))
      suppressed.push({ node, visible: node.visible })
  })
  const add = (
    zone: FightNenZone,
    parts: { anchor?: Object3D; shapes: Object3D[]; limb?: 'left' | 'right' },
  ) => {
    if (!parts.anchor) return
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_colour: { value: new THREE.Color(colour) },
        u_share: { value: 0 },
        u_thickness: { value: 0 },
        u_time: { value: 0 },
        u_strength: { value: 1 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const meshes = parts.shapes.flatMap((part) => {
      const body = firstBodyMesh(part)
      if (!body) return []
      const shell = new THREE.Mesh(body.geometry, material)
      shell.name = `nen-concentration:${zone}:${parts.limb ?? 'centre'}`
      shell.renderOrder = 3
      body.add(shell)
      return [shell]
    })
    regions.push({
      zone,
      limb: parts.limb,
      anchor: parts.anchor,
      material,
      meshes,
      path: flowPath(figure, parts.anchor, { zone, limb: parts.limb }),
    })
  }
  const anatomy = humanAnimationRig(figure)
  const torso = anatomy?.torso ?? figure.getObjectByName('torso')
  const head = anatomy?.head
  add('torso', { anchor: torso, shapes: torso ? [torso] : [] })
  add('head', { anchor: head, shapes: head ? [head] : [] })
  for (const limb of ['left', 'right'] as const) {
    const hand = figure.getObjectByName(`hand-${limb}`)
    const elbow = figure.getObjectByName(`elbow-${limb}`)
    const knee = figure.getObjectByName(`knee-${limb}`)
    add('hands', { anchor: hand, limb, shapes: [elbow?.children[0], hand].filter(defined) })
    add('feet', { anchor: knee?.children[1], limb, shapes: knee ? knee.children.slice(0, 2) : [] })
  }
  return {
    regions,
    torso,
    sync(
      concentration: AuraConcentration | null,
      seconds: number,
      timing: { strength: number; age: number; travelFrames: number },
    ) {
      const { strength, age, travelFrames } = timing
      const arrival = 0.35 + 0.65 * Math.min(1, Math.max(0, age / travelFrames))
      const thickness = concentration?.technique === 'ko' ? 0.095 : 0.07
      for (const item of suppressed) item.node.visible = concentration ? false : item.visible
      for (const region of regions) {
        const share = concentration ? concentrationShare(concentration, region) : 0
        region.meshes.forEach((mesh) => {
          mesh.visible = Boolean(concentration && share > 0 && strength > 0)
        })
        region.material.uniforms.u_share.value = share
        region.material.uniforms.u_thickness.value = 0.012 + share * thickness * arrival
        region.material.uniforms.u_time.value = seconds
        region.material.uniforms.u_strength.value = strength
      }
    },
    dispose() {
      for (const item of suppressed) item.node.visible = item.visible
      for (const region of regions) {
        region.meshes.forEach((mesh) => mesh.removeFromParent())
        region.material.dispose()
      }
    },
  }
}

function defined<T>(value: T | undefined): value is T {
  return value !== undefined
}

function flowPath(figure: Object3D, target: Object3D, region: Pick<Region, 'zone' | 'limb'>) {
  const middle =
    region.zone === 'hands'
      ? [`shoulder-${region.limb}`, `elbow-${region.limb}`]
      : [`hip-${region.limb}`, `knee-${region.limb}`]
  const source = region.zone === 'feet' ? ['torso', 'pelvis'] : ['torso']
  const names = region.limb
    ? [...source, ...middle]
    : [region.zone === 'torso' ? 'pelvis' : 'torso']
  return [...names.map((name) => figure.getObjectByName(name)).filter(defined), target]
}

function firstBodyMesh(node: Object3D): Mesh | undefined {
  if (node.name.startsWith('nen-')) return undefined
  if ((node as Mesh).isMesh) return node as Mesh
  for (const child of node.children) {
    const found = firstBodyMesh(child)
    if (found) return found
  }
  return undefined
}
