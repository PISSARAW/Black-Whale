import { AdditiveBlending, Group, Mesh, MeshBasicMaterial, ShaderMaterial, Vector3 } from 'three'
import type { Object3D } from 'three'
import type { VictoryContext } from './types'
import type { HalkenburgPose } from './halkenburgBow'
import { resetVictoryActor, victoryActor } from './actors'
import { ease } from './resources'

/** The aura silhouette depicts the displaced consciousness, while the native body stays intact. */
export function createHalkenburgTransfer() {
  const root = new Group(),
    copies = new Map<Object3D, { root: Object3D; pairs: { source: Object3D; copy: Object3D }[] }>()
  root.name = 'halkenburg-consciousness-transfer'
  const spirit = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { opacity: { value: 0 } },
    vertexShader: `varying vec3 n;varying vec3 v;void main(){vec4 p=vec4(position,1.);
    #ifdef USE_INSTANCING
    p=instanceMatrix*p;
    #endif
    vec4 mv=modelViewMatrix*p;n=normalize(normalMatrix*normal);v=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
    fragmentShader:
      'varying vec3 n;varying vec3 v;uniform float opacity;void main(){float rim=pow(1.-abs(dot(n,v)),2.);gl_FragColor=vec4(1.,.87,.57,(.06+rim*.7)*opacity);}',
  })
  const iris = new MeshBasicMaterial({ color: 0xc8a85e })
  return {
    root,
    sync(context: VictoryContext, pose: HalkenburgPose) {
      const source = context.victim.root
      let copy = copies.get(source)
      if (!copy) {
        const made = source.clone(true),
          sources: Object3D[] = [],
          nodes: Object3D[] = []
        source.traverse((node) => sources.push(node))
        made.traverse((node) => {
          nodes.push(node)
          if (node instanceof Mesh) node.material = spirit
        })
        copy = { root: made, pairs: nodes.map((node, i) => ({ source: sources[i], copy: node })) }
        copies.set(source, copy)
        root.add(made)
      }
      copy.pairs.forEach(({ source, copy }) => {
        copy.position.copy(source.position)
        copy.quaternion.copy(source.quaternion)
        copy.scale.copy(source.scale)
        copy.visible = source.visible
      })
      resetVictoryActor(victoryActor(copy.root, context.state[context.frame.loser].id), () => {})
      const t = ease((context.age - 324) / 66)
      copy.root.position.copy(pose.origin).add(new Vector3(t * 0.35, t * 0.8, t * 0.65))
      copy.root.visible = context.age >= 324 && context.age < 410
      spirit.uniforms.opacity.value = (1 - ease((context.age - 362) / 48)) * 0.65
      const close = ease((context.age - 336) / 12) * (1 - ease((context.age - 410) / 18))
      for (const side of ['left', 'right']) {
        const eye = context.victim.head.getObjectByName(`face-eye-${side}`)
        if (!eye) continue
        context.save(eye)
        eye.scale.y *= 1 - close * 0.96
        const pupil = eye.getObjectByName('eye-pupil')
        if (context.age >= 410 && pupil instanceof Mesh) context.material(pupil, iris)
      }
    },
    dispose() {
      root.removeFromParent()
      copies.forEach(({ root }) =>
        root.traverse((node) => {
          if ('isInstancedMesh' in node) (node as import('three').InstancedMesh).dispose()
        }),
      )
      copies.clear()
      spirit.dispose()
      iris.dispose()
    },
  }
}
