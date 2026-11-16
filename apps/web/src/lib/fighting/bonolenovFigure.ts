import type { HumanFigure, HumanFigureBuild } from '$lib/tour/humanFigure'
import type { ArcadeFighter } from './types'

export function battleFigureKey(fighter: ArcadeFighter) {
  const battle = fighter.battleCantabile
  return [battle?.form?.model, Boolean(battle?.prologue), Boolean(battle?.preparation)]
}

export function battleNeedsSkin(fighter: ArcadeFighter): boolean {
  return Boolean(
    fighter.textureSurprise ||
    fighter.battleCantabile?.preparation ||
    fighter.battleCantabile?.prologue,
  )
}

/** Prologue conjures attire and a real spear; appearance copying grants no equipment powers. */
export function addBonolenovPrologue(options: {
  THREE: HumanFigureBuild['THREE']
  glow: HumanFigureBuild['glow']
  model: HumanFigure
  fighter: ArcadeFighter
}): void {
  const { THREE, glow, model, fighter } = options
  if (fighter.battleCantabile?.preparation || fighter.battleCantabile?.prologue) {
    const holes = new THREE.Group()
    holes.name = 'bonolenov-exposed-body-holes'
    for (const x of [-0.19, 0.19])
      for (const y of [0.86, 1.02, 1.18]) {
        const hole = new THREE.Mesh(new THREE.CircleGeometry(0.035, 10), glow(0x20191b, 1))
        hole.position.set(x, y, 0.245)
        holes.add(hole)
      }
    model.turns.add(holes)
  }
  if (!fighter.battleCantabile?.prologue) return
  const costume = new THREE.Group()
  costume.name = 'bonolenov-prologue-attire'
  const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.5, 8, 1, true), glow(0xb98b55, 1))
  skirt.position.y = 0.65
  const chest = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.23, 0.45, 8, 1, true),
    glow(0xd7bc83, 1),
  )
  chest.position.y = 1.02
  const mask = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.06), glow(0xe0bd74, 1))
  mask.position.set(0, 1.5, 0.2)
  costume.add(skirt, chest, mask)
  model.turns.add(costume)
  const spear = new THREE.Group()
  spear.name = 'bonolenov-prologue-spear'
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 2.6, 6), glow(0x795b36, 1))
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.3, 5), glow(0xe9d8b6, 1))
  tip.position.y = 1.42
  spear.add(shaft, tip)
  spear.position.y = -0.2
  spear.rotation.x = Math.PI / 2
  model.root.getObjectByName('hand-right')?.add(spear)
}
