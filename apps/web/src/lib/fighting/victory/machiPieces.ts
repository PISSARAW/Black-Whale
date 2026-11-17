import { Color, Group, Mesh, ShaderMaterial, Vector3, Matrix4, InstancedMesh } from 'three'
import type { Material, MeshBasicMaterial, Object3D } from 'three'
import type { VictoryContext } from './types'
import type { MachiVictoryPose } from './machiPose'
import { MACHI_CUT, MACHI_STITCH, MACHI_REJOIN, MACHI_UNPICK } from './machiPose'
import { ease } from './resources'

function sectionMaterial(
  source: Material,
  uniforms: { sectionInverse: { value: Matrix4 }; band: { value: number[] } },
) {
  return new ShaderMaterial({
    side: source.side,
    uniforms: {
      ...uniforms,
      colour: { value: (source as MeshBasicMaterial).color?.clone() ?? new Color(0x333333) },
    },
    vertexShader: `uniform mat4 sectionInverse;varying float height;void main(){vec4 p=vec4(position,1.);
    #ifdef USE_INSTANCING
    p=instanceMatrix*p;
    #endif
    vec4 world=modelMatrix*p;height=(sectionInverse*world).y;
    gl_Position=projectionMatrix*viewMatrix*world;}`,
    fragmentShader: `uniform vec3 colour;uniform vec2 band;varying float height;
    void main(){if(height<band.x||height>band.y)discard;gl_FragColor=vec4(colour,1.);}`,
  })
}
function buildSection(source: Object3D, index: number) {
  const pivot = new Group(),
    clone = source.clone(true)
  const sources: Object3D[] = [],
    copies: Object3D[] = []
  source.traverse((node) => sources.push(node))
  clone.traverse((node) => copies.push(node))
  const materials = new Map<Material, ShaderMaterial>()
  const uniforms = { sectionInverse: { value: new Matrix4() }, band: { value: [0, 1] } }
  copies.forEach((node) => {
    if (!(node instanceof Mesh)) return
    const owned = (original: Material) => {
      const result = materials.get(original) ?? sectionMaterial(original, uniforms)
      materials.set(original, result)
      return result
    }
    node.material = Array.isArray(node.material) ? node.material.map(owned) : owned(node.material)
  })
  pivot.add(clone)
  pivot.name = `machi-sutured-section:${index}`
  return { pivot, clone, sources, copies, materials, uniforms }
}
export function createMachiSections() {
  const root = new Group()
  root.name = 'machi-surgical-puppet'
  let sourceId = '',
    sections: ReturnType<typeof buildSection>[] = []
  const release = () => {
    sections.forEach((section) => {
      section.pivot.removeFromParent()
      section.copies.forEach((node) => {
        if (node instanceof InstancedMesh) node.dispose()
      })
      section.materials.forEach((material) => material.dispose())
    })
    sections = []
  }
  return {
    root,
    sync(context: VictoryContext, pose: MachiVictoryPose) {
      root.visible = context.age >= MACHI_CUT
      if (!root.visible) return []
      if (sourceId !== context.victim.root.uuid) {
        release()
        sourceId = context.victim.root.uuid
        sections = Array.from({ length: 4 }, (_, i) => buildSection(context.victim.root, i))
        root.add(...sections.map((section) => section.pivot))
      }
      const { victim, age } = context
      const lo = victim.root.worldToLocal(
        new Vector3(pose.centre.x, pose.body.min.y, pose.centre.z),
      ).y
      const hi = victim.root.worldToLocal(
        new Vector3(pose.centre.x, pose.body.max.y, pose.centre.z),
      ).y
      const split =
        ease((age - MACHI_CUT) / 24) *
        (1 - ease((age - MACHI_STITCH) / (MACHI_REJOIN - MACHI_STITCH)))
      const fall = ease((age - MACHI_UNPICK) / 66)
      const centres = sections.map((section, i) => {
        section.copies.forEach((copy, j) => {
          const original = section.sources[j]
          copy.position.copy(original.position)
          copy.quaternion.copy(original.quaternion)
          copy.scale.copy(original.scale)
          copy.visible = original.visible
        })
        section.uniforms.band.value = [
          lo + ((hi - lo) * i) / 4,
          lo + ((hi - lo) * (i + 1)) / 4 - 0.002,
        ]
        const centre = victim.root.localToWorld(new Vector3(0, lo + ((hi - lo) * (i + 0.5)) / 4, 0))
        const sign = i % 2 ? 1 : -1
        section.pivot.position
          .copy(centre)
          .add(
            new Vector3(
              sign * split * 0.17 + fall * (0.15 + i * 0.26),
              (i - 1.5) * split * 0.12,
              split * sign * 0.08,
            ),
          )
        section.pivot.position.y += (0.12 + victim.width * 0.3 - centre.y) * fall
        section.pivot.rotation.set(fall * 0.15, fall * sign * 0.4, (fall * sign * Math.PI) / 2)
        section.clone.position.copy(victim.root.position).sub(centre)
        section.clone.quaternion.copy(victim.root.quaternion)
        section.clone.scale.copy(victim.root.scale)
        section.clone.updateWorldMatrix(true, true)
        section.uniforms.sectionInverse.value.copy(section.clone.matrixWorld).invert()
        return section.pivot.position.clone()
      })
      victim.root.visible = false
      return centres
    },
    dispose() {
      release()
      root.removeFromParent()
    },
  }
}
