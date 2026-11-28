import type { Group, Material, Mesh } from 'three'
import type { HumanClothesBuild } from './humanClothes'
import { hisokaFabricMaterial, shadeHisokaFabric } from './hisokaFabric'
import { kurapikaPanel, kurapikaSurfacePanel, type Point3 } from './kurapikaGeometry'
import { mangaChestSurface, mangaClothesKey } from './mangaBody'
import { mergeHumanDetails } from './humanDetailGeometry'

const VEST = [
  [0.006, 0.88],
  [0.057, 0.847],
  [0.134, 0.883],
  [0.143, 1.08],
  [0.164, 1.206],
  [0.178, 1.306],
  [0.176, 1.366],
  [0.125, 1.423],
  [0.057, 1.471],
  [0.065, 1.381],
  [0.033, 1.243],
  [0.006, 1.15],
] as const
const YOKE = [
  [0.057, 1.47],
  [0.124, 1.424],
  [0.179, 1.37],
  [0.184, 1.315],
  [0.073, 1.353],
  [0.063, 1.401],
] as const
const COLLAR: readonly Point3[] = [
  [0.036, 1.517, 0.055],
  [0.061, 1.522, 0.023],
  [0.085, 1.478, 0.063],
  [0.066, 1.399, 0.112],
  [0.026, 1.443, 0.11],
  [0.042, 1.477, 0.072],
]

