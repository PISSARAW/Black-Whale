import {
  BoxGeometry,
  Color,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Mesh,
  MeshLambertMaterial,
  Object3D,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
} from 'three'
import type { Material } from 'three'
import { disposeVictoryObject, ease } from './resources'
import {
  PHINKS_DEBRIS_HIT,
  PHINKS_DEBRIS_SETTLE,
  PHINKS_DISINTEGRATED,
  PHINKS_FRACTURE,
  PHINKS_FRAGMENT_BURST,
} from './phinksTiming'
import { FIGHT_FPS } from '../fightClock'
import type { VictoryContext } from './types'

const FRAGMENTS = 210

function fractureMaterial(
  source: Material,
  uniforms: {
    fracture: { value: number }
    edgeLight: { value: number }
    origin: { value: Vector3 }
  },
) {
  const material = source.clone()
  material.customProgramCacheKey = () => 'phinks-cell-fracture-v1'
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 fracturePoint;')
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        fracturePoint = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
      )
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float fracture, edgeLight;
        uniform vec3 origin;
        varying vec3 fracturePoint;
        float cellHash(vec3 cell) {
          return fract(sin(dot(cell, vec3(127.1, 311.7, 74.7))) * 43758.5453);
        }`,
      )
      .replace(
        '#include <opaque_fragment>',
        `
        vec3 grain = (fracturePoint - origin) * 16.0;
        vec3 cell = floor(grain);
        float order = cellHash(cell) * 0.70 + clamp((cell.x + 4.0) / 15.0, 0.0, 1.0) * 0.30;
        if (order < fracture) discard;
        float edge = exp(-pow((order - fracture) * 9.0, 2.0));
        vec3 brick = fract(grain);
        float seam = 1.0 - smoothstep(0.03, 0.12, min(min(brick.x, brick.y), brick.z));
        outgoingLight = mix(outgoingLight, vec3(1.0, 0.56, 0.22),
          clamp(edgeLight * (edge * 0.74 + seam * 0.14), 0.0, 0.92));
        #include <opaque_fragment>`,
      )
  }
  return material
}

