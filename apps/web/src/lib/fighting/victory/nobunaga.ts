import { Vector3 } from 'three'
import type { NobunagaContext } from './nobunagaTypes'
import type { NobunagaVictoryPose } from './nobunagaPose'
import { nobunagaVictoryPose } from './nobunagaPose'
import { createNobunagaKatana } from './nobunagaKatana'
import { createNobunagaEn } from './nobunagaEn'
import { createNobunagaCut } from './nobunagaCut'
import {
  NOBUNAGA_ENTRY,
  NOBUNAGA_EN_RADIUS,
  NOBUNAGA_CONTACT,
  NOBUNAGA_FALL,
} from './nobunagaTypes'
import { victoryShot } from './camera'
import { ease } from './resources'
import { keepHumanFigure } from '$lib/tour/humanConstraints'
import { beginVictoryPose, rememberVictoryPose } from './poseContinuity'

function nobunagaCamera(context: NobunagaContext, pose: NobunagaVictoryPose) {
  const { hero, victim, age } = context
  if (
    context.comfort.camera === 0 ||
    (age >= 72 && age < 264) ||
    (age >= NOBUNAGA_ENTRY && age < 324)
  ) {
    victoryShot(context, {
      target: pose.enCentre.clone().add(new Vector3(NOBUNAGA_EN_RADIUS * 0.4, 0.3, 0)),
      offset: new Vector3(0.2, 0.6, 8),
      width: NOBUNAGA_EN_RADIUS * 2 + 1.5,
      height: Math.max(hero.height, victim.height) + 1.4,
    })
    return
  }
  if (age >= 264 && age < NOBUNAGA_ENTRY) {
    victoryShot(context, {
      target: pose.leading.clone().add(new Vector3(0, 0.12, 0)),
      offset: new Vector3(0.3, 0.2, 2),
      width: 1.1,
      height: 0.8,
    })
    return
  }
  nobunagaDetail(context, pose)
}
function nobunagaDetail(context: NobunagaContext, pose: NobunagaVictoryPose) {
  const { age, hero, victim } = context
  const portrait = age < 72 || age >= 534
  const target = portrait
    ? hero.head.getWorldPosition(new Vector3())
    : pose.contact.clone().lerp(hero.head.getWorldPosition(new Vector3()), 0.5)
  victoryShot(context, {
    target,
    offset: new Vector3(0.15, 0.08, 4),
    width: portrait ? 0.85 : 4.3,
    height: portrait ? 0.9 : Math.max(hero.height, victim.height) + 0.6,
  })
}
export function createNobunagaVictory() {
  const katana = createNobunagaKatana(),
    en = createNobunagaEn(),
    cut = createNobunagaCut()
  return {
    update(context: NobunagaContext) {
      const clock = { token: 'nobunaga-demo', age: context.age }
      beginVictoryPose(context.hero.root, clock)
      beginVictoryPose(context.victim.root, clock)
      const pose = nobunagaVictoryPose(context)
      const sword = katana.sync(context, pose)
      const collapse = cut.sync(context, pose)
      en.sync(context, pose)
      if (context.age >= NOBUNAGA_CONTACT && context.age < NOBUNAGA_FALL)
        context.victim.head.rotation.x = ease((context.age - NOBUNAGA_CONTACT) / 48) * 0.1
      nobunagaCamera(context, pose)
      context.add(katana.root)
      context.add(en.root)
      context.add(cut.root)
      keepHumanFigure(context.hero.root)
      keepHumanFigure(context.victim.root)
      rememberVictoryPose(context.hero.root, clock)
      rememberVictoryPose(context.victim.root, clock)
      const audit = {
        entryDistance: pose.entryDistance,
        entry: NOBUNAGA_ENTRY,
        drawn: sword.drawn,
        contactError: sword.contactError,
        tipToMouth: sword.tipToMouth,
        gripErrors: sword.gripErrors,
        dash: pose.dash,
        collapse,
        tip: sword.tip.toArray(),
        contact: pose.contact.toArray(),
      }
      context.scene.userData.nobunagaVictory = audit
      context.defer(() => {
        delete context.scene.userData.nobunagaVictory
      })
      return audit
    },
    dispose() {
      katana.dispose()
      en.dispose()
      cut.dispose()
    },
  }
}
