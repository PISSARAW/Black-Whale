import { Mesh, MeshBasicMaterial, Vector3 } from 'three'
import { ease } from './resources'
import { CAMILLA_EYES_OPEN, CAMILLA_PAW_LANDS, CAMILLA_RISE } from './camillaTiming'
import type { VictoryContext } from './types'

export function createCamillaLighting() {
  const costumes = new Map<MeshBasicMaterial, MeshBasicMaterial>()
  const scenery = new Map<MeshBasicMaterial, MeshBasicMaterial>()
  const light = { value: new Vector3() }
  const apparition = { value: 0 }
  const portrait = { value: 0 }

  function grade(source: MeshBasicMaterial, room: boolean) {
    const cache = room ? scenery : costumes
    const cached = cache.get(source)
    if (cached) return cached
    const material = source.clone()
    material.onBeforeCompile = (shader) => {
      shader.uniforms.camillaLight = light
      shader.uniforms.camillaApparition = apparition
      shader.uniforms.camillaPortrait = portrait
      shader.vertexShader = `varying vec3 camillaNormal;
        varying vec3 camillaPosition;
        ${shader.vertexShader}`.replace(
        '#include <project_vertex>',
        `camillaNormal = normalize(normalMatrix * normal);
         vec4 stagePosition = vec4(transformed, 1.0);
         #ifdef USE_BATCHING
           stagePosition = batchingMatrix * stagePosition;
         #endif
         #ifdef USE_INSTANCING
           stagePosition = instanceMatrix * stagePosition;
         #endif
         camillaPosition = (modelMatrix * stagePosition).xyz;
         #include <project_vertex>`,
      )
      shader.fragmentShader = `varying vec3 camillaNormal;
        varying vec3 camillaPosition;
        uniform vec3 camillaLight;
        uniform float camillaApparition;
        uniform float camillaPortrait;
        ${shader.fragmentShader}`.replace(
        '#include <opaque_fragment>',
        room
          ? `vec3 p = camillaPosition;
             vec2 pool = (p.xz - camillaLight.xz) / vec2(2.18, 1.10);
             float lamp = exp(-dot(pool, pool) * 1.65) * exp(-abs(p.y) * 1.9);
             float depth = 1.0 - smoothstep(-2.7, 0.5, p.z);
             outgoingLight *= mix(vec3(0.44, 0.58, 0.78), vec3(1.32, 0.90, 0.53), lamp);
             outgoingLight += vec3(0.012, 0.024, 0.054) * depth * (0.45 + 0.55 * camillaApparition);
             outgoingLight += vec3(0.075, 0.036, 0.012) * lamp;
             outgoingLight *= 1.0 - camillaPortrait * 0.56;
             #include <opaque_fragment>`
          : `vec3 n = normalize(camillaNormal);
             float key = smoothstep(-0.36, 0.78, dot(n, normalize(vec3(-0.58, 0.59, 0.62))));
             float rim = pow(1.0 - abs(n.z), 2.1) * smoothstep(-0.2, 0.85, n.x);
             vec3 shadow = mix(vec3(0.38, 0.46, 0.62), vec3(0.25, 0.34, 0.55), camillaApparition);
             outgoingLight *= mix(shadow, vec3(1.12, 0.89, 0.66), key);
             outgoingLight += vec3(0.030, 0.058, 0.108) * rim;
             #include <opaque_fragment>`,
      )
    }
    material.customProgramCacheKey = () => (room ? 'camilla-room' : 'camilla-actors')
    cache.set(source, material)
    return material
  }

  return {
    sync(context: VictoryContext, focus: Vector3) {
      if (context.comfort.highContrast) return
      const { age } = context
      light.value.copy(focus)
      apparition.value = ease((age - CAMILLA_PAW_LANDS + 9) / 32)
      portrait.value =
        ease((age - CAMILLA_EYES_OPEN + 13) / 20) * (1 - ease((age - CAMILLA_RISE) / 22))
      for (const root of [context.scenery, context.hero.root, context.victim.root]) {
        const room = root === context.scenery
        root.traverseVisible((part) => {
          if (!(part instanceof Mesh) || part.name.startsWith('nen-')) return
          const source = part.material
          if (!(source instanceof MeshBasicMaterial) || source.transparent || source.wireframe)
            return
          context.material(part, grade(source, room))
        })
      }
    },
    dispose() {
      for (const cache of [costumes, scenery]) {
        cache.forEach((material) => material.dispose())
        cache.clear()
      }
    },
  }
}
