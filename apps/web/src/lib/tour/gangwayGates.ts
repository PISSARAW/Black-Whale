import type * as Three from 'three'
import type { GangwayPath } from './gangwayNavigation'

/** Cut boarding passages through the exterior skin, leaving the walkable
 * bridge and the independently authored interior floors intact. */
export function gangwayHullMaterial(
  THREE: typeof Three,
  base: Three.MeshBasicMaterial,
  paths: GangwayPath[],
) {
  const material = base.clone()
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uGangwayStarts = {
      value: paths.map((path) => new THREE.Vector3(path.from[0], path.fromY, path.from[1])),
    }
    shader.uniforms.uGangwayEnds = {
      value: paths.map((path) => new THREE.Vector3(path.to[0], path.toY, path.to[1])),
    }
    shader.vertexShader = 'varying vec3 vGangwayWorld;\n' + shader.vertexShader
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvGangwayWorld=(modelMatrix*vec4(transformed,1.0)).xyz;',
    )
    shader.fragmentShader =
      `varying vec3 vGangwayWorld;\nuniform vec3 uGangwayStarts[${paths.length}];\nuniform vec3 uGangwayEnds[${paths.length}];\n` +
      shader.fragmentShader
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <clipping_planes_fragment>',
      `
      #include <clipping_planes_fragment>
      for(int gate=0;gate<${paths.length};gate++){
        vec3 delta=uGangwayEnds[gate]-uGangwayStarts[gate];
        float t=clamp(dot(vGangwayWorld-uGangwayStarts[gate],delta)/dot(delta,delta),0.0,1.0);
        if(distance(vGangwayWorld,uGangwayStarts[gate]+delta*t)<2.55) discard;
      }`,
    )
  }
  material.customProgramCacheKey = () => `royal-boarding-gates-${paths.length}`
  return material
}
