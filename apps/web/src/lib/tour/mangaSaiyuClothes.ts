import type { Mesh } from 'three'
import type { HumanClothesBuild } from './humanClothes'
import { mangaPanel, mangaChestSurface, mangaBodySections, mangaBodyShape } from './mangaBody'
import { mergeHumanDetails } from './humanDetailGeometry'
import { saiyuCurve, saiyuScroll } from './mangaSaiyuOrnaments'

export function addSaiyuCostume(build: HumanClothesBuild) {
  const { THREE, geometry, figure, materials, profile } = build
  ;(figure.getObjectByName('torso')!.children[1] as Mesh).material =
    materials.skin ?? materials.shirt
  const vest = new THREE.Mesh(
    geometry(THREE, 'manga:saiyu-cropped-vest', () => {
      const shape = mangaBodyShape(profile)
      return new THREE.LatheGeometry(
        mangaBodySections(profile)
          .filter(([, y]) => y >= 1.12)
          .map(([r, y]) => new THREE.Vector2(r + 0.006, y - 1.12)),
        32,
      ).scale(1, 1, shape.depth / shape.chest)
    }),
    materials.cloth,
  )
  vest.name = 'saiyu-cropped-vest'
  vest.position.y = 1.12
  figure.add(vest)
  const trim = new THREE.Mesh(
    geometry(THREE, 'manga:saiyu-vest-gold-trim', () =>
      mergeHumanDetails([
        new THREE.CylinderGeometry(0.058, 0.061, 0.027, 28).translate(0, 0.35, 0),
        new THREE.CylinderGeometry(0.137, 0.133, 0.025, 32, 1, true)
          .scale(1, 1, 0.63)
          .translate(0, 0.002, 0),
        saiyuCurve(
          THREE,
          [
            [-0.06, 0.33, mangaChestSurface(profile, -0.06, 1.45) + 0.025],
            [-0.075, 0.27, mangaChestSurface(profile, -0.075, 1.39) + 0.025],
            [-0.044, 0.239, mangaChestSurface(profile, -0.044, 1.359) + 0.025],
          ],
          0.008,
        ),
        saiyuCurve(
          THREE,
          [
            [0.06, 0.33, mangaChestSurface(profile, 0.06, 1.45) + 0.025],
            [0.075, 0.27, mangaChestSurface(profile, 0.075, 1.39) + 0.025],
            [0.044, 0.239, mangaChestSurface(profile, 0.044, 1.359) + 0.025],
          ],
          0.008,
        ),
        saiyuScroll(THREE, {
          radius: 0.018,
          tube: 0.006,
          at: [-0.044, 0.223, mangaChestSurface(profile, -0.044, 1.343) + 0.028],
        }),
        saiyuScroll(THREE, {
          radius: 0.018,
          tube: 0.006,
          at: [0.044, 0.223, mangaChestSurface(profile, 0.044, 1.343) + 0.028],
          side: -1,
        }),
      ]),
    ),
    materials.accent,
  )
  trim.name = 'saiyu-vest-gold-trim'
  trim.position.y = 1.12
  figure.add(trim)
  for (const [name, points] of [
    [
      'spine',
      [
        [-0.008, 1.125],
        [0.008, 1.125],
        [0.008, 1.46],
        [-0.008, 1.46],
      ],
    ],
    [
      'top',
      [
        [-0.068, 1.3],
        [0.068, 1.3],
        [0.068, 1.285],
        [-0.068, 1.285],
      ],
    ],
    [
      'base',
      [
        [-0.068, 1.225],
        [0.068, 1.225],
        [0.068, 1.21],
        [-0.068, 1.21],
      ],
    ],
    [
      'middle',
      [
        [-0.068, 1.262],
        [0.068, 1.262],
        [0.068, 1.248],
        [-0.068, 1.248],
      ],
    ],
    [
      'left',
      [
        [-0.068, 1.3],
        [-0.052, 1.3],
        [-0.052, 1.21],
        [-0.068, 1.21],
      ],
    ],
    [
      'right',
      [
        [0.052, 1.3],
        [0.068, 1.3],
        [0.068, 1.21],
        [0.052, 1.21],
      ],
    ],
  ] as const)
    mangaPanel(build, {
      name: `saiyu-gold-emblem-${name}`,
      points,
      material: materials.accent,
      lift: 0.022,
    })
  saiyuAbdomen(build)
  addSaiyuHipWrap(build)
}

