import { addBonolenovBattleArmor } from '$lib/tour/bonolenovBattleArmor'
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
        hole.position.set(x, y - 1.12, 0.245)
        holes.add(hole)
      }
    holes.position.y = 1.12
    model.turns.add(holes)
  }
  if (!fighter.battleCantabile?.prologue) return
  addBonolenovBattleArmor({ THREE, glow, model })
}
