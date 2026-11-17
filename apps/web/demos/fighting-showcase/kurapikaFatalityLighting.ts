import { AdditiveBlending, Mesh, PlaneGeometry, ShaderMaterial } from 'three'
import type { Material, Object3D, Scene } from 'three'

const dark = new WeakMap<Material, Material>()
function dim(source: Material) {
  let material = dark.get(source)
  if (!material) {
    material = source.clone()
    const coloured = material as import('three').MeshBasicMaterial
    coloured.color?.multiplyScalar(0.055)
    dark.set(source, material)
  }
  return material
}
const spot = new Mesh(
  new PlaneGeometry(5.5, 4),
  new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    vertexShader:
      'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:
      'varying vec2 vUv;void main(){float r=length((vUv-.5)*2.);float a=smoothstep(1.,.05,r)*.38;gl_FragColor=vec4(.52,.44,.4,a);}',
  }),
)
spot.rotation.x = -Math.PI / 2

export function fatalityLighting(scene: Scene, options: { hero: Object3D; victim: Object3D }) {
  const originals: Array<{ node: Mesh; material: Mesh['material'] }> = []
  for (const root of scene.children) {
    if (root === options.hero || root === options.victim || root.name.startsWith('kurapika'))
      continue
    root.traverse((node) => {
      if (!(node instanceof Mesh)) return
      originals.push({ node, material: node.material })
      node.material = Array.isArray(node.material) ? node.material.map(dim) : dim(node.material)
    })
  }
  spot.position.set((options.hero.position.x + options.victim.position.x) / 2, 0.025, 0)
  scene.add(spot)
  spot.updateMatrixWorld(true)
  return () => {
    scene.remove(spot)
    originals.forEach(({ node, material }) => {
      node.material = material
    })
  }
}
