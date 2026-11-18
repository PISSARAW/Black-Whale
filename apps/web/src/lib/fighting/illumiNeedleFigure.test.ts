import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildFightFigure, fightFigureKey } from './fighterFigure'
import { needleFaceSetup, beginNeedleFace, needleFrames } from './illumiNeedleFaceTestSetup'
import { illumiAiSlots } from './illumiAi'
import { cinematicEvents, cameraSnapshot } from './cinematicEvents'
import { attackData } from './frameData'

describe('the face has three physical forehead pins without a Needle People marker', () => {
  it('names the captured face application in both cast and contact shots', () => {
    const base = needleFaceSetup()
    const started = beginNeedleFace(base)
    const cast = cinematicEvents(started, cameraSnapshot(base))
    expect(
      cast.some((event) => event.detail?.labelFr === 'Visage · Trois aiguilles au front'),
    ).toBe(true)
    const hit = needleFrames(started, attackData('special', started.player).startup)
    expect(hit.opponent.needleFace?.reshaping).toBe(true)
    const events = cinematicEvents(hit, cameraSnapshot(started))
    expect(events.some((event) => event.detail?.eventId === 'illumi.face-warp')).toBe(true)
    expect(
      events
        .filter((event) => event.detail)
        .map((event) => event.detail!.labelFr)
        .join(' '),
    ).not.toContain('Needle People')
  })
  it('retains all three visible pins when copied Nen reshaping ends, without moving body joints', () => {
    const state = needleFrames(beginNeedleFace(needleFaceSetup()))
    const actor = state.opponent
    const glow = (color: number, opacity: number) => new THREE.MeshBasicMaterial({ color, opacity })
    const build = (fighter: typeof actor) => buildFightFigure({ THREE, glow, fighter })
    const distorted = build(actor)
    const released = build({ ...actor, needleFace: { ...actor.needleFace!, reshaping: false } })
    const original = build({ ...actor, needleFace: undefined })
    for (const figure of [distorted, released]) {
      const pins: THREE.Object3D[] = []
      figure.root.traverse((part) => {
        if (part.name === 'illumi-face-warp-needle') pins.push(part)
      })
      expect(pins).toHaveLength(3)
      expect(figure.root.getObjectByName('illumi-physical-needle')).toBeUndefined()
      for (const name of ['hand-left', 'hand-right', 'knee-left', 'knee-right'])
        expect(figure.root.getObjectByName(name)!.position).toEqual(
          original.root.getObjectByName(name)!.position,
        )
    }
    expect(fightFigureKey(actor)).not.toBe(fightFigureKey({ ...actor, needleFace: undefined }))
  })
  it('lets the AI execute the selected contact application without repeatedly implanting an already affected face', () => {
    const base = needleFaceSetup('opponent')
    const selected = {
      ...base,
      opponent: { ...base.opponent, illumiNeedleMode: 'face-warp' as const },
    }
    expect(illumiAiSlots(selected, 5)).toContain('neutralSpecial')
    const hit = needleFrames(beginNeedleFace(selected, 'opponent'))
    expect(illumiAiSlots(hit, 5)).not.toContain('neutralSpecial')
  })
})
