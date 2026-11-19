import { describe, expect, it } from 'vitest'
import { beginFight, createFight } from './engine'
import { withKameos } from './kameos/state'
import { needleCommand, needleFrames } from './illumiNeedleFaceTestSetup'
import { borrowedNeedleFaceBusy } from './illumiNeedleFaceClock'
import { createKurapika } from './kurapika'
import { captureDolphinAura } from './dolphinAura'
import { privatePvpState } from './pvp/view'
import { GALLERY_FAKE_LIFETIME } from './historicalCopyLifetime'
import type { FightState } from './types'

function setup(): FightState {
  const base = beginFight(
    withKameos(
      createFight('chrollo', 'kurapika', {
        mode: 'versus-local',
        formatId: 'knockout',
        environment: { needleStock: { player: true } },
      }),
      { opponent: 'tubeppa' },
    ),
  )
  const slot = base.kameos!.opponent!
  return {
    ...base,
    player: {
      ...base.player,
      x: 44,
      aura: 100,
      chrolloBook: { pages: ['illumi:neutralSpecial'], page: 0, open: true, bookmark: null },
    },
    opponent: { ...base.opponent, x: 80 },
    kameos: { opponent: { ...slot, phase: 'acting', fighter: { ...slot.fighter, x: 49 } } },
  }
}
function bookHit(): FightState {
  const state = needleCommand(setup(), { action: 'illumi-needle-mode', target: 'face-warp' })
  return needleFrames(
    needleCommand(state, { action: 'copied-move', target: 'illumi:neutralSpecial' }),
    16,
  )
}

describe('Illumi material and borrowed effects follow actual support bodies off stage', () => {
  it('hits the real support body and ends its book shaping after it leaves the arena, preserving physical pins', () => {
    let state = bookHit()
    const face = state.kameos!.opponent!.fighter.needleFace!
    expect(face?.origin.source).toBe('book')
    expect(state.opponent.needleFace).toBeUndefined()
    state = {
      ...state,
      player: { ...state.player, chrolloBook: { ...state.player.chrolloBook!, open: false } },
    }
    state = needleFrames(state, 40)
    const wearer = state.kameos!.opponent!
    expect(wearer.phase).toBe('reserve')
    expect(wearer.fighter.needleFace).toMatchObject({ needles: face.needles, reshaping: false })
  })
  it('keeps the real loan busy on a support body and dismisses only its shaping without erasing the metal', () => {
    const base = setup()
    let state: FightState = {
      ...base,
      player: {
        ...base.player,
        id: 'theta',
        chrolloBook: undefined,
        dolphinLoan: {
          lender: { owner: 'opponent', member: 0 },
          held: {
            source: 'illumi',
            moveId: 'illumi:neutralSpecial',
            victim: 'opponent',
            theftId: 'support-face-loan',
            loaded: true,
            used: false,
            sustainedKeys: [],
            auraSupply: {
              ...captureDolphinAura(createFight('illumi', 'theta').player),
              amount: 60,
            },
          },
        },
      },
      opponent: {
        ...base.opponent,
        kurapika: {
          ...createKurapika(),
          emperorTime: true,
          dolphinLoans: [{ owner: 'player', member: 0 }],
        },
      },
    }
    state = needleCommand(state, { action: 'illumi-needle-mode', target: 'face-warp', loan: true })
    state = needleFrames(
      needleCommand(state, { action: 'dolphin-move', target: 'illumi:neutralSpecial' }),
      16,
    )
    expect(state.kameos!.opponent!.fighter.needleFace?.origin.source).toBe('dolphin')
    expect(borrowedNeedleFaceBusy(state, 'player')).toBe(true)
    state = needleFrames(state, 35)
    expect(borrowedNeedleFaceBusy(state, 'player')).toBe(true)
    const ended = needleCommand(state, { action: 'dolphin-use' })
    expect(ended.kameos!.opponent!.fighter.needleFace).toMatchObject({ reshaping: false })
    expect(ended.kameos!.opponent!.fighter.needleFace?.needles).toHaveLength(3)
  })
  it('expires copied pin material on a reserve body during hitstop and redacts the foreign acquisition from its client', () => {
    const state = bookHit()
    expect(privatePvpState(state, 'opponent').kameos!.player!.fighter.needleFace?.origin).toEqual(
      {},
    )
    expect(
      privatePvpState(state, 'player').kameos!.opponent!.fighter.needleFace?.origin.source,
    ).toBe('book')
    const slot = state.kameos!.opponent!,
      id = 'support-face-parent'
    const aged: FightState = {
      ...state,
      frame: GALLERY_FAKE_LIFETIME - 1,
      hitstop: 10,
      player: {
        ...state.player,
        chrolloBook: {
          pages: ['illumi:neutralSpecial', 'gallery-fake'],
          page: 0,
          open: true,
          bookmark: 'gallery-fake',
        },
      },
      kameos: {
        opponent: {
          ...slot,
          phase: 'reserve',
          fighter: {
            ...slot.fighter,
            needleFace: { ...slot.fighter.needleFace!, mediumCopyId: id },
          },
        },
      },
      battlefield: {
        ...state.battlefield!,
        entities: [
          ...state.battlefield!.entities,
          {
            id,
            kind: 'needles',
            owner: 'player',
            x: 44,
            y: 0,
            present: false,
            material: 'nen',
            health: 3,
            copy: { owner: 'player', originalId: 'pins', headAttached: true, createdAt: 0 },
          },
        ],
      },
    }
    expect(needleFrames(aged, 1).kameos!.opponent!.fighter.needleFace).toBeUndefined()
  })
})
