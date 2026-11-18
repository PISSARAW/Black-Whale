import { maryHasInfusion } from './bloodyMaryEquipment'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightSide, FightState } from './types'
import { createFineControlClock, type FineControlFrame } from './fineControlPresentation'
import { fineControlEase, fineControlReduced } from './fineControlAnchors'

export function createBloodyMaryScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene } = options
  const clock = createFineControlClock()
  const red = new THREE.MeshBasicMaterial({ color: 0xa4193e })
  const white = new THREE.MeshBasicMaterial({ color: 0xfff3e8 })
  const dark = new THREE.MeshBasicMaterial({ color: 0x14070c })
  const dropGeometry = new THREE.SphereGeometry(0.11, 8, 6)
  const bagGeometry = new THREE.BoxGeometry(0.19, 0.29, 0.06)
  const pupilGeometry = new THREE.SphereGeometry(0.025, 6, 4)
  const lines = ['player', 'opponent'].map((side) => {
    const line = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0x9c173e }),
    )
    line.name = `bloody-mary:${side}`
    scene.add(line)
    return line
  })
  const groups = ['player', 'opponent'].map((side) => {
    const tip = new THREE.Mesh(dropGeometry, red)
    tip.name = `bloody-mary-tip:${side}`
    scene.add(tip)
    const kit = new THREE.Group()
    const bag = new THREE.Mesh(bagGeometry, red)
    bag.position.y = 1.8
    kit.add(bag)
    scene.add(kit)
    const drops = [0, 1, 2].map((index) => {
      const group = new THREE.Group()
      group.name = `bloody-mary-scout:${side}:${index}`
      const body = new THREE.Mesh(dropGeometry, red)
      const eye = new THREE.Mesh(dropGeometry, white)
      eye.scale.setScalar(0.55)
      eye.position.z = 0.08
      const pupil = new THREE.Mesh(pupilGeometry, dark)
      pupil.position.z = 0.15
      group.add(body, eye, pupil)
      scene.add(group)
      return group
    })
    return { kit, drops, tip }
  })
  return {
    sync: (state) => {
      const frames = clock(state)
      const reduced = fineControlReduced(options)
      for (const [index, side] of (['player', 'opponent'] as const).entries()) {
        const fighter = state[side]
        const blood = fighter.bloodyMary
        const group = groups[index]
        group.kit.visible = maryHasInfusion(fighter)
        group.kit.position.set(
          options.worldX(fighter.x) - fighter.facing * 0.35,
          options.worldY(fighter.y),
          0.15,
        )
        lines[index].userData.events = frames[side]
        syncBloodLine(options, { state, side, line: lines[index], frame: frames[side] })
        group.tip.visible = Boolean(blood?.tendril)
        if (blood?.tendril) {
          const point =
            blood.tendril.phase === 'bound'
              ? state[side === 'player' ? 'opponent' : 'player']
              : blood.tendril
          const y = blood.tendril.phase === 'bound' ? point.y + 5 : point.y
          group.tip.position.set(options.worldX(point.x), options.worldY(y), 0.3)
          const age = frames[side].blood
          group.tip.scale.setScalar(
            0.55 + (reduced || age === null ? 0 : Math.sin((Math.PI * age) / 18) * 0.12),
          )
        }
        group.drops.forEach((drop, dropIndex) => {
          const point = blood?.drops[dropIndex]
          drop.visible = Boolean(point && point.reformFrames === 0)
          const age = point ? frames[side].drops[point.id] : undefined
          drop.scale.setScalar(
            reduced || age === undefined ? 1 : 0.35 + 0.65 * fineControlEase(age / 18),
          )
          if (point)
            drop.position.set(
              options.worldX(point.x),
              options.worldY(point.y) +
                (reduced ? 0 : Math.sin((state.frame / 60) * 4 + dropIndex) * 0.03),
              0.35,
            )
        })
      }
    },
    dispose: () => {
      groups.forEach((group) => {
        scene.remove(group.kit, group.tip)
        group.drops.forEach((drop) => scene.remove(drop))
      })
      lines.forEach((line) => {
        scene.remove(line)
        line.geometry.dispose()
        line.material.dispose()
      })
      red.dispose()
      white.dispose()
      dark.dispose()
      dropGeometry.dispose()
      bagGeometry.dispose()
      pupilGeometry.dispose()
    },
  }
}

function syncBloodLine(
  options: EffectSceneOptions,
  context: {
    state: FightState
    side: FightSide
    line: import('three').Line<import('three').BufferGeometry, import('three').LineBasicMaterial>
    frame: FineControlFrame
  },
): void {
  const { state, side, line } = context
  const owner = state[side]
  const tendril = owner.bloodyMary?.tendril
  line.visible = Boolean(tendril)
  if (!tendril) return
  const target = state[side === 'player' ? 'opponent' : 'player']
  const endpoint = tendril.phase === 'bound' ? { x: target.x, y: target.y + 5 } : tendril
  const age = fineControlReduced(options) ? null : context.frame.blood
  const gather = age === null ? 0 : (1 - fineControlEase(age / 18)) * 0.4
  const points = Array.from({ length: 36 }, (_, index) => {
    const ratio = index / 35
    const wrap = tendril.phase === 'bound' && ratio > 0.75
    const angle = (ratio - 0.75) * Math.PI * 24
    const x = wrap
      ? endpoint.x + Math.sin(angle) * (1.4 + gather)
      : owner.x + (endpoint.x - owner.x) * ratio
    const y = wrap
      ? endpoint.y + Math.cos(angle) * (1.5 + gather)
      : owner.y + 4 + (endpoint.y - owner.y - 4) * ratio
    return new options.THREE.Vector3(options.worldX(x), options.worldY(y), 0.3)
  })
  line.geometry.setFromPoints(points)
  line.geometry.computeBoundingSphere()
}
