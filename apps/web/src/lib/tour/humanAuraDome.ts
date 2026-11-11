/**
 * En as the anime draws it: a dome of aura over the floor it sweeps.
 *
 * The rings on the floor stay — they are what tells a visitor, on the deck,
 * exactly where the sweep starts, which is the line the stealth loop in
 * `cast/sensing.ts` is about. The dome is what makes it read as En rather than
 * as a marking on the floor.
 *
 * It must never stand between the visitor and the room. Two choices hold that:
 *
 * - **Front faces only.** A visitor who walks into the sweep is inside the
 *   sphere, where every face points away from them and is culled — the dome
 *   disappears instead of tinting the whole screen, Gyo or not.
 * - **Rim only.** Seen from outside, the light is at the silhouette of the
 *   dome and almost nothing crosses its middle, so the guard inside it and the
 *   room behind it stay legible.
 */
import type { Group, Mesh, ShaderMaterial } from 'three'
import { SKIN_TIME } from './humanAuraSkin'

type Three = typeof import('three')

const vertexShader = /* glsl */ `
  varying float vRim;
  varying float vHeight;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vec3 n = normalize(mat3(modelMatrix) * normal);
    vRim = 1.0 - abs(dot(n, normalize(cameraPosition - world.xyz)));
    vHeight = position.y;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 u_colour;
  uniform float u_time;
  varying float vRim;
  varying float vHeight;
  void main() {
    float rim = pow(vRim, 4.0);
    float breath = 0.85 + 0.15 * sin(u_time * 1.3);
    // Fades towards the apex, as an aura thins away from the body it leaves.
    float fall = 1.0 - smoothstep(0.0, 1.0, vHeight);
    gl_FragColor = vec4(u_colour, 0.16 * rim * breath * (0.4 + 0.6 * fall));
  }
`

const materials = new Map<number, ShaderMaterial>()

function domeMaterial(THREE: Three, colour: number): ShaderMaterial {
  const cached = materials.get(colour)
  if (cached) return cached
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: { u_colour: { value: new THREE.Color(colour) }, u_time: SKIN_TIME },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
  })
  materials.set(colour, material)
  return material
}

/** The dome over one sweep, on the body's root so it does not turn with it. */
export function buildEnDome(
  THREE: Three,
  root: Group,
  sweep: { colour: number; radius: number; geometry: Mesh['geometry'] },
): Mesh {
  const dome = new THREE.Mesh(sweep.geometry, domeMaterial(THREE, sweep.colour))
  dome.name = 'nen-en-dome'
  dome.scale.setScalar(sweep.radius)
  root.add(dome)
  return dome
}

/** A unit hemisphere, for the shared geometry cache. */
export const unitDome = (THREE: Three) =>
  new THREE.SphereGeometry(1, 40, 14, 0, Math.PI * 2, 0, Math.PI / 2)
