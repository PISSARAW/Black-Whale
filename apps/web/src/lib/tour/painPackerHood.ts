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

export function buildPainPackerHood(kit: PainKit, hood: Group) {
  const { THREE } = kit
  painPart(kit, hood, {
    name: 'pain-packer-pointed-hood',
    colour: PAIN.red,
    make: () =>
      new THREE.LatheGeometry(
        [
          new THREE.Vector2(0.072, -0.215),
          new THREE.Vector2(0.164, -0.12),
          new THREE.Vector2(0.205, 0.035),
          new THREE.Vector2(0.16, 0.16),
          new THREE.Vector2(0.012, 0.37),
          new THREE.Vector2(0, 0.38),
        ],
        32,
      ).scale(1, 1, 0.84),
  })
  const front = (x: number, y: number) =>
    painFront(
      [
        [0.072, -0.215],
        [0.164, -0.12],
        [0.205, 0.035],
        [0.16, 0.16],
        [0.012, 0.37],
        [0, 0.38],
      ],
      [x, y],
      0.84,
    )
  painPart(kit, hood, {
    name: 'pain-packer-high-collar',
    colour: PAIN.red,
    make: () => new THREE.CylinderGeometry(0.1, 0.095, 0.23, 28).translate(0, -0.255, 0),
  })
  painPart(kit, hood, {
    name: 'pain-packer-white-hood-markings',
    colour: PAIN.white,
    make: () =>
      painMerge([
        painPanel(
          kit,
          [
            [0, 0.345],
            [-0.027, 0.32],
            [-0.018, 0.23],
            [-0.032, 0.15],
            [-0.016, 0.072],
            [-0.045, -0.032],
            [0, -0.085],
            [0.045, -0.032],
            [0.016, 0.072],
            [0.032, 0.15],
            [0.018, 0.23],
            [0.027, 0.32],
          ],
          front,
        ),
        ...[-1, 1].map((side) =>
          painPanel(
            kit,
            [
              [0.014 * side, 0.1],
              [0.103 * side, 0.18],
              [0.15 * side, 0.165],
              [0.11 * side, 0.15],
              [0.154 * side, 0.135],
              [0.1 * side, 0.124],
              [0.143 * side, 0.105],
              [0.13 * side, 0.085],
              [0.04 * side, 0.094],
              [0.017 * side, 0.055],
            ],
            front,
          ),
        ),
        painPanel(
          kit,
          [
            [-0.012, -0.095],
            [0.012, -0.095],
            [0.018, -0.216],
            [-0.018, -0.216],
          ],
          front,
        ),
      ]),
  })
  painPart(kit, hood, {
    name: 'pain-packer-hood-centre-cut',
    colour: PAIN.black,
    make: () =>
      painPanel(
        kit,
        [
          [0, 0.327],
          [-0.008, 0.31],
          [0, 0.16],
          [0.008, 0.31],
        ],
        (x, y) => front(x, y) + 0.002,
      ),
  })
  painPart(kit, hood, {
    name: 'high-mouth-guard',
    colour: PAIN.black,
    make: () =>
      painPanel(
        kit,
        [
          [-0.143, -0.025],
          [-0.12, -0.096],
          [0, -0.15],
          [0.12, -0.096],
          [0.143, -0.025],
          [0, -0.09],
        ],
        () => 0.188,
      ),
  })
  painPart(kit, hood, {
    name: 'pain-packer-grille-rim',
    colour: PAIN.white,
    make: () =>
      painCurve(
        kit,
        [
          [-0.144, -0.025, 0.191],
          [-0.125, -0.098, 0.191],
          [0, -0.151, 0.191],
          [0.125, -0.098, 0.191],
          [0.144, -0.025, 0.191],
          [0, -0.09, 0.191],
          [-0.144, -0.025, 0.191],
        ],
        0.003,
      ),
  })
  painPart(kit, hood, {
    name: 'pain-packer-dentate-grille',
    colour: PAIN.steel,
    make: () =>
      painMerge(
        Array.from({ length: 17 }, (_, i) => {
          const x = (i - 8) * 0.014,
            y = -0.116 + Math.abs(x) * 0.42
          return new THREE.BoxGeometry(0.004, 0.025, 0.003).rotateZ(-x * 2).translate(x, y, 0.194)
        }),
      ),
  })
}