function dustPlume() {
  return new Mesh(
    new PlaneGeometry(1, 1),
    new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { opacity: { value: 0 }, drift: { value: 0 } },
      vertexShader: `
      varying vec2 dustUv;
      void main() {
        dustUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
      fragmentShader: `
      varying vec2 dustUv;
      uniform float opacity, drift;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float smoke(vec2 p) {
        vec2 corner = floor(p), offset = fract(p);
        offset = offset * offset * (3.0 - 2.0 * offset);
        return mix(mix(hash(corner), hash(corner + vec2(1,0)), offset.x),
          mix(hash(corner + vec2(0,1)), hash(corner + vec2(1,1)), offset.x), offset.y);
      }
      void main() {
        vec2 point = dustUv * 2.0 - 1.0;
        float rim = 1.0 - smoothstep(0.18, 1.0, length(point));
        float cloud = smoke(dustUv * 5.0 + vec2(-drift, 0.0)) * 0.7 +
          smoke(dustUv * 12.0 + vec2(-drift * 1.4, drift * 0.25)) * 0.3;
        gl_FragColor = vec4(mix(vec3(0.19,0.24,0.31), vec3(0.45,0.33,0.24), cloud),
          rim * rim * cloud * opacity);
        #include <colorspace_fragment>
      }
    `,
    }),
  )
}

export function createPhinksDisintegration() {
  const root = new Group()
  root.name = 'phinks-disintegration'
  const fragments = new InstancedMesh(
    new BoxGeometry(1, 1, 1),
    new MeshLambertMaterial({ color: 0xc5b6a1, fog: false }),
    FRAGMENTS,
  )
  const embers = new InstancedMesh(
    new IcosahedronGeometry(1, 0),
    new MeshLambertMaterial({
      color: 0xefbd6c,
      emissive: 0xcf6013,
      emissiveIntensity: 0.46,
      fog: false,
    }),
    36,
  )
  fragments.name = 'phinks-body-fragments'
  fragments.frustumCulled = embers.frustumCulled = false
  const colours = [0xb3a891, 0xc7b391, 0x20304e, 0x464b57, 0x778393]
  for (let i = 0; i < FRAGMENTS; i++)
    fragments.setColorAt(i, new Color(colours[(i * 7) % colours.length]))
  const clouds = Array.from({ length: 4 }, dustPlume)
  const groundClouds = Array.from({ length: 3 }, dustPlume)
  root.add(fragments, embers, ...clouds, ...groundClouds)
  const chunk = new Object3D()
  const materials = new Map<Material, Material>()
  const uniforms = {
    fracture: { value: 0 },
    edgeLight: { value: 0 },
    origin: { value: new Vector3() },
  }

  function updateFracture(context: VictoryContext, charged: boolean) {
    const { age, victim, comfort } = context
    const breakup = ease((age - PHINKS_FRACTURE) / (PHINKS_DISINTEGRATED - PHINKS_FRACTURE))
    if (age >= PHINKS_DISINTEGRATED) {
      context.save(victim.root)
      victim.root.visible = false
    } else {
      uniforms.fracture.value = breakup
      uniforms.origin.value.copy(victim.root.position)
      uniforms.edgeLight.value = (comfort.flashes && charged ? 0.93 : 0.23) * (1 - 0.54 * breakup)
      victim.root.traverseVisible((node) => {
        if (!(node instanceof Mesh)) return
        const convert = (source: Material) => {
          if (source instanceof ShaderMaterial) return source
          const held = materials.get(source)
          if (held) return held
          const fractured = fractureMaterial(source, uniforms)
          materials.set(source, fractured)
          return fractured
        }
        context.material(
          node,
          Array.isArray(node.material) ? node.material.map(convert) : convert(node.material),
        )
      })
    }
  }

  return {
    apply(context: VictoryContext, origin: Vector3, charged: boolean) {
      const { age, victim, comfort, camera } = context
      if (age < PHINKS_FRACTURE) return
      updateFracture(context, charged)

      const elapsed = (age - PHINKS_FRAGMENT_BURST) / FIGHT_FPS
      if (elapsed < 0 || age >= PHINKS_DEBRIS_SETTLE + 24) return
      root.position.copy(origin)
      embers.visible = charged && comfort.flashes
      for (let i = 0; i < FRAGMENTS; i++) {
        const seed = (i * 0.61803398875) % 1
        const angle = i * 2.39996
        const startHeight = (0.11 + (i % 37) / 43) * victim.height
        const emission = seed * 0.42
        const time = elapsed - emission
        const speed = 1.6 + 1.52 * seed
        const impactTime =
          (PHINKS_DEBRIS_HIT - PHINKS_FRAGMENT_BURST) / FIGHT_FPS -
          emission +
          Math.cos(angle) * 0.23
        const airborne = Math.max(0, Math.min(time, impactTime))
        const pastFloor = Math.max(0, time - impactTime)
        const bounce = Math.max(0, pastFloor * (0.95 + seed * 1.6) - 4.6 * pastFloor ** 2)
        const skid = (1 - Math.exp(-pastFloor * 3.4)) * speed * 0.23
        const arc = airborne / impactTime
        const radius =
          time > 0 ? (0.024 + seed * 0.058) * (1 - ease((age - PHINKS_DEBRIS_SETTLE + 12) / 36)) : 0
        chunk.position.set(
          Math.sin(angle) * 0.18 + emission * 0.86 + speed * airborne + skid,
          radius * 0.54 +
            startHeight * (1 - arc) +
            Math.sin(arc * Math.PI) * (0.3 + 0.62 * seed) +
            bounce,
          Math.cos(i * 3.8) * (0.15 + airborne * (0.42 + seed * 0.56) + skid * 0.46),
        )
        const spin = airborne + skid * 0.55
        chunk.rotation.set(i + spin * 7, spin * 5, i * 0.7 + spin * 4)
        chunk.scale.set(radius, radius * (1.08 + seed * 0.8), radius * (0.65 + seed))
        chunk.updateMatrix()
        fragments.setMatrixAt(i, chunk.matrix)
        if (i < embers.count) {
          chunk.scale.setScalar(radius * 0.36)
          chunk.updateMatrix()
          embers.setMatrixAt(i, chunk.matrix)
        }
      }
      fragments.instanceMatrix.needsUpdate = true
      embers.instanceMatrix.needsUpdate = true
      for (const [i, cloud] of clouds.entries()) {
        const time = Math.max(0, elapsed - (3 - i) * 0.105)
        cloud.position.set(
          0.22 + i * 0.56 + time * 1.1,
          0.35 + time * 0.14 + i * 0.13,
          (i - 1.5) * 0.24,
        )
        cloud.quaternion.copy(camera.quaternion)
        cloud.scale.set(0.78 + time * 1.68, 0.66 + time * 0.85, 1)
        cloud.material.uniforms.opacity.value =
          ease(time / 0.18) * (1 - ease((time - 0.42) / 1.45)) * 0.72
        cloud.material.uniforms.drift.value = time * 2 + i * 1.7
      }
      for (const [i, cloud] of groundClouds.entries()) {
        const time = Math.max(0, (age - PHINKS_DEBRIS_HIT - i * 8) / FIGHT_FPS)
        cloud.position.set(2.1 + i * 0.65 + time * 0.65, 0.11 + time * 0.16, (i - 1) * 0.38)
        cloud.quaternion.copy(camera.quaternion)
        cloud.scale.set(0.45 + time * 1.62, 0.24 + time * 0.55, 1)
        cloud.material.uniforms.opacity.value = ease(time / 0.1) * (1 - ease(time / 0.87)) * 0.88
        cloud.material.uniforms.drift.value = i + time * 2
      }
      context.add(root)
    },
    dispose() {
      disposeVictoryObject(root)
      materials.forEach((material) => material.dispose())
      materials.clear()
    },
  }
}
