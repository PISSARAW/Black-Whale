/**
 * Ten, Ren and Ken as a skin of aura on the body, not a bubble around it.
 *
 * The 2011 anime draws a held aura as a thin layer that follows the silhouette
 * and rises off it like heat — never as a sphere. The walk used ellipsoids,
 * which read as a force field, and which made Ten and Ken differ only in
 * opacity: the one thing a visitor sneaking past a guard needs to read.
 *
 * So the skin is the body itself, inflated along its normals and lit at the
 * rim. Every mesh of the figure gets a sibling sharing its geometry, parented
 * to the same limb, so the aura follows the walk cycle and the pose for free.
 * The three levels differ in what a reader can tell apart at a distance:
 *
 * - **Ten** — a thin rim, slow rise. A body holding its own aura.
 * - **Ren** — a thicker rim, faster rise, brighter. Paired with the flames.
 * - **Ken** — the thickest and steadiest layer: Ren held as armour, so it
 *   covers the body evenly instead of flickering upward.
 *
 * The material is shared per colour and level and animated by one uniform the
 * aura loop sets, so a deck full of guards costs one write a frame.
 */
import type { Group, Mesh, Object3D, ShaderMaterial } from 'three'

type Three = typeof import('three')

export type SkinLevel = 'ten' | 'ren' | 'ken'

/** How each level reads: inflation in body units, rim strength, rise speed. */
const LEVELS: Record<SkinLevel, { inflate: number; opacity: number; flow: number; band: number }> =
  {
    ten: { inflate: 0.018, opacity: 0.32, flow: 1.6, band: 0.35 },
    ren: { inflate: 0.038, opacity: 0.55, flow: 3.2, band: 0.45 },
    ken: { inflate: 0.06, opacity: 0.7, flow: 0.8, band: 0.12 },
  }

/** One clock for every skin aboard: the aura loop writes it, the shader reads it. */
export const SKIN_TIME = { value: 0 }

const vertexShader = /* glsl */ `
  uniform float u_inflate;
  varying float vRim;
  varying float vY;
  void main() {
    vec4 world = modelMatrix * vec4(position + normal * u_inflate, 1.0);
    vY = world.y;
    vec3 n = normalize(mat3(modelMatrix) * normal);
    vec3 toEye = normalize(cameraPosition - world.xyz);
    vRim = 1.0 - abs(dot(n, toEye));
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

// The rise is a band of brightness travelling up the body. `u_band` is how much
// of the light it carries: most of a Ren, almost none of a Ken.
const fragmentShader = /* glsl */ `
  uniform vec3 u_colour;
  uniform float u_opacity;
  uniform float u_time;
  uniform float u_flow;
  uniform float u_band;
  varying float vRim;
  varying float vY;
  void main() {
    float rim = pow(vRim, 1.6);
    float rise = 1.0 - u_band + u_band * (0.5 + 0.5 * sin(vY * 11.0 - u_time * u_flow));
    gl_FragColor = vec4(u_colour, u_opacity * rim * rise);
  }
`

const materials = new Map<string, ShaderMaterial>()

function skinMaterial(THREE: Three, colour: number, level: SkinLevel): ShaderMaterial {
  const key = `${level}:${colour}`
  const cached = materials.get(key)
  if (cached) return cached
  const { inflate, opacity, flow, band } = LEVELS[level]
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      u_colour: { value: new THREE.Color(colour) },
      u_opacity: { value: opacity },
      u_inflate: { value: inflate },
      u_flow: { value: flow },
      u_band: { value: band },
      u_time: SKIN_TIME,
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  materials.set(key, material)
  return material
}

/**
 * Below this radius, in body units, a mesh is a detail and not the silhouette.
 *
 * Eyes, buttons, seams and stitching are a third of a figure's meshes and none
 * of its outline: wrapping them would double the draw calls of every Nen user
 * aboard for a rim nobody can see past a few metres.
 */
const SILHOUETTE_RADIUS = 0.11

function radiusOf(mesh: Mesh): number {
  const geometry = mesh.geometry
  if (!geometry.boundingSphere) geometry.computeBoundingSphere()
  const scale = Math.max(mesh.scale.x, mesh.scale.y, mesh.scale.z)
  return (geometry.boundingSphere?.radius ?? 0) * scale
}

/** The body's own meshes that carry its outline, before any aura is put on. */
function bodyMeshes(figure: Group): Mesh[] {
  const found: Mesh[] = []
  figure.traverse((node: Object3D) => {
    const mesh = node as Mesh
    if (!mesh.isMesh || mesh.name.startsWith('nen-')) return
    if (radiusOf(mesh) >= SILHOUETTE_RADIUS) found.push(mesh)
  })
  return found
}

/**
 * Puts the skin on, and returns its meshes.
 *
 * Call it before any other aura mesh is added to the figure: it wraps whatever
 * is already there, and an aura wrapping its own flames would be a second skin.
 */
export function wrapInAura(
  THREE: Three,
  figure: Group,
  look: { colour: number; level: SkinLevel },
): Mesh[] {
  const material = skinMaterial(THREE, look.colour, look.level)
  return bodyMeshes(figure).map((body) => {
    const skin = new THREE.Mesh(body.geometry, material)
    skin.name = `nen-skin-${look.level}`
    skin.renderOrder = 2
    body.add(skin)
    return skin
  })
}

/** Which level a state wears, or null for one that wears no skin at all. */
export function skinLevelOf(nen: {
  mode: 'ten' | 'ren' | 'zetsu'
  ken: boolean
  on: boolean
  ko: unknown
}): SkinLevel | null {
  // Ko empties every other zone into one: the rest of the body is in Zetsu,
  // and that bareness is the whole of the technique's price.
  if (nen.mode === 'zetsu' || nen.on || nen.ko) return null
  if (nen.ken) return 'ken'
  return nen.mode
}
