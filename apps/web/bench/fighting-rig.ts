import * as THREE from 'three'
import { buildFightFigure } from '../src/lib/fighting/fighterFigure'
import { createFightState } from '../src/lib/fighting/fightState'
import { captureFootPlant, fightRigOf, type FightRig } from '../src/lib/fighting/fightRig'
const results = []
for (const fighter of ['kurapika', 'hisoka', 'chrollo', 'benjamin'] as const) {
  const model = buildFightFigure({
    THREE,
    glow: (color, opacity) =>
      new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 }),
    fighter: createFightState(fighter, 'hisoka').player,
  })
  let rig!: FightRig
  model.animate(1, 'idle', {
    motion: (human) => {
      rig = fightRigOf(human)
    },
  })
  let nodes = 0
  model.root.traverse(() => nodes++)
  const original = THREE.Object3D.prototype.updateWorldMatrix
  let calls = 0
  THREE.Object3D.prototype.updateWorldMatrix = function (parents, children) {
    calls++
    return original.call(this, parents, children)
  }
  const ground = rig.human.figure.parent ?? rig.human.figure
  ground.updateWorldMatrix(true, true)
  const before = rig.ankles.map((ankle) =>
    ground.worldToLocal(ankle.getWorldPosition(rig.probe)).clone(),
  )
  const legacy = calls
  calls = 0
  const after = captureFootPlant(rig)
  const optimized = calls
  THREE.Object3D.prototype.updateWorldMatrix = original
  results.push({
    fighter,
    nodes,
    legacyUpdatesPerCapture: legacy,
    optimizedUpdatesPerCapture: optimized,
    reductionPercent: 100 * (1 - optimized / legacy),
    maxPositionError: Math.max(...after.positions.map((p, i) => p.distanceTo(before[i]))),
  })
}
process.stdout.write(JSON.stringify(results, null, 2) + '\n')
