import * as THREE from 'three'
import {
  buildHumanFigure,
  type HumanFigureBuild,
  type HumanLook,
} from '../../src/lib/tour/humanFigure'
import { humanProfile } from '../../src/lib/tour/humanProfiles'
import { finishFightModel } from '../../src/lib/fighting/fighterModelFinish'
import { buildFightFigure } from '../../src/lib/fighting/fighterFigure'
import { fightRigOf } from '../../src/lib/fighting/fightRig'
import { createFight } from '../../src/lib/fighting/engine'
import type { FighterId } from '../../src/lib/fighting/types'
import type { VictoryActor } from '../../src/lib/fighting/victory/types'

function nobunaga(glow: HumanFigureBuild['glow']) {
  const seen: HumanLook = {
    id: 'nobunaga-fatality-preview',
    kind: 'combatant',
    spaceId: 'standalone-cinema',
    tierId: 'preview',
    at: [0, 0],
    y: 0,
    size: 1,
    colour: 0xc4bf9b,
    stage: 0,
    hidden: false,
    human: { role: 'fighter', identity: 'nobunaga-hazama', pose: 'idle', aura: 'zetsu' },
  }
  const profile = humanProfile(seen)
  const model = buildHumanFigure({ THREE, glow, seen, profile })
  finishFightModel({ THREE, glow, model, profile })
  return model
}
function actor(root: THREE.Object3D): VictoryActor {
  root.updateWorldMatrix(true, true)
  const head = root.getObjectByName('face-mouth')!.parent!
  const foot = root.getObjectByName('knee-left')!.children[1]
  const floor = new THREE.Box3().setFromObject(foot).min.y
  const shoulders = ['left', 'right'].map((side) =>
    root.getObjectByName(`shoulder-${side}`)!.getWorldPosition(new THREE.Vector3()),
  )
  return {
    root,
    head,
    height: head.getWorldPosition(new THREE.Vector3()).y - floor + 0.16,
    width: shoulders[0].distanceTo(shoulders[1]) + 0.16,
  }
}
export function createNobunagaFatalityActors(options: {
  glow: HumanFigureBuild['glow']
  target: FighterId | 'nobunaga'
}) {
  const hero = nobunaga(options.glow)
  const target =
    options.target === 'nobunaga'
      ? nobunaga(options.glow)
      : buildFightFigure({
          THREE,
          glow: options.glow,
          fighter: createFight(options.target, 'hisoka').player,
        })
  for (const model of [hero, target])
    model.animate(0, 'idle', {
      motion: (rig) => {
        fightRigOf(rig)
      },
    })
  return { hero: actor(hero.root), victim: actor(target.root) }
}
