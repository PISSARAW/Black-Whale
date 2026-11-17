import * as THREE from 'three'
import type { VictoryContext, VictoryDriver } from './types'
import { createKurapikaChainModel } from '../kurapikaChainModel'
import { scarletEyes } from './kurapikaEyes'
import { kurapikaJudgmentPose, JUDGMENT_IMPLANT, JUDGMENT_BREACH } from './kurapikaJudgmentPose'
import type { KurapikaJudgmentPose } from './kurapikaJudgmentPose'
import { createJudgmentHeart } from './kurapikaJudgmentHeart'
import { victoryPortrait, victoryShot } from './camera'
import { visibleVictoryBounds } from './bodyBounds'
import { disposeVictoryObject, ease } from './resources'

function judgmentCamera(context: VictoryContext, pose: KurapikaJudgmentPose) {
  const { age, hero, victim } = context
  if (context.comfort.camera === 0 || (age >= JUDGMENT_BREACH + 18 && age < 444)) {
    const fixed = context.comfort.camera === 0
    const bounds = visibleVictoryBounds(hero.root).union(visibleVictoryBounds(victim.root))
    victoryShot(context, {
      target: fixed
        ? new THREE.Vector3(context.centre + 0.5, Math.max(hero.height, victim.height) * 0.5, 0)
        : bounds.getCenter(new THREE.Vector3()),
      offset: new THREE.Vector3(0.2, 0.2, 5),
      width: fixed ? context.gap + victim.height + 2 : bounds.getSize(new THREE.Vector3()).x + 1.1,
      height: Math.max(hero.height, victim.height) + 0.9,
    })
  } else if (age < 54 || age >= 444) victoryPortrait(context)
  else if (age >= 174)
    victoryShot(context, {
      target: pose.heart,
      offset: new THREE.Vector3(0.1, 0.07, 2),
      width: 1.15,
      height: 1.1,
    })
  else {
    const middle = pose.origin.clone().lerp(pose.heart, 0.55)
    victoryShot(context, {
      target: middle,
      offset: new THREE.Vector3(0.1, 0.15, 3),
      width: context.gap + 1,
      height: Math.max(hero.height, victim.height) + 0.4,
    })
  }
}
export function createKurapikaJudgmentVictory(): VictoryDriver {
  const chain = createKurapikaChainModel(THREE),
    heart = createJudgmentHeart()
  const eyes = new THREE.MeshBasicMaterial({ color: 0xe42235 })
  const aura = new THREE.Group()
  aura.name = 'kurapika-judgment-forbidden-nen'
  const particles = Array.from(
    { length: 24 },
    () =>
      new THREE.Mesh(
        new THREE.OctahedronGeometry(0.025),
        new THREE.MeshBasicMaterial({
          color: 0x91b5f1,
          transparent: true,
          opacity: 0.65,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      ),
  )
  aura.add(...particles)
  return {
    update(context) {
      const { age } = context
      context.hero.root.traverse((node) => {
        if (!node.name.startsWith('signature-chain')) return
        context.save(node)
        node.visible = false
      })
      const pose = kurapikaJudgmentPose(context)
      if (age < 444) scarletEyes(context, eyes)
      judgmentCamera(context, pose)
      const seal = heart.sync(context, pose)
      chain.hide()
      const extension = ease((age - 60) / (JUDGMENT_IMPLANT - 60))
      const end = pose.origin.clone().lerp(pose.heart, extension)
      if (age >= 60 && age < 180) {
        chain.draw({
          points: [
            pose.origin,
            pose.origin
              .clone()
              .lerp(end, 0.5)
              .add(new THREE.Vector3(0, -0.1 * (1 - extension), 0.05)),
            end,
          ],
          stage: 4,
          direction: pose.heart.clone().sub(pose.origin).normalize(),
        })
      }
      const attempting = age >= 294 && age < JUDGMENT_BREACH
      aura.visible = attempting && context.comfort.flashes
      particles.forEach((particle, i) => {
        const t = ((age - 294) / 36 + i / particles.length) % 1
        const a = i * 2.4
        particle.position
          .copy(pose.heart)
          .add(
            new THREE.Vector3(
              Math.cos(a) * 0.22,
              (t - 0.5) * context.victim.height * 0.65,
              Math.sin(a) * 0.14,
            ),
          )
        particle.scale.setScalar(Math.sin(t * Math.PI))
      })
      context.add(chain.root)
      context.add(heart.root)
      context.add(aura)
      context.scene.userData.kurapikaJudgmentVictory = {
        variant: 'judgment',
        implanted: age >= JUDGMENT_IMPLANT,
        ...seal,
        attempting,
        chainJail: chain.links[2].visible,
        chainFinger: 'right-little',
        origin: pose.origin.toArray(),
        heart: pose.heart.toArray(),
        tipError: end.distanceTo(pose.heart),
        floor: pose.fall?.floor,
        upY: pose.fall?.upY,
        roll: pose.fall?.roll,
      }
      context.defer(() => {
        delete context.scene.userData.kurapikaJudgmentVictory
      })
    },
    dispose() {
      chain.dispose()
      heart.dispose()
      eyes.dispose()
      disposeVictoryObject(aura)
    },
  }
}
