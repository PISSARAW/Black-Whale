import { createVisitHatsuModel } from './visitHatsuModel'
import type { HumanFigure, HumanFigureBuild } from '$lib/tour/humanFigure'
import { CANON } from '$lib/tour/humanProportions'
import { paperAvailable } from './kallutoPaper'
import type { ArcadeFighter, FightNenZone } from './types'

type Three = HumanFigureBuild['THREE']
const SHAPES = new WeakMap<Three, ReturnType<typeof makeShapes>>()
function makeShapes(THREE: Three) {
  const shapes = {
    scrap: new THREE.BoxGeometry(0.045, 0.065, 0.012),
    fan: new THREE.CircleGeometry(0.26, 12, 0, Math.PI),
    rib: new THREE.BoxGeometry(0.008, 0.25, 0.016),
  }
  Object.values(shapes).forEach((shape) => (shape.userData.sharedHuman = true))
  return shapes
}

/** Attach physical paper to the rendered skeleton, which has its own stature and animation. */
export function addKallutoPaper(options: {
  THREE: Three
  glow: HumanFigureBuild['glow']
  fighter: ArcadeFighter
  model: HumanFigure
}): void {
  const { THREE, glow, fighter, model } = options
  let shapes = SHAPES.get(THREE)
  if (!shapes) {
    shapes = makeShapes(THREE)
    SHAPES.set(THREE, shapes)
  }
  const paper = glow(0xf4e9e5, 1)
  for (const mark of fighter.plantedPaper ?? []) {
    const scrap = new THREE.Mesh(shapes.scrap, paper)
    scrap.name = `kalluto-paper:${mark.owner}:${mark.zone}`
    const at = paperAttachment(model, mark.zone)
    scrap.position.set(...at.position)
    scrap.rotation.z = 0.35
    at.parent.add(scrap)
  }
  if (fighter.id === 'kalluto' || paperAvailable(fighter)) addFan(options, shapes)
  if (!fighter.kallutoPaper?.doll) return
  const visual = createVisitHatsuModel(THREE, { model: 'paper-doll', figureOwned: true })
  visual.fit({ height: 0.25, width: 0.2 })
  const doll = visual.root
  doll.name = 'kalluto-listening-doll'
  doll.position.z = 0.025
  model.root.getObjectByName('hand-left')?.add(doll)
}
function addFan(
  options: Parameters<typeof addKallutoPaper>[0],
  shapes: ReturnType<typeof makeShapes>,
) {
  const { THREE, glow, model } = options
  const paper = glow(0xf4e9e5, 1)
  paper.side = THREE.DoubleSide
  const fan = new THREE.Group()
  fan.name = 'kalluto-paper-fan'
  fan.position.set(0, -0.015, 0.055)
  fan.rotation.z = Math.PI
  fan.add(new THREE.Mesh(shapes.fan, paper))
  for (let i = 0; i < 7; i++) {
    const angle = (i / 6) * Math.PI
    const rib = new THREE.Mesh(shapes.rib, glow(0x796f66, 1))
    rib.position.set(Math.cos(angle) * 0.12, Math.sin(angle) * 0.12, 0.01)
    rib.rotation.z = angle - Math.PI / 2
    fan.add(rib)
  }
  model.root.getObjectByName('hand-right')?.add(fan)
}

function paperAttachment(model: HumanFigure, zone: FightNenZone) {
  const joint = zone === 'hands' ? 'hand-left' : zone === 'feet' ? 'knee-right' : ''
  const parent = (joint ? model.root.getObjectByName(joint) : undefined) ?? model.lod.near
  const position: [number, number, number] =
    zone === 'head'
      ? [0, CANON.headY, 0.21]
      : zone === 'torso'
        ? [0, 1.2, 0.19]
        : zone === 'feet'
          ? [0, -0.28, 0.13]
          : [0, 0, 0.07]
  return { parent, position }
}