/** Tailored panels follow the animated chest rather than the root of the actor. */
export function addMangaWaistcoat(build: HumanClothesBuild) {
  const { THREE, geometry, figure, profile, frame, materials } = build
  const torso = figure.getObjectByName('torso') as Group
  const key = mangaClothesKey(profile)
  const y0 = torso.position.y
  const sx = profile.shoulders * frame.width
  const sy = frame.neck
  const vest = hisokaFabricMaterial(THREE, materials.cloth)
  const shirt = hisokaFabricMaterial(THREE, materials.shirt)
  const dark = hisokaFabricMaterial(THREE, materials.dark)
  const edging = new THREE.MeshBasicMaterial({ color: 0xb3a3a3 })
  const metal = new THREE.MeshBasicMaterial({ color: 0x9c8079 })
  const jewel = new THREE.MeshBasicMaterial({ color: 0x722b4b })
  const button = new THREE.MeshBasicMaterial({ color: 0x3b3540 })
  const collarFabric = hisokaFabricMaterial(THREE, materials.shirt, false)

  // Use the existing rig's torso as the backing. The panels have their own cloth relief.
  const body = torso.children[1] as Mesh
  const backing = body.geometry
  body.geometry = geometry(THREE, `hisoka:vest-back:${key}`, () => {
    const g = backing.clone()
    const uv = g.getAttribute('uv')
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 3, uv.getY(i) * 2)
    return shadeHisokaFabric(THREE, g)
  })
  body.material = vest

  const depth = (x: number, y: number) => mangaChestSurface(profile, x, y)
  const fold = (x: number, y: number) => {
    const px = Math.abs(x) / sx
    const py = y / sy
    const dart = Math.exp(-(((px - (0.096 + (py - 1.05) * 0.09)) / 0.019) ** 2))
    const crease = Math.exp(-(((py - (1.04 + px * 0.53)) / 0.021) ** 2))
    return 0.011 * dart - 0.006 * crease
  }

  function panel(
    name: string,
    points: readonly (readonly [number, number])[],
    { material, surface }: { material: Material; surface: typeof depth },
  ) {
    const g = geometry(THREE, `hisoka:${key}:${name}`, () => {
      const mesh = kurapikaSurfacePanel(THREE, {
        points: points.map(([x, y]) => [x * sx, y * sy, 0]),
        depth: surface,
      })
      const position = mesh.getAttribute('position')
      const normal = mesh.getAttribute('normal')
      const uv = new Float32Array(position.count * 2)
      const dir = new THREE.Vector3()
      const delta = 0.003
      for (let i = 0; i < position.count; i++) {
        const x = position.getX(i)
        const y = position.getY(i)
        dir
          .set(
            surface(x - delta, y) - surface(x + delta, y),
            surface(x, y - delta) - surface(x, y + delta),
            2 * delta,
          )
          .normalize()
        normal.setXYZ(i, dir.x, dir.y, dir.z)
        uv.set([x * 4, y * 4], i * 2)
      }
      mesh.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
      return shadeHisokaFabric(THREE, mesh.translate(0, -y0, 0))
    })
    const mesh = new THREE.Mesh(g, material)
    mesh.name = name
    torso.add(mesh)
  }

  const vestSurface = (x: number, y: number) => depth(x, y) + 0.024 + fold(x, y)
  panel(
    'hisoka-waistcoat-opening',
    [
      [-0.08, 1.469],
      [-0.1, 1.4],
      [-0.05, 1.235],
      [0, 1.135],
      [0.05, 1.235],
      [0.1, 1.4],
      [0.08, 1.469],
    ],
    {
      material: shirt,
      surface: (x, y) => Math.max(0.076, depth(x, y)) + 0.012 + 0.004 * Math.cos(x * 70 + y * 39),
    },
  )
  if (materials.skin && profile.shirt !== profile.skin)
    panel(
      'hisoka-open-neck',
      [
        [-0.045, 1.522],
        [0.047, 1.522],
        [0.04, 1.459],
        [0, 1.376],
        [-0.03, 1.46],
      ],
      {
        material: hisokaFabricMaterial(THREE, materials.skin, false),
        surface: (x, y) => Math.max(0.074, depth(x, y) + 0.005) + Math.max(0, 1.51 - y) * 0.12,
      },
    )

  const seamPaths: Point3[][] = []
  for (const side of [-1, 1]) {
    const suffix = side < 0 ? 'left' : 'right'
    const mirror = (points: readonly (readonly [number, number])[]) =>
      points.map(([x, y]) => [side * x, y] as const)
    panel(`hisoka-waistcoat-${suffix}`, mirror(VEST), { material: vest, surface: vestSurface })
    panel(`hisoka-waistcoat-yoke-${side}`, mirror(YOKE), {
      material: dark,
      surface: (x, y) => vestSurface(x, y) + 0.006,
    })
    const collar = geometry(THREE, `hisoka:${key}:collar:${suffix}`, () =>
      shadeHisokaFabric(
        THREE,
        kurapikaPanel(
          THREE,
          COLLAR.map(([x, y, z]) => [x * sx * side, y * sy - y0, z]),
        ),
      ),
    )
    const flap = new THREE.Mesh(collar, collarFabric)
    flap.name = `hisoka-shirt-collar-${side}`
    torso.add(flap)
    const onVest = (points: readonly (readonly [number, number])[]) =>
      mirror(points).map(([x, y]): Point3 => {
        const px = x * sx,
          py = y * sy
        return [px, py - y0, vestSurface(px, py) + 0.004]
      })
    seamPaths.push(
      onVest([
        [0.058, 1.468],
        [0.064, 1.386],
        [0.033, 1.244],
        [0.006, 1.151],
        [0.006, 0.94],
        [0.006, 0.88],
        [0.057, 0.848],
        [0.133, 0.884],
      ]),
      onVest([
        [0.179, 1.368],
        [0.174, 1.304],
        [0.16, 1.242],
        [0.147, 1.19],
      ]),
      onVest([
        [0.069, 0.996],
        [0.087, 1.004],
        [0.121, 1.016],
      ]),
    )
  }
  const collarStand = new THREE.Mesh(
    geometry(THREE, 'hisoka:collar-stand', () =>
      shadeHisokaFabric(
        THREE,
        new THREE.CylinderGeometry(0.058, 0.074, 0.061, 28, 3, true, 0.67, Math.PI * 2 - 1.34),
      ),
    ),
    collarFabric,
  )
  collarStand.name = 'hisoka-shirt-collar-stand'
  collarStand.position.set(0, 1.491 * sy - y0, 0)
  torso.add(collarStand)
  const trim = new THREE.Mesh(
    geometry(THREE, `hisoka:${key}:trim`, () =>
      mergeHumanDetails(
        seamPaths.map(
          (points, index) =>
            new THREE.TubeGeometry(
              new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point))),
              points.length * 5,
              index % 3 === 2 ? 0.003 : 0.0026,
              5,
            ),
        ),
      ),
    ),
    edging,
  )
  trim.name = 'hisoka-waistcoat-trim'
  torso.add(trim)
  for (let index = 0; index < 4; index++) {
    const y = (1.136 - index * 0.072) * sy
    const fastener = new THREE.Mesh(
      geometry(THREE, 'hisoka:vest-button', () =>
        new THREE.SphereGeometry(0.009, 14, 8).scale(1, 1, 0.47),
      ),
      button,
    )
    fastener.name = `hisoka-waistcoat-button-${index}`
    fastener.position.set(0, y - y0, vestSurface(0, y) + 0.003)
    torso.add(fastener)
  }
  const pendant = new THREE.Group()
  pendant.name = 'hisoka-pendant'
  pendant.position.set(0, 1.345 * sy - y0, depth(0, 1.345 * sy) + 0.016)
  const setting = new THREE.Mesh(
    geometry(THREE, 'hisoka:pendant-setting', () =>
      mergeHumanDetails([
        new THREE.TorusGeometry(0.015, 0.0028, 8, 24).scale(0.8, 1.15, 1).translate(0, -0.039, 0),
        new THREE.TorusGeometry(0.0045, 0.0018, 6, 12).translate(0, -0.018, 0),
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.02, 0.037, -0.02),
            new THREE.Vector3(-0.006, 0.003, -0.004),
            new THREE.Vector3(0, -0.017, 0),
            new THREE.Vector3(0.008, 0.005, -0.004),
            new THREE.Vector3(0.024, 0.04, -0.025),
          ]),
          24,
          0.0015,
          5,
        ),
      ]),
    ),
    metal,
  )
  const gem = new THREE.Mesh(
    geometry(THREE, 'hisoka:pendant-gem', () =>
      new THREE.SphereGeometry(1, 20, 12).scale(0.01, 0.015, 0.006).translate(0, -0.039, 0.001),
    ),
    jewel,
  )
  pendant.add(setting, gem)
  torso.add(pendant)
}
