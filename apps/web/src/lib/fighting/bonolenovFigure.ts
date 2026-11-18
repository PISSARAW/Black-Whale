import { addBonolenovBattleArmor, bareBonolenovBody } from '$lib/tour/bonolenovBattleArmor'
import type { HumanFigure, HumanFigureBuild } from '$lib/tour/humanFigure'
import type { ArcadeFighter } from './types'
import { bonolenovInstrumentExposed } from './bonolenovInstrument'

export function battleFigureKey(fighter: ArcadeFighter) {
  const battle = fighter.battleCantabile
  return [battle?.form?.model, Boolean(battle?.prologue), bonolenovInstrumentExposed(fighter)]
}

export function battleNeedsSkin(fighter: ArcadeFighter): boolean {
  return Boolean(fighter.textureSurprise || bonolenovInstrumentExposed(fighter))
}

/** Prologue conjures attire and a real spear; appearance copying grants no equipment powers. */
export function addBonolenovPrologue(options: {
  THREE: HumanFigureBuild['THREE']
  glow: HumanFigureBuild['glow']
  model: HumanFigure
  fighter: ArcadeFighter
}): void {
  const { THREE, glow, model, fighter } = options
  if (bonolenovInstrumentExposed(fighter)) exposeInstrument(options)
  if (!fighter.battleCantabile?.prologue) return
  addBonolenovBattleArmor({ THREE, glow, model })
}

function exposeInstrument({ THREE, glow, model }: Parameters<typeof addBonolenovPrologue>[0]) {
  // The instrument is his articulated body, not six dots hovering over wrapped clothing.
  bareBonolenovBody(model, glow)
  const bandages = model.root.getObjectByName('signature-bandages')
  if (bandages) bandages.visible = false
  const holes = new THREE.Group()
  holes.name = 'bonolenov-exposed-body-holes'
  const torso = model.root.getObjectByName('torso')!
  torso.updateWorldMatrix(true, true)
  const ray = new THREE.Raycaster()
  for (const x of [-0.1, 0.1])
    for (const y of [0.86, 1.02, 1.18]) {
      ray.set(
        torso.localToWorld(new THREE.Vector3(x, y - 1.12, 1)),
        new THREE.Vector3(0, 0, -1).transformDirection(torso.matrixWorld),
      )
      const contact = ray.intersectObject(torso.children[1], false)[0]
      if (!contact) continue
      const hole = new THREE.Mesh(new THREE.CircleGeometry(0.023, 10), glow(0x20191b, 1))
      hole.position.copy(torso.worldToLocal(contact.point))
      hole.position.z += 0.002
      holes.add(hole)
    }
  torso.add(holes)
  for (const side of ['left', 'right']) addLimbOpenings({ THREE, glow, model }, side)
}

function addLimbOpenings(
  {
    THREE,
    glow,
    model,
  }: Pick<Parameters<typeof addBonolenovPrologue>[0], 'THREE' | 'glow' | 'model'>,
  side: string,
) {
  for (const part of ['shoulder', 'elbow', 'hand']) {
    const limb = model.root.getObjectByName(`${part}-${side}`)
    if (!limb) continue
    const group = new THREE.Group()
    group.name = 'bonolenov-exposed-body-holes'
    for (const y of part === 'hand' ? [-0.025] : [-0.09, -0.2]) {
      const hole = new THREE.Mesh(
        new THREE.CircleGeometry(part === 'shoulder' ? 0.023 : 0.014, 10),
        glow(0x20191b, 1),
      )
      hole.name = 'gyudondond-musical-opening'
      hole.position.set(0, y, part === 'shoulder' ? 0.055 : 0.043)
      group.add(hole)
    }
    limb.add(group)
  }
}
