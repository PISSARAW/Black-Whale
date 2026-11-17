import {
  BoxGeometry,
  Color,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  ShaderMaterial,
} from 'three'
import type { Material } from 'three'
import type { VictoryContext } from './types'
import type { kallutoVictoryPose } from './kallutoPose'
import { KALLUTO_END, KALLUTO_SHRED } from './kallutoPose'
import { disposeVictoryObject, ease } from './resources'

function slicedMaterial(source: Material) {
  return new ShaderMaterial({
    side: source.side,
    uniforms: {
      colour: { value: (source as MeshBasicMaterial).color?.clone() ?? new Color(0x333333) },
      progress: { value: 0 },
      origin: { value: 0 },
    },
    vertexShader: `varying vec3 world;void main(){vec4 p=vec4(position,1.);
    #ifdef USE_INSTANCING
    p=instanceMatrix*p;
    #endif
    world=(modelMatrix*p).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);}`,
    fragmentShader: `varying vec3 world;uniform vec3 colour;uniform float progress;uniform float origin;
    float hash(float n){return fract(sin(n*127.1)*43758.5453);}
    void main(){float stripe=(world.y+world.x*.48)*42.;float band=floor(stripe);
    float start=hash(band)*.72;float cut=clamp((progress-start)*4.,0.,1.);
    if(fract(stripe)<cut)discard;
    float edge=smoothstep(cut,cut+.045,fract(stripe));
    gl_FragColor=vec4(mix(vec3(.7,.67,.6),colour,edge),1.);}`,
  })
}
export function createKallutoShredding() {
  const root = new Group()
  root.name = 'kalluto-torn-silhouette'
  const fragments = new InstancedMesh(new BoxGeometry(1, 1, 0.2), new MeshBasicMaterial(), 384)
  fragments.frustumCulled = false
  root.add(fragments)
  const materials = new Map<Material, ShaderMaterial>()
  const dummy = new Object3D()
  function tear(context: VictoryContext) {
    const progress = ease((context.age - KALLUTO_SHRED) / (KALLUTO_END - KALLUTO_SHRED))
    const next = (source: Material) => {
      const material = materials.get(source) ?? slicedMaterial(source)
      materials.set(source, material)
      material.uniforms.progress.value = progress
      return material
    }
    context.victim.root.traverse((node) => {
      if (!(node instanceof Mesh)) return
      context.material(
        node,
        Array.isArray(node.material) ? node.material.map(next) : next(node.material),
      )
    })
    context.victim.root.visible = context.age < KALLUTO_END
    return progress
  }
  function debris(context: VictoryContext, pose: ReturnType<typeof kallutoVictoryPose>) {
    const palette: Color[] = []
    context.victim.root.traverse((node) => {
      if (!(node instanceof Mesh)) return
      const source = Array.isArray(node.material) ? node.material[0] : node.material
      const colour = (source as MeshBasicMaterial).color
      if (colour && palette.length < 16) palette.push(colour)
    })
    const fall = ease((context.age - KALLUTO_END) / 90)
    fragments.visible = context.age >= KALLUTO_SHRED && context.age < 540
    for (let i = 0; i < 384; i++) {
      const u = ((i * 73) % 383) / 383,
        v = ((i * 157) % 379) / 379
      const t = ease((context.age - KALLUTO_SHRED - u * 90) / 42)
      const angle = i * 2.4 + t * 5
      dummy.position.set(
        pose.target.x + Math.cos(angle) * t * 1.5,
        Math.max(0.035, pose.body.min.y + v * context.victim.height + t * 0.3 - fall * 2.5),
        pose.target.z + Math.sin(angle) * t * 0.8,
      )
      dummy.rotation.set(t * i, angle, -Math.PI / 6 + t * 4)
      const size = (t > 0 ? 1 - fall : 0) * 0.035
      dummy.scale.set(size * (2 + u * 3), size * 0.5, size * 0.5)
      dummy.updateMatrix()
      fragments.setMatrixAt(i, dummy.matrix)
      fragments.setColorAt(i, palette[i % palette.length] ?? new Color(0x555555))
    }
    fragments.instanceMatrix.needsUpdate = true
    if (fragments.instanceColor) fragments.instanceColor.needsUpdate = true
  }
  return {
    root,
    sync(context: VictoryContext, pose: ReturnType<typeof kallutoVictoryPose>) {
      debris(context, pose)
      return context.age >= KALLUTO_SHRED ? tear(context) : 0
    },
    dispose() {
      materials.forEach((material) => material.dispose())
      materials.clear()
      disposeVictoryObject(root)
    },
  }
}
