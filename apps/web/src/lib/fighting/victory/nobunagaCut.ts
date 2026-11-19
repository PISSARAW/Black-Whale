import * as THREE from 'three'
import type { NobunagaContext } from './nobunagaTypes'
import type { NobunagaVictoryPose } from './nobunagaPose'
import { NOBUNAGA_FALL } from './nobunagaTypes'
import { ease } from './resources'
import { nobunagaCutBounds } from './nobunagaCutBounds'

function half(source: THREE.Object3D, index: number, bounds: THREE.Box3) {
  const pivot = new THREE.Group(),
    clone = source.clone(true)
  const sources: THREE.Object3D[] = [],
    copies: THREE.Object3D[] = []
  source.traverse((node) => sources.push(node))
  clone.traverse((node) => copies.push(node))
  const materials: THREE.ShaderMaterial[] = []
  const uniforms = {
    inverseBody: { value: new THREE.Matrix4() },
    cutY: { value: 0 },
    upper: { value: index },
  }
  copies.forEach((node) => {
    if (!(node instanceof THREE.Mesh)) return
    const own = (original: THREE.Material) => {
      const material = new THREE.ShaderMaterial({
        side: original.side,
        uniforms: {
          ...uniforms,
          colour: {
            value:
              (original as THREE.MeshBasicMaterial).color?.clone() ?? new THREE.Color(0x444444),
          },
        },
        vertexShader: `uniform mat4 inverseBody;varying float height;void main(){vec4 p=vec4(position,1.);
        #ifdef USE_INSTANCING
        p=instanceMatrix*p;
        #endif
        vec4 world=modelMatrix*p;height=(inverseBody*world).y;gl_Position=projectionMatrix*viewMatrix*world;}`,
        fragmentShader: `uniform vec3 colour;uniform float cutY;uniform int upper;varying float height;
        void main(){if(upper==1&&height<cutY)discard;if(upper==0&&height>=cutY)discard;gl_FragColor=vec4(colour,1.);}`,
      })
      materials.push(material)
      return material
    }
    node.material = Array.isArray(node.material) ? node.material.map(own) : own(node.material)
  })
  pivot.add(clone)
  return { pivot, clone, copies, sources, uniforms, materials, bounds }
}
export function createNobunagaCut() {
  const root = new THREE.Group()
  root.name = 'nobunaga-one-cut'
  let held = '',
    halves: ReturnType<typeof half>[] = []
  function release() {
    halves.forEach((part) => {
      part.pivot.removeFromParent()
      part.materials.forEach((material) => material.dispose())
      part.copies.forEach((copy) => {
        if (copy instanceof THREE.InstancedMesh) copy.dispose()
      })
    })
    halves = []
  }
  return {
    root,
    sync(context: NobunagaContext, pose: NobunagaVictoryPose) {
      root.visible = context.age >= NOBUNAGA_FALL
      if (!root.visible) return 0
      if (held !== context.victim.root.uuid) {
        release()
        held = context.victim.root.uuid
        const bounds = nobunagaCutBounds(context.victim.root, pose.contact.y)
        halves = [half(context.victim.root, 0, bounds[0]), half(context.victim.root, 1, bounds[1])]
        root.add(...halves.map((part) => part.pivot))
      }
      const { victim, age } = context
      const fall = ease((age - NOBUNAGA_FALL) / 72)
      const cut = victim.root.worldToLocal(pose.contact.clone()).y
      halves.forEach((part, i) => {
        part.copies.forEach((copy, j) => {
          const source = part.sources[j]
          copy.position.copy(source.position)
          copy.quaternion.copy(source.quaternion)
          copy.scale.copy(source.scale)
          copy.visible = source.visible && source.name !== 'contact-shadow'
        })
        const centre = part.bounds.getCenter(new THREE.Vector3())
        part.pivot.rotation.z = fall * (i ? -Math.PI / 2 : Math.PI / 2)
        const rotated = part.bounds
          .clone()
          .translate(centre.clone().negate())
          .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(part.pivot.quaternion))
        const floor = -rotated.min.y + 0.025
        part.pivot.position
          .copy(centre)
          .add(
            new THREE.Vector3(
              fall * (i ? 0.85 : -0.25),
              (floor - centre.y) * fall,
              fall * (i ? 0.1 : -0.18),
            ),
          )
        part.clone.position.copy(victim.root.position).sub(centre)
        part.clone.quaternion.copy(victim.root.quaternion)
        part.clone.scale.copy(victim.root.scale)
        part.clone.updateWorldMatrix(true, true)
        part.uniforms.inverseBody.value.copy(part.clone.matrixWorld).invert()
        part.uniforms.cutY.value = cut
      })
      victim.root.visible = false
      return fall
    },
    dispose() {
      release()
      root.removeFromParent()
    },
  }
}
