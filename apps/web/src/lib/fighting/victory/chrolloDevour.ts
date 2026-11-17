import { Color, Mesh, ShaderMaterial, Vector4 } from 'three'
import type { Material, MeshBasicMaterial, Vector3 } from 'three'
import type { VictoryContext } from './types'
import { FISH_BITES, FISH_COLLISION } from './chrolloFish'

function bittenMaterial(source: Material) {
  return new ShaderMaterial({
    side: source.side,
    uniforms: {
      colour: { value: (source as MeshBasicMaterial).color?.clone() ?? new Color(0x777777) },
      bites: { value: Array.from({ length: 4 }, () => new Vector4()) },
      end: { value: 0 },
    },
    vertexShader: `varying vec3 world;void main(){vec4 p=vec4(position,1.);
    #ifdef USE_INSTANCING
    p=instanceMatrix*p;
    #endif
    world=(modelMatrix*p).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);}`,
    fragmentShader: `varying vec3 world;uniform vec3 colour;uniform vec4 bites[4];uniform float end;
    float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
    void main(){float edge=1.;for(int i=0;i<4;i++){
      if(bites[i].w<=0.)continue;
      float d=length((world-bites[i].xyz)*vec3(1.,1.,.08))-bites[i].w;
      if(d<0.)discard;edge=min(edge,smoothstep(0.,.012,d));}
      if(hash(floor(world*28.))<end)discard;
      gl_FragColor=vec4(mix(vec3(.16,.035,.035),colour,edge),1.);}`,
  })
}
export function createFishDevouring() {
  const materials = new Map<Material, ShaderMaterial>()
  return {
    sync(context: VictoryContext, points: Vector3[]) {
      if (context.age < FISH_BITES[0]) return
      const next = (source: Material) => {
        const material = materials.get(source) ?? bittenMaterial(source)
        materials.set(source, material)
        material.uniforms.bites.value.forEach((bite: Vector4, i: number) => {
          const progress = Math.max(0, Math.min(1, (context.age - FISH_BITES[i]) / 9))
          bite.set(
            points[i].x,
            points[i].y,
            points[i].z,
            Math.min(0.29, context.victim.height * 0.14) * progress,
          )
        })
        material.uniforms.end.value = Math.max(0, (context.age - FISH_COLLISION) / 20)
        return material
      }
      context.victim.root.traverse((node) => {
        if (!(node instanceof Mesh)) return
        context.material(
          node,
          Array.isArray(node.material) ? node.material.map(next) : next(node.material),
        )
      })
      context.victim.root.visible = context.age < FISH_COLLISION + 20
    },
    dispose() {
      materials.forEach((material) => material.dispose())
      materials.clear()
    },
  }
}
