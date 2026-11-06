import type * as Three from 'three'
import { BanquetDetailBuilder } from './banquetDetailBuilder'
import { concertLandscapeHeight, type ConcertLandscapeSpec } from './concertLandscapeWalk'

const sample = (seed: number): number => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return value - Math.floor(value)
}

/** Repeated low-poly daisies: no texture download and two draw calls for the whole field. */
export function buildConcertMeadow(THREE: typeof Three, spec: ConcertLandscapeSpec): Three.Group {
  const root = new THREE.Group()
  root.name = 'concert-flower-field'
  const flower = daisy(THREE)
  const near = new THREE.InstancedMesh(flower, flowerMaterial(THREE), 2800)
  near.name = 'concert-foreground-daisies'
  distribute(THREE, near, { spec, radius: 17, minimum: 0.65 })
  const far = new THREE.InstancedMesh(distantDaisy(THREE), distantMaterial(THREE), 10000)
  far.name = 'concert-distant-daisies'
  distribute(THREE, far, { spec, radius: 78, minimum: 17 })
  root.add(near, far)
  return root
}

function distribute(
  THREE: typeof Three,
  mesh: Three.InstancedMesh,
  options: { spec: ConcertLandscapeSpec; radius: number; minimum: number },
): void {
  const { spec, radius, minimum } = options
  const transform = new THREE.Object3D()
  for (let index = 0; index < mesh.count; index++) {
    const angle = sample(index + 1) * Math.PI * 2
    const distance = minimum + Math.sqrt(sample(index + 20000)) * (radius - minimum)
    const x = spec.origin[0] + Math.cos(angle) * distance
    const z = spec.origin[1] + Math.sin(angle) * distance
    transform.position.set(x, concertLandscapeHeight(spec, [x, z]), z)
    transform.rotation.y = sample(index + 40000) * Math.PI * 2
    transform.scale.setScalar(0.75 + sample(index + 60000) * 0.75)
    transform.updateMatrix()
    mesh.setMatrixAt(index, transform.matrix)
  }
  mesh.instanceMatrix.needsUpdate = true
  mesh.computeBoundingSphere()
}

function daisy(THREE: typeof Three): Three.BufferGeometry {
  const into = new BanquetDetailBuilder(THREE)
  into.cylinder(
    { radius: 0.009, height: 0.36, sides: 4, open: true },
    {
      at: [0, 0.18, 0],
      colour: 0x668449,
    },
  )
  for (let petal = 0; petal < 8; petal++) {
    const angle = (petal * Math.PI) / 4
    const geometry = new THREE.CircleGeometry(0.039, 5).scale(1, 2.5, 1)
    geometry.rotateX(-Math.PI / 2).rotateY(angle)
    into.add(geometry, {
      at: [Math.sin(angle) * 0.065, 0.36, Math.cos(angle) * 0.065],
      colour: 0xfffbea,
    })
  }
  const core = new THREE.CircleGeometry(0.043, 8).rotateX(-Math.PI / 2)
  into.add(core, { at: [0, 0.365, 0], colour: 0xe1b753 })
  const leaves = new THREE.CircleGeometry(0.035, 4).scale(1, 2.5, 1).rotateX(-0.8)
  into.add(leaves, { at: [0.03, 0.15, 0], colour: 0x7d994f })
  const temporary = into.finish()
  const mesh = temporary.children[0] as Three.Mesh
  ;(mesh.material as Three.Material).dispose()
  return mesh.geometry
}

function flowerMaterial(THREE: typeof Three): Three.MeshBasicMaterial {
  const material = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })
  material.name = 'concert-daisy-petals'
  return material
}

function distantDaisy(THREE: typeof Three): Three.BufferGeometry {
  const geometry = new THREE.PlaneGeometry(0.38, 0.38)
  geometry.rotateX(-Math.PI / 2).translate(0, 0.35, 0)
  return geometry
}

function distantMaterial(THREE: typeof Three): Three.MeshBasicMaterial {
  const material = new THREE.MeshBasicMaterial({ color: 0xfffbe9, side: THREE.DoubleSide })
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = '#define USE_UV\n' + shader.vertexShader
    shader.fragmentShader = '#define USE_UV\n' + shader.fragmentShader
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `
      #include <color_fragment>
      vec2 flower = vUv * 2.0 - 1.0;
      float radius = length(flower);
      float edge = 0.70 + 0.24 * cos(atan(flower.y, flower.x) * 8.0);
      if (radius > edge) discard;
      if (radius < 0.25) diffuseColor.rgb = vec3(0.75, 0.51, 0.14);
    `,
    )
  }
  material.customProgramCacheKey = () => 'concert-distant-daisies-v1'
  return material
}
