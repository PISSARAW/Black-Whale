import { reattachmentPoint } from './machiReattachmentScene'
import { controlChest, controlHand, threadVisible } from './fineControlAnchors'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { PreparedEntity } from './preparationTypes'
import type { FightSide, FightState } from './types'

export function createMachiObjectScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE, scene } = options
  const material = new THREE.LineBasicMaterial({ color: '#f69ccd' })
  const lines = (['player', 'opponent'] as const).map((side) => {
    const line = new THREE.Line(new THREE.BufferGeometry(), material)
    line.name = `machi-material-thread:${side}`
    scene.add(line)
    return { side, line }
  })
  const corpseLines = (['player', 'opponent'] as const).flatMap((side) =>
    [0, 1].map((index) => {
      const line = new THREE.Line(new THREE.BufferGeometry(), material)
      line.name = `machi-corpse-thread:${side}:${index}`
      scene.add(line)
      return { side, index, line }
    }),
  )
  function drawCorpses(state: FightState) {
    for (const { side, index, line } of corpseLines) {
      const link = state[side].corpseStrings?.[index]
      const body = state.battlefield?.entities.find((e) => e.id === link?.id && e.present)
      line.visible = Boolean(body)
      if (!body) continue
      line.geometry.setFromPoints([
        controlHand(options, state, side),
        new THREE.Vector3(options.worldX(body.x), options.worldY(body.y + 9), 0.3),
      ])
      line.geometry.computeBoundingSphere()
    }
  }
  function draw(state: FightState, side: FightSide, line: import('three').Line) {
    const actor = state[side],
      anchor = actor.machiAnchor,
      suture = actor.machiSuture ?? actor.machiReattachment
    const object = state.battlefield?.entities.find(
      (entry) => entry.id === anchor?.objectId && entry.present && entry.health > 0,
    )
    line.visible =
      Boolean(suture || (anchor?.attached && object)) && threadVisible(options, state, side)
    if (!line.visible) return
    const end = threadEnd(state, side, object)
    const start = controlHand(options, state, side)
    const points = [start]
    if (suture)
      for (let i = 0; i < 16; i++)
        points.push(end.clone().add(new THREE.Vector3(Math.sin(i) * 0.08, (i / 16 - 0.5) * 0.2, 0)))
    points.push(end)
    line.geometry.setFromPoints(points)
    line.geometry.computeBoundingSphere()
  }
  function threadEnd(state: FightState, side: FightSide, object?: PreparedEntity) {
    const suture = state[side].machiSuture ?? state[side].machiReattachment
    return (
      reattachmentPoint(options, state, side) ??
      (suture
        ? controlChest(options, state, suture.target)
        : new THREE.Vector3(options.worldX(object!.x), options.worldY(object!.y + 4), 0.3))
    )
  }
  return {
    sync(state) {
      lines.forEach(({ side, line }) => draw(state, side, line))
      drawCorpses(state)
    },
    dispose() {
      ;[...lines, ...corpseLines].forEach(({ line }) => {
        scene.remove(line)
        line.geometry.dispose()
      })
      material.dispose()
    },
  }
}
