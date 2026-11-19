import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildFightFigure } from './fighterFigure'
import { needleFaceSetup, needleCommand, needleFrames } from './illumiNeedleFaceTestSetup'
import { reconcileIllumiFaces } from './illumiDisguiseClock'
import { recordEquipmentPickup } from './copiedInventory'
import { copyHistoricalObject } from './chrolloHistoricalObjects'
import type { FightState } from './types'

function bookFace(): FightState {
  const base = needleFaceSetup()
  const state: FightState = {
    ...base,
    player: {
      ...base.player,
      id: 'chrollo',
      chrolloBook: { pages: ['illumi:backSpecial'], page: 0, open: true, bookmark: null },
    },
  }
  return needleFrames(needleCommand(state, { action: 'copied-move', target: 'illumi:backSpecial' }))
}
describe('the ended disguise retains visible, recoverable material', () => {
  it('keeps physical pins on the original face after page loss, then removes their geometry on extraction', () => {
    let state = bookFace()
    state = reconcileIllumiFaces({
      ...state,
      player: { ...state.player, chrolloBook: { ...state.player.chrolloBook!, open: false } },
    })
    const glow = (color: number, opacity: number) => new THREE.MeshBasicMaterial({ color, opacity })
    const build = (fighter: typeof state.player) => buildFightFigure({ THREE, glow, fighter })
    expect(state.player.illumi?.disguised).toBe(false)
    expect(build(state.player).root.getObjectByName('illumi-physical-needle')).toBeTruthy()
    state = needleCommand(state, { action: 'illumi-face-remove' })
    expect(build(state.player).root.getObjectByName('illumi-physical-needle')).toBeUndefined()
  })
  it('copies only an inert new assembly and records the actual parent when picking its pieces up', () => {
    let state = needleCommand(bookFace(), { action: 'illumi-face-remove' })
    const source = state.battlefield!.entities.find((entry) => entry.disguisePinBundle)!
    state = {
      ...state,
      player: {
        ...state.player,
        x: source.x,
        aura: 100,
        arenaRecovery: 0,
        chrolloBook: { pages: ['gallery-fake'], page: 0, open: false, bookmark: 'gallery-fake' },
      },
    }
    const copied = copyHistoricalObject(state, 'player', source.id)
    const replica = copied.battlefield!.entities.find(
      (entry) => entry.copy?.originalId === source.id,
    )!
    expect(replica.disguisePinBundle?.id).not.toBe(source.disguisePinBundle!.id)
    expect(replica.disguisePinBundle?.mediumCopyId).toBe(replica.id)
    expect(replica.controller).toBeUndefined()
    expect(
      recordEquipmentPickup(state.opponent, replica, 'needles').equipmentProps?.needles,
    ).toMatchObject({
      copyId: replica.id,
      detachedPart: true,
    })
    expect(copied.player.illumi?.disguised).toBe(false)
  })
})
