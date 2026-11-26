import type * as Three from 'three'
import { ceilingOf, floorOf, type TierPlan } from './blueprint'
import { DETAIL_TAGS_KEY, type TourDetailTag } from './detailTag'
import {
  DINING_STAIR_SOURCE,
  DINING_VISIT_SPACES as spaces,
  DINING_VISIT_STAIR,
  DINING_VISIT_UPPER_LANE,
  DINING_VISIT_LOWER_LANE,
} from './diningVisit'
import type { Vec2 } from './types'

interface Sign {
  at: Vec2
  facing: number
  height: number
  title: string
  subtitle: string
  arrow: string
  tag?: TourDetailTag
}

const SIGNS: Readonly<Record<string, readonly Sign[]>> = {
  [spaces.start]: [
    {
      at: [56.9, -17.5],
      facing: Math.PI,
      height: 2.45,
      title: 'PONT 5 / DECK 5',
      subtitle: 'RÉFECTOIRE / REFECTORY',
      arrow: '→',
    },
  ],
  [spaces.passage]: [
    {
      at: [45, DINING_VISIT_UPPER_LANE],
      facing: Math.PI / 2,
      height: 2.45,
      title: 'PONT 5 / DECK 5',
      subtitle: 'RÉFECTOIRE / REFECTORY',
      arrow: '↑',
    },
    {
      at: [8, DINING_VISIT_UPPER_LANE],
      facing: Math.PI / 2,
      height: 2.45,
      title: 'PONT 5 / DECK 5',
      subtitle: 'RÉFECTOIRE / REFECTORY',
      arrow: '↑',
    },
    {
      at: [-37, DINING_VISIT_UPPER_LANE],
      facing: Math.PI / 2,
      height: 2.45,
      title: 'PONT 5 / DECK 5',
      subtitle: 'RÉFECTOIRE / REFECTORY',
      arrow: '↗',
    },
    {
      at: [-43, -17.5],
      facing: Math.PI / 2,
      height: 1.63,
      title: 'PONT 4 → 5 / DECKS 4 → 5',
      subtitle: 'PASSAGE CENTRAL · CH. 380',
      arrow: '↓',
      tag: DINING_STAIR_SOURCE,
    },
  ],
  [spaces.landing]: [
    {
      at: [-44.5, -17.5],
      facing: Math.PI / 2,
      height: 1.9,
      title: 'PONT 5 / DECK 5',
      subtitle: 'RÉFECTOIRE / REFECTORY',
      arrow: '←',
    },
    {
      at: [DINING_VISIT_LOWER_LANE, -14],
      facing: Math.PI,
      height: 2.45,
      title: 'RÉFECTOIRE',
      subtitle: 'REFECTORY',
      arrow: '↑',
    },
    {
      at: [DINING_VISIT_LOWER_LANE, 7],
      facing: Math.PI,
      height: 2.45,
      title: 'RÉFECTOIRE',
      subtitle: 'REFECTORY',
      arrow: '←',
    },
    {
      at: [-42, -16.5],
      facing: 0,
      height: 2.45,
      title: 'PONT 4 / DECK 4',
      subtitle: 'PASSAGE CENTRAL',
      arrow: '↑',
    },
  ],
  [spaces.hall]: [
    {
      at: [30.5, 13.2],
      facing: Math.PI,
      height: 2.65,
      title: 'TABLE DE FRANKLIN',
      subtitle: 'FRANKLIN’S TABLE',
      arrow: '←',
    },
  ],
  [spaces.transverse]: [
    {
      at: [-28, 7],
      facing: -Math.PI / 2,
      height: 2.45,
      title: 'RÉFECTOIRE',
      subtitle: 'REFECTORY',
      arrow: '↑',
    },
    {
      at: [29.75, 10.3],
      facing: Math.PI,
      height: 2.45,
      title: 'RÉFECTOIRE CENTRAL',
      subtitle: 'CENTRAL REFECTORY',
      arrow: '',
    },
    {
      at: [29.75, 7],
      facing: -Math.PI / 2,
      height: 2.45,
      title: 'RÉFECTOIRE',
      subtitle: 'REFECTORY',
      arrow: '→',
    },
    {
      at: [17, 7],
      facing: Math.PI / 2,
      height: 2.45,
      title: 'PONT 4 / DECK 4',
      subtitle: 'PASSAGE CENTRAL',
      arrow: '↑',
    },
  ],
}

