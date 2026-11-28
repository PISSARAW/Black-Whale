import { Mesh, MeshBasicMaterial, MeshLambertMaterial } from 'three'
import type { Material, Object3D } from 'three'
import { tserriednichPortrait } from './tserriednichTiming'
import type { VictoryContext } from './types'

type GradedMaterial = MeshBasicMaterial | MeshLambertMaterial

/** Shape the light on the existing materials without replacing faces, costumes or scenery. */
export function createTserriednichLook() {
  const actors = new Map<GradedMaterial, GradedMaterial>()
  const scenery = new Map<GradedMaterial, GradedMaterial>()
  const centre = { value: 0 }
  const portrait = { value: 0 }

  function graded(source: Material, stage: boolean) {
    if (!(source instanceof MeshBasicMaterial || (stage && source instanceof MeshLambertMaterial)))
      return source
    const cache = stage ? scenery : actors
    const stored = cache.get(source)
    if (stored) return stored

    const material = source.clone()
    material.customProgramCacheKey = () =>
      `${source.customProgramCacheKey()}|tserriednich-key-light-${stage ? 'stage' : 'actor'}`
    material.onBeforeCompile = (shader, renderer) => {
      source.onBeforeCompile.call(material, shader, renderer)
      shader.uniforms.futureLightCentre = centre
      shader.uniforms.futurePortrait = portrait
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
          varying vec3 futureNormal;
          varying vec3 futurePosition;
          varying float futureDepth;
        `,
        )
        .replace(
          '#include <project_vertex>',
          `#include <project_vertex>
          futureNormal = ${stage ? 'vec3(0.0, 0.45, 0.9)' : 'normalMatrix * normal'};
          vec4 stagePoint = vec4(transformed, 1.0);
          #ifdef USE_INSTANCING
            stagePoint = instanceMatrix * stagePoint;
          #endif
          futurePosition = (modelMatrix * stagePoint).xyz;
          futureDepth = -mvPosition.z;
        `,
        )
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
          uniform float futureLightCentre;
          uniform float futurePortrait;
          varying vec3 futureNormal;
          varying vec3 futurePosition;
          varying float futureDepth;
        `,
        )
        .replace(
          '#include <opaque_fragment>',
          `
          vec3 lightNormal = normalize(futureNormal + vec3(0.0001));
          float key = max(0.0, dot(lightNormal, normalize(vec3(-0.61, 0.64, 0.46))));
          ${
            stage
              ? `
            vec2 offset = (futurePosition.xz - vec2(futureLightCentre, 0.55)) * vec2(0.43, 0.60);
            float pool = exp(-dot(offset, offset));
            float roomDepth = smoothstep(3.6, 10.5, futureDepth);
            float portraitDepth = smoothstep(1.75, 5.2, futureDepth) * futurePortrait;
            float depth = max(roomDepth, portraitDepth);
            float source = max(0.0, 1.0 - abs(futurePosition.x - futureLightCentre + 0.62) * 0.22);
            vec3 room = outgoingLight * mix(vec3(0.13, 0.24, 0.45), vec3(1.22, 0.94, 0.62), pool * source);
            outgoingLight = mix(room * (0.60 + key * 0.40), vec3(0.014, 0.029, 0.060), depth * 0.92);
          `
              : `
            float rim = pow(1.0 - abs(lightNormal.z), 2.5) * max(0.0, lightNormal.x + 0.20);
            vec3 fill = mix(vec3(0.37, 0.48, 0.66), vec3(1.38, 1.16, 0.91), pow(key, 0.63));
            outgoingLight = outgoingLight * fill + (0.05 + outgoingLight * 0.38) * rim * vec3(0.34, 0.70, 1.0);
          `
          }
          #include <opaque_fragment>
        `,
        )
    }
    cache.set(source, material)
    return material
  }

  function apply(context: VictoryContext, root: Object3D, stage = false) {
    root.traverseVisible((node) => {
      if (!(node instanceof Mesh) || (!stage && !node.geometry.hasAttribute('normal'))) return
      const source = node.material
      if (Array.isArray(source)) {
        context.material(
          node,
          source.map((entry) => graded(entry, stage)),
        )
      } else {
        const material = graded(source, stage)
        if (source !== material) context.material(node, material)
      }
    })
  }

  return {
    apply(context: VictoryContext, x: number) {
      centre.value = x
      portrait.value = tserriednichPortrait(context.frame.elapsed)
        ? (context.comfort.camera ?? 1)
        : 0
      apply(context, context.scenery, true)
      apply(context, context.hero.root)
      apply(context, context.victim.root)
    },
    dispose() {
      actors.forEach((material) => material.dispose())
      scenery.forEach((material) => material.dispose())
      actors.clear()
      scenery.clear()
    },
  }
}
