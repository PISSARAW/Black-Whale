import type { Group } from 'three'
import {
  PAIN,
  painPart,
  painMerge,
  painPanel,
  painCurve,
  painFront,
  type PainKit,
} from './painPackerParts'

export function buildPainPackerChest(kit: PainKit, chest: Group) {
  const { THREE } = kit
  const chestDepth = (x: number, y: number) =>
    painFront(
      [
        [0.145, -0.48],
        [0.17, -0.31],
        [0.215, -0.04],
        [0.19, 0.035],
        [0.075, 0.13],
      ],
      [x, y],
      0.74,
    )
  painPart(kit, chest, {
    name: 'pain-packer-chest-shell',
    colour: PAIN.white,
    make: () =>
      new THREE.LatheGeometry(
        [
          new THREE.Vector2(0.145, -0.48),
          new THREE.Vector2(0.17, -0.31),
          new THREE.Vector2(0.215, -0.04),
          new THREE.Vector2(0.19, 0.035),
          new THREE.Vector2(0.075, 0.13),
        ],
        32,
      ).scale(1, 1, 0.74),
  })
  painPart(kit, chest, {
    name: 'pain-packer-burgundy-chest-trim',
    colour: PAIN.red,
    make: () =>
      painMerge([
        painPanel(
          kit,
          [
            [-0.01, -0.47],
            [0.01, -0.47],
            [0.01, 0.11],
            [-0.01, 0.11],
          ],
          chestDepth,
        ),
        ...[-1, 1].map((side) =>
          painPanel(
            kit,
            [
              [0, 0.1],
              [side * 0.14, 0.06],
              [side * 0.185, -0.01],
              [side * 0.13, -0.17],
              [side * 0.105, -0.095],
              [side * 0.112, 0.015],
              [0, 0.072],
            ],
            chestDepth,
          ),
        ),
        new THREE.CylinderGeometry(0.149, 0.15, 0.026, 32, 1, true)
          .scale(1, 1, 0.8)
          .translate(0, -0.475, 0),
      ]),
  })
  painPart(kit, chest, {
    name: 'pain-packer-crossed-straps',
    colour: PAIN.black,
    make: () =>
      painMerge(
        [-1, 1].map((side) =>
          painPanel(
            kit,
            [
              [side * 0.18, 0.025],
              [side * 0.195, -0.01],
              [-side * 0.13, -0.41],
              [-side * 0.149, -0.395],
            ],
            (x, y) => chestDepth(x, y) + 0.008,
          ),
        ),
      ),
  })
  painPart(kit, chest, {
    name: 'pain-packer-strap-ring',
    colour: PAIN.red,
    make: () =>
      new THREE.TorusGeometry(0.027, 0.007, 8, 28).translate(
        0,
        -0.195,
        chestDepth(0, -0.195) + 0.011,
      ),
  })
  painPart(kit, chest, {
    name: 'pain-packer-throat-fastener',
    colour: PAIN.steel,
    make: () =>
      painMerge([
        painPanel(
          kit,
          [
            [0, 0.022],
            [-0.012, -0.005],
            [0, -0.036],
            [0.012, -0.005],
          ],
          () => 0.187,
        ),
        painCurve(
          kit,
          [
            [-0.033, -0.017, 0.187],
            [0, -0.035, 0.187],
            [0.033, -0.017, 0.187],
          ],
          0.003,
        ),
      ]),
  })
}

export function buildPainPackerSkirt(kit: PainKit, skirt: Group) {
  const { THREE } = kit
  painPart(kit, skirt, {
    name: 'pain-packer-coat-white-panels',
    colour: PAIN.white,
    make: () =>
      new THREE.LatheGeometry(
        [
          new THREE.Vector2(0.32, -0.74),
          new THREE.Vector2(0.29, -0.6),
          new THREE.Vector2(0.23, -0.28),
          new THREE.Vector2(0.146, 0.035),
        ],
        40,
        0.13,
        Math.PI * 2 - 0.26,
      ).scale(1, 1, 0.77),
  })
  painPart(kit, skirt, {
    name: 'pain-packer-coat-burgundy-hem',
    colour: PAIN.red,
    make: () =>
      new THREE.LatheGeometry(
        [
          new THREE.Vector2(0.324, -0.745),
          new THREE.Vector2(0.311, -0.69),
          new THREE.Vector2(0.303, -0.65),
        ],
        40,
        0.13,
        Math.PI * 2 - 0.26,
      ).scale(1, 1, 0.77),
  })
  const depth = (x: number, y: number) =>
    painFront(
      [
        [0.32, -0.74],
        [0.29, -0.6],
        [0.23, -0.28],
        [0.146, 0.035],
      ],
      [x, y],
    )
  painPart(kit, skirt, {
    name: 'pain-packer-coat-arrow-patterns',
    colour: PAIN.red,
    make: () =>
      painMerge(
        [-1, 1].flatMap((side) => [
          painPanel(
            kit,
            [
              [side * 0.013, 0.03],
              [side * 0.023, 0.03],
              [side * 0.048, -0.69],
              [side * 0.025, -0.69],
            ],
            depth,
          ),
          painPanel(
            kit,
            [
              [side * 0.12, -0.03],
              [side * 0.09, -0.07],
              [side * 0.145, -0.41],
              [side * 0.122, -0.395],
              [side * 0.181, -0.54],
              [side * 0.176, -0.38],
              [side * 0.16, -0.4],
            ],
            depth,
          ),
          painPanel(
            kit,
            [
              [side * 0.16, -0.69],
              [side * 0.18, -0.54],
              [side * 0.221, -0.685],
            ],
            depth,
          ),
        ]),
      ),
  })
  painPart(kit, skirt, {
    name: 'pain-packer-hip-medallion',
    colour: PAIN.red,
    make: () =>
      painMerge([
        new THREE.TorusGeometry(0.038, 0.006, 8, 32).translate(0, -0.27, 0.188),
        painCurve(
          kit,
          [
            [-0.19, -0.27, 0.117],
            [0, -0.27, 0.188],
            [0.19, -0.27, 0.117],
          ],
          0.01,
        ),
      ]),
  })
  painPart(kit, skirt, {
    name: 'pain-packer-medallion-face',
    colour: PAIN.steel,
    make: () => new THREE.CircleGeometry(0.031, 28).translate(0, -0.27, 0.19),
  })
  painPart(kit, skirt, {
    name: 'pain-packer-medallion-spokes',
    colour: PAIN.black,
    make: () =>
      painMerge(
        Array.from({ length: 6 }, (_, i) =>
          new THREE.BoxGeometry(0.002, 0.059, 0.002)
            .rotateZ((i * Math.PI) / 6)
            .translate(0, -0.27, 0.192),
        ),
      ),
  })
  painPart(kit, skirt, {
    name: 'pain-packer-gold-drops',
    colour: PAIN.gold,
    make: () =>
      painMerge(
        [-1, 1].flatMap((side) => [
          new THREE.ConeGeometry(0.012, 0.058, 12).translate(side * 0.064, 0.018, 0.12),
          ...[0.065, 0.14, 0.21].map((x) =>
            new THREE.ConeGeometry(0.01, 0.049, 12).translate(
              side * x,
              -0.25,
              depth(x, -0.25) + 0.006,
            ),
          ),
        ]),
      ),
  })
}