function signTexture(THREE: typeof Three, sign: Sign): Three.CanvasTexture | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.fillStyle = '#0c272b'
  ctx.fillRect(0, 0, 512, 128)
  ctx.strokeStyle = '#b6dcd4'
  ctx.lineWidth = 4
  ctx.strokeRect(4, 4, 504, 120)
  const textLeft = sign.arrow ? 110 : 24
  ctx.fillStyle = '#e6f8ec'
  ctx.font = 'bold 40px sans-serif'
  ctx.fillText(sign.title, textLeft, 57, 484 - textLeft)
  ctx.font = 'bold 28px sans-serif'
  ctx.fillText(sign.subtitle, textLeft, 100, 484 - textLeft)
  ctx.fillStyle = '#ffd089'
  ctx.font = 'bold 70px sans-serif'
  ctx.fillText(sign.arrow, 22, 88)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function buildSign(THREE: typeof Three, sign: Sign, ceiling: number): Three.Group {
  const texture = signTexture(THREE, sign)
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    color: texture ? 0xffffff : 0x173e42,
  })
  if (texture) material.addEventListener('dispose', () => texture.dispose())
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(2.35, 0.59), material)
  plate.name = sign.tag?.id ?? sign.title
  if (sign.tag) plate.userData[DETAIL_TAGS_KEY] = [{ start: 0, count: 2, tag: sign.tag }]

  const group = new THREE.Group()
  group.rotation.y = sign.facing
  group.add(plate)
  const height = ceiling - sign.height - 0.29
  const bracket = new THREE.Mesh(
    new THREE.BoxGeometry(0.055, height, 0.055),
    new THREE.MeshBasicMaterial({ color: 0x485357 }),
  )
  bracket.position.set(0, 0.29 + height / 2, -0.035)
  group.add(bracket)
  return group
}

function landingMark(THREE: typeof Three, floor: number): Three.Mesh {
  const mark = new THREE.Mesh(
    new THREE.RingGeometry(0.68, 0.79, 24),
    new THREE.MeshBasicMaterial({ color: 0xffcb72 }),
  )
  mark.name = 'decks-4-5-landing'
  mark.rotation.x = -Math.PI / 2
  mark.position.set(DINING_VISIT_STAIR[0], floor + 0.025, DINING_VISIT_STAIR[1])
  return mark
}

function passageLane(THREE: typeof Three, floor: number, spaceId: string): Three.Mesh {
  const upper = spaceId === spaces.passage
  // The route bypasses the internal stairs to decks 4-B and 5-B.
  const stripe = new THREE.Mesh(
    new THREE.PlaneGeometry(upper ? 85 : 24.5, 0.085),
    new THREE.MeshBasicMaterial({ color: 0xb6dcd4 }),
  )
  stripe.name = 'wayfinding-to-refectory'
  stripe.rotation.set(-Math.PI / 2, 0, upper ? 0 : Math.PI / 2)
  stripe.position.set(
    upper ? 6.5 : DINING_VISIT_LOWER_LANE,
    floor + 0.022,
    upper ? DINING_VISIT_UPPER_LANE : -5.25,
  )
  return stripe
}

export function addDiningVisitSigns(options: {
  THREE: typeof Three
  plan: TierPlan
  spaceId: string
  root: Three.Group
}): void {
  const { THREE, plan, spaceId, root } = options
  const signs = SIGNS[spaceId]
  if (!signs) return
  const space = plan.spaces.find((candidate) => candidate.id === spaceId)
  if (!space) return
  const floor = floorOf(space, plan.tier)
  if (spaceId === spaces.passage || spaceId === spaces.landing) {
    root.add(landingMark(THREE, floor), passageLane(THREE, floor, spaceId))
  }
  const ceiling = ceilingOf(space, plan.tier)
  for (const sign of signs) {
    const plate = buildSign(THREE, sign, ceiling)
    plate.position.set(sign.at[0], floor + sign.height, sign.at[1])
    root.add(plate)
  }
}
