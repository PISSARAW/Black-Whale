import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { mapSetup, mapFrames, searchBodyKey } from './dowsingMapTestSetup'
import { needleCommand } from './illumiNeedleFaceTestSetup'
import { createPaperDocumentScene } from './paperDocumentScene'
import { createKurapikaEffectScene } from './kurapikaEffectScene'
import { dowsingMapContact } from './dowsingMapPresentation'

describe('the visible map pendulum and physical printed sheet', () => {
  it('uses the same sheet anchor and dated point without replacing the paper mesh', () => {
    const scene = new THREE.Scene()
    const options = {
      THREE,
      scene,
      worldX: (x: number) => x * 0.12,
      worldY: (y: number) => y * 0.12,
    }
    const paper = createPaperDocumentScene(options)
    const effect = createKurapikaEffectScene(options)
    const base = mapSetup()
    const started = needleCommand(base, { action: 'dowsing-locate', target: searchBodyKey(base) })
    paper.sync(started, 0)
    effect.sync(started, 0)
    const sheet = scene.getObjectByName('document:player:arena-map')!
    expect(sheet.userData.arenaMap).toEqual({ left: 7, right: 93, bottom: 0, top: 24 })
    const read = mapFrames(started)
    paper.sync(read, 1)
    effect.sync(read, 1)
    expect(scene.getObjectByName(sheet.name)).toBe(sheet)
    const tip = scene
      .getObjectByName('kurapika-chains:player')!
      .getObjectByName('kurapika-chain-tip:pendulum')!
    expect(tip.visible).toBe(true)
    const contact = dowsingMapContact(options, read, 'player')!
    expect(contact.x).toBeCloseTo(
      sheet.position.x + (read.player.dowsingMapReading!.point!.x - 0.5) * 0.24,
    )
    expect(contact.y).toBeCloseTo(sheet.position.y + 0.08)
    const stopped = needleCommand(read, { action: 'dowsing-stop' })
    effect.sync(stopped, 2)
    expect(tip.visible).toBe(false)
    paper.dispose()
    effect.dispose()
  })
  it('hides the map chain under In and reveals the same real manifestation with Gyo', () => {
    const scene = new THREE.Scene()
    const effect = createKurapikaEffectScene({
      THREE,
      scene,
      worldX: (x) => x * 0.12,
      worldY: (y) => y * 0.12,
      viewer: () => 'opponent',
    })
    const base = mapSetup()
    const read = mapFrames(
      needleCommand(base, { action: 'dowsing-locate', target: searchBodyKey(base) }),
    )
    const hidden = { ...read, player: { ...read.player, nen: { ...read.player.nen, in: true } } }
    effect.sync(hidden, 0)
    const tip = scene
      .getObjectByName('kurapika-chains:player')!
      .getObjectByName('kurapika-chain-tip:pendulum')!
    expect(tip.visible).toBe(false)
    effect.sync(
      { ...hidden, opponent: { ...hidden.opponent, nen: { ...hidden.opponent.nen, gyo: true } } },
      1,
    )
    expect(tip.visible).toBe(true)
    effect.dispose()
  })
})