function saiyuAbdomen(build: HumanClothesBuild) {
  const { THREE, geometry, figure, profile, materials } = build
  const lines = new THREE.Mesh(
    geometry(THREE, 'manga:saiyu-abdominal-lines', () => {
      const lines = [
        [
          [0, 1.105],
          [0, 1.035],
          [0, 0.985],
        ],
        [
          [-0.066, 1.08],
          [-0.038, 1.065],
          [-0.008, 1.075],
        ],
        [
          [0.066, 1.08],
          [0.038, 1.065],
          [0.008, 1.075],
        ],
        [
          [-0.06, 1.018],
          [-0.031, 1.028],
          [-0.008, 1.015],
        ],
        [
          [0.06, 1.018],
          [0.031, 1.028],
          [0.008, 1.015],
        ],
        [
          [-0.09, 1.1],
          [-0.076, 1.04],
          [-0.092, 0.97],
        ],
        [
          [0.09, 1.1],
          [0.076, 1.04],
          [0.092, 0.97],
        ],
      ]
      return mergeHumanDetails(
        lines.map((points) =>
          saiyuCurve(
            THREE,
            points.map(([x, y]) => [x, y - 1.12, mangaChestSurface(profile, x, y) + 0.004]),
            0.0018,
          ),
        ),
      )
    }),
    materials.dark,
  )
  lines.name = 'saiyu-abdominal-lines'
  lines.position.y = 1.12
  figure.add(lines)
}

function addSaiyuHipWrap(build: HumanClothesBuild) {
  const { THREE, geometry, figure, materials } = build
  const wrap = new THREE.Mesh(
    geometry(THREE, 'manga:saiyu-hip-wrap', () =>
      new THREE.CylinderGeometry(0.131, 0.153, 0.22, 32).scale(1, 1, 0.72),
    ),
    materials.cloth,
  )
  wrap.name = 'saiyu-hip-wrap'
  wrap.position.y = 0.845
  figure.add(wrap)
  const trim = new THREE.Mesh(
    geometry(THREE, 'manga:saiyu-hip-gold-trim', () =>
      mergeHumanDetails([
        new THREE.CylinderGeometry(0.133, 0.132, 0.02, 32, 1, true)
          .scale(1, 1, 0.72)
          .translate(0, 0.1, 0),
        new THREE.CylinderGeometry(0.155, 0.154, 0.02, 32, 1, true)
          .scale(1, 1, 0.72)
          .translate(0, -0.105, 0),
        saiyuScroll(THREE, { radius: 0.018, tube: 0.005, at: [-0.022, 0.073, 0.1] }),
        saiyuScroll(THREE, { radius: 0.018, tube: 0.005, at: [0.022, 0.073, 0.1], side: -1 }),
        saiyuCurve(
          THREE,
          [
            [-0.105, -0.07, 0.067],
            [-0.04, -0.1, 0.108],
            [0, -0.064, 0.117],
            [0.04, -0.1, 0.108],
            [0.105, -0.07, 0.067],
          ],
          0.006,
        ),
      ]),
    ),
    materials.accent,
  )
  trim.name = 'saiyu-hip-gold-trim'
  trim.position.y = 0.845
  figure.add(trim)
  const tail = new THREE.Mesh(
    geometry(THREE, 'manga:saiyu-curled-tail', () =>
      saiyuCurve(
        THREE,
        [
          [0, 0, -0.105],
          [0.17, 0.06, -0.14],
          [0.25, 0.23, -0.13],
          [0.37, 0.26, -0.1],
          [0.4, 0.18, -0.07],
          [0.33, 0.12, -0.07],
        ],
        0.021,
      ),
    ),
    materials.shirt,
  )
  tail.name = 'saiyu-curled-tail'
  tail.position.y = 0.83
  figure.add(tail)
}
