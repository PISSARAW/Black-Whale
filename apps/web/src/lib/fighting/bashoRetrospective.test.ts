import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { beginFight, createFight, tickFight, performAuraAttack, performAttack } from './engine'
import { performArsenalAction } from './arsenalExecution'
import { composeBashoPoem } from './bashoAction'
import { BASHO_ATTESTED_POEMS, bashoEffectPoem, type BashoEffect } from './bashoPoem'
import { performArsenalCommand, arsenalOptions } from './retrospectiveArsenal'
import { bashoArsenalAi } from './bashoArsenalAi'
import { createCinematicPropsScene } from './cinematicPropsScene'
import { createBashoSupportScene } from './bashoSupportScene'
import { advanceBashoWardClocks } from './bashoWard'
import { toggleEmperorTime } from './kurapikaActions'
import { speakPaperWords } from './kallutoListening'
import { privatePvpState } from './pvp/view'
import { applyPvpCommand } from './pvp/commands'
import { parsePvpSetup } from './pvp/protocol'
import { fightReplayHash } from './fightReplayHash'
import { encodeFightSnapshot, decodeFightSnapshot } from './fightReplaySnapshot'
import { EMPTY_INPUT, type FightState, type FightSide, type FighterId } from './types'

function setup(player: FighterId = 'basho', opponent: FighterId = 'hisoka'): FightState {
  const base = beginFight(
    createFight(player, opponent, {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: {
        preparation: {
          mode: 'scenario',
          resources: ['writing', 'spirits', 'devices'],
          cohorts: [],
        },
      },
    }),
  )
  return {
    ...base,
    player: { ...base.player, x: 25, aura: 100 },
    opponent: { ...base.opponent, x: 40, aura: 100 },
  }
}
function advance(state: FightState, count = 60) {
  for (let i = 0; i < count; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
  return state
}
function use(
  state: FightState,
  action: Parameters<typeof performArsenalCommand>[2]['action'],
  target?: string,
  side: FightSide = 'player',
) {
  return performArsenalCommand(state, side, { action, target })
}
function write(state: FightState, effect: BashoEffect): FightState {
  const started = composeBashoPoem(
    { state, side: 'player', text: BASHO_ATTESTED_POEMS[effect].fr },
    performAuraAttack,
  )
  expect(started.player.bashoPoem?.writingFrames).toBe(60)
  expect(started.player.bashoPoem?.paperId).toBeTruthy()
  const completed = advance(started)
  expect(completed.player.bashoPoem?.ready).toBe(true)
  return completed
}
function ask(state: FightState) {
  return use(state, 'basho-ask', 'identity')
}

describe('Great Hiker has the three attested effects and actual writing supplies', () => {
  it('consumes each real sheet once, archives distinct written poems and refuses a fourth sheet', () => {
    let state = setup()
    const ids = new Set<string>()
    for (const effect of Object.keys(BASHO_ATTESTED_POEMS) as BashoEffect[]) {
      state = write(state, effect)
      ids.add(state.player.bashoPoem!.paperId!)
    }
    expect(ids.size).toBe(3)
    expect(state.player.writingKit?.sheets).toBe(0)
    for (const effect of Object.keys(BASHO_ATTESTED_POEMS) as BashoEffect[])
      expect(bashoEffectPoem(state.player, effect)).toBeTruthy()
    const fullAura = { ...state, player: { ...state.player, aura: 100 } }
    expect(
      composeBashoPoem(
        { state: fullAura, side: 'player', text: BASHO_ATTESTED_POEMS['ignite-liar'].en },
        performAuraAttack,
      ),
    ).toBe(fullAura)
  })
  it('does not refund an interrupted sheet or duplicate stock when the kit is put down and picked up', () => {
    let state = composeBashoPoem(
      { state: setup(), side: 'player', text: BASHO_ATTESTED_POEMS['ignite-liar'].fr },
      performAuraAttack,
    )
    state = advance({ ...state, player: { ...state.player, hitStun: 2 } }, 3)
    expect(state.player.bashoPoem).toBeUndefined()
    expect(state.player.writingKit?.sheets).toBe(2)
    state = use(state, 'writing-drop')
    expect(state.player.writingKit).toBeUndefined()
    expect(
      state.battlefield!.entities.filter((e) => e.present && e.id === 'player:basho:kit'),
    ).toHaveLength(1)
    state = use(state, 'writing-take', 'player:basho:kit')
    expect(state.player.writingKit).toMatchObject({ sheets: 2, serial: 1 })
    expect(use(state, 'writing-take', 'player:basho:kit')).toBe(state)
  })
  it('requires both hands for writing and does not conjure the original poet’s equipment for Skill Hunter', () => {
    const base = setup('chrollo')
    const copied = {
      ...base,
      player: {
        ...base.player,
        chrolloBook: { pages: ['basho' as const], page: 0, open: true, bookmark: 'basho' as const },
      },
    }
    expect(
      composeBashoPoem(
        { state: copied, side: 'player', text: BASHO_ATTESTED_POEMS['ignite-liar'].fr },
        performAuraAttack,
      ),
    ).toBe(copied)
    const equipped = use(copied, 'writing-take', 'player:writing-kit')
    expect(equipped.player.writingKit?.sheets).toBe(3)
    expect(
      composeBashoPoem(
        { state: equipped, side: 'player', text: BASHO_ATTESTED_POEMS['ignite-liar'].fr },
        performAuraAttack,
      ),
    ).toBe(equipped)
    const closed = {
      ...equipped,
      player: { ...equipped.player, chrolloBook: { ...equipped.player.chrolloBook!, open: false } },
    }
    expect(write(closed, 'ignite-liar').player.writingKit?.sheets).toBe(2)
    let occupied = setup()
    occupied = use(occupied, 'device-pickup', 'player:device:camera')
    expect(
      composeBashoPoem(
        { state: occupied, side: 'player', text: BASHO_ATTESTED_POEMS['ignite-liar'].fr },
        performAuraAttack,
      ),
    ).toBe(occupied)
  })
  it('keeps an exact stolen page active through the native callback without giving the book a third hand', () => {
    const base = setup('chrollo')
    let state: FightState = {
      ...base,
      player: {
        ...base.player,
        chrolloBook: {
          pages: ['basho:neutralSpecial'],
          page: 0,
          open: true,
          bookmark: 'basho:neutralSpecial',
        },
      },
    }
    state = use(state, 'writing-take', 'player:writing-kit')
    const invoke = (current: FightState) =>
      performArsenalAction(
        {
          state: current,
          side: 'player',
          command: { action: 'copied-move', target: 'basho:neutralSpecial' },
        },
        performAuraAttack,
      )
    expect(invoke(state)).toBe(state)
    state = {
      ...state,
      player: { ...state.player, chrolloBook: { ...state.player.chrolloBook!, open: false } },
    }
    const started = invoke(state)
    expect(started.player.id).toBe('chrollo')
    expect(started.player.writingKit?.sheets).toBe(2)
    const finished = advance(started)
    expect(finished.player.bashoPoem?.ready).toBe(true)
    expect(finished.player.bashoPoem?.sourceMoveId).toBe('basho:neutralSpecial')
    const sealed = {
      ...finished,
      player: {
        ...finished.player,
        stolenChainAbility: { owner: 'opponent' as const, moveId: 'basho:neutralSpecial' },
      },
    }
    expect(advance(sealed, 1).player.bashoPoem).toBeUndefined()
  })
  it('does not call a strike with two held objects an unarmed fist contact', () => {
    let state = write(setup(), 'ignite-punched-target')
    state = use(state, 'device-pickup', 'player:device:camera')
    state = use(state, 'device-pickup', 'player:device:firearm')
    state = { ...state, player: { ...state.player, x: 42 }, opponent: { ...state.opponent, x: 49 } }
    const hit = advance(performAttack(state, 'player', 'light'), 30)
    expect(hit.opponent.health).toBeLessThan(state.opponent.health)
    expect(hit.opponent.bashoBurn).toBeUndefined()
  })
  it('asks a real audible question and leaves silence, sincere answers and arbitrary words harmless', () => {
    const state = ask(write(setup(), 'ignite-liar'))
    expect(state.opponent.bashoPrompt?.question).toBe('identity')
    expect(state.opponent.heardWords?.text).toContain('réellement')
    expect(advance(state, 60).opponent.health).toBe(state.opponent.health)
    const free = speakPaperWords(state, 'opponent', 'Je suis quelqu’un d’autre.')
    expect(free.opponent.health).toBe(state.opponent.health)
    expect(use(state, 'basho-answer', 'sincere', 'opponent').opponent.health).toBe(
      state.opponent.health,
    )
    const deaf = { ...state, player: { ...state.player, coveringEars: true } }
    expect(use(deaf, 'basho-answer', 'lie', 'opponent')).toBe(deaf)
  })
  it('does not let a structured recorded declaration bypass the same pending question', () => {
    const state = ask(write(setup(), 'ignite-liar'))
    const unrelated = use(state, 'statement-lie', 'nen', 'opponent')
    expect(unrelated.opponent.health).toBe(state.opponent.health)
    const reply = use(state, 'statement-lie', 'identity', 'opponent')
    expect(reply.opponent.health).toBe(0)
    expect(reply.winner).toBe('player')
  })
  it('attributes the actual lethal fire to the poet and preserves the victim’s post-mortem ability', () => {
    const asked = ask(write(setup('basho', 'camilla'), 'ignite-liar'))
    const answered = use(asked, 'basho-answer', 'lie', 'opponent')
    expect(answered.opponent.health).toBe(0)
    const ordinary = use(ask(write(setup(), 'ignite-liar')), 'basho-answer', 'lie', 'opponent')
    expect(ordinary.winner).toBe('player')
    expect(ordinary.opponent.bashoBurn?.owner).toBe('player')
    expect(answered.catsName?.killerSide).toBe('player')
    expect(asked.opponent.health).toBe(300)
  })
  it('keeps a conditional death lethal under the point rules instead of restoring one HP', () => {
    const state = write(setup(), 'ignite-liar')
    const points: FightState = { ...state, formatId: 'heavens-arena' }
    const result = use(ask(points), 'basho-answer', 'lie', 'opponent')
    expect(result.opponent.health).toBe(0)
    expect(result.winner).toBe('player')
  })
  it('requires the actual poem and the real interlocutor, without converting a blocked utterance into a lie', () => {
    const state = write(setup(), 'ignite-liar')
    const far = { ...state, opponent: { ...state.opponent, x: 85 } }
    expect(ask(far)).toBe(far)
    const asked = ask(state)
    const sealed = advance(
      { ...asked, player: { ...asked.player, nen: { ...asked.player.nen, on: true } } },
      1,
    )
    expect(sealed.opponent.bashoPrompt).toBeUndefined()
    expect(use(sealed, 'basho-answer', 'lie', 'opponent')).toBe(sealed)
    const noPoem = setup()
    expect(ask(noPoem)).toBe(noPoem)
  })
  it('moves one real talisman at contact and with consent, then repels only present weak spirits', () => {
    let state = write(setup(), 'ward-weak-spirits')
    const far = use(state, 'basho-ward', 'opponent')
    expect(far).toBe(state)
    state = {
      ...state,
      opponent: {
        ...state.opponent,
        x: 29,
        hatsuEffects: { ...state.opponent.hatsuEffects, gidalCurseFrames: 100 },
      },
    }
    expect(use(state, 'basho-ward', 'opponent')).toBe(state)
    state = use(state, 'support-consent', undefined, 'opponent')
    const given = use(state, 'basho-ward', 'opponent')
    expect(given.opponent.bashoWard?.paperId).toBe(state.player.bashoPoem?.paperId)
    expect(bashoEffectPoem(given.player, 'ward-weak-spirits')).toBeUndefined()
    expect(use(given, 'basho-ward', 'player')).toBe(given)
    const haunted = {
      ...given,
      battlefield: {
        ...given.battlefield!,
        entities: given.battlefield!.entities.map((e) =>
          e.weakSpirit?.target === 'opponent'
            ? { ...e, x: 29, y: 8, weakSpirit: { ...e.weakSpirit, attached: true } }
            : e,
        ),
      },
    }
    const protectedState = advance(haunted, 1)
    const spirit = protectedState.battlefield!.entities.find(
      (e) => e.id === 'opponent:weak-spirit',
    )!
    expect(spirit.present).toBe(false)
    expect(spirit.health).toBe(1)
    expect(protectedState.opponent.hatsuEffects.gidalCurseFrames).toBeGreaterThan(0)
    expect(protectedState.opponent.health).toBe(given.opponent.health)
  })
  it('ages an imbued charm through hitstop, keeps the physical paper, and never claims universal exorcism', () => {
    const state = use(write(setup(), 'ward-weak-spirits'), 'basho-ward', 'player')
    const short = {
      ...state,
      player: { ...state.player, bashoWard: { ...state.player.bashoWard!, remainingFrames: 1 } },
    }
    const ended = advanceBashoWardClocks(short)
    expect(ended.player.bashoWard?.remainingFrames).toBe(0)
    expect(ended.player.bashoWard?.paperId).toBe(short.player.bashoWard?.paperId)
    const frozen = advance({ ...state, hitstop: 2 }, 1)
    expect(frozen.player.bashoWard?.remainingFrames).toBe(
      state.player.bashoWard!.remainingFrames - 1,
    )
  })
  it('uses the same physical supplies for a one-use Dolphin ward and retains Emperor Time until it ends', () => {
    const base = setup('kurapika', 'basho')
    let state: FightState = {
      ...base,
      player: {
        ...base.player,
        kurapika: {
          ...base.player.kurapika!,
          emperorTime: true,
          held: {
            source: 'basho' as const,
            moveId: 'basho:neutralSpecial',
            victim: 'opponent' as const,
            loaded: true,
            used: false,
            sustainedKeys: [],
          },
        },
      },
    }
    state = use(state, 'writing-take', 'player:writing-kit')
    state = write(state, 'ward-weak-spirits')
    expect(state.player.kurapika?.held?.used).toBe(true)
    state = use(state, 'basho-ward', 'player')
    expect(toggleEmperorTime(state, 'player')).toBe(state)
    state = {
      ...state,
      player: { ...state.player, bashoWard: { ...state.player.bashoWard!, remainingFrames: 1 } },
    }
    state = advance(state, 2)
    expect(state.player.kurapika?.held).toBeNull()
  })
  it('enforces Judgment on writing and keeps On available for ordinary kit handling', () => {
    const base = setup()
    const bound = {
      ...base,
      player: {
        ...base.player,
        judgmentChain: { owner: 'opponent' as const, rule: 'zetsu' as const },
      },
    }
    expect(
      composeBashoPoem(
        { state: bound, side: 'player', text: BASHO_ATTESTED_POEMS['ignite-liar'].fr },
        performAuraAttack,
      ).player.health,
    ).toBe(0)
    const on = { ...base, player: { ...base.player, nen: { ...base.player.nen, on: true } } }
    expect(use(on, 'writing-drop').player.nen.on).toBe(true)
    expect(
      composeBashoPoem(
        { state: on, side: 'player', text: BASHO_ATTESTED_POEMS['ignite-liar'].fr },
        performAuraAttack,
      ),
    ).toBe(on)
  })
  it('keeps previews pure, all ten resources valid, and reproduces the authenticated P2 answer from a snapshot', () => {
    const state = ask(write(setup(), 'ignite-liar')),
      before = fightReplayHash(state)
    arsenalOptions(state, 'opponent')
    expect(fightReplayHash(state)).toBe(before)
    const resources = [
      'animals',
      'birds',
      'plants',
      'objects',
      'needles',
      'flutes',
      'rooms',
      'devices',
      'writing',
      'spirits',
    ] as const
    expect(
      parsePvpSetup({
        player: 'basho',
        opponent: 'hisoka',
        formatId: 'knockout',
        environment: {
          ...state.environment,
          preparation: { mode: 'scenario', resources: [...resources], cohorts: [] },
        },
      }),
    ).toBeTruthy()
    const restored = decodeFightSnapshot(encodeFightSnapshot(state), {
      player: 'basho',
      opponent: 'hisoka',
      mode: state.mode,
      formatId: state.formatId,
      environment: state.environment,
    })
    const command = {
      kind: 'arsenal' as const,
      command: { action: 'basho-answer' as const, target: 'sincere' },
    }
    expect(fightReplayHash(applyPvpCommand(restored, 'opponent', command))).toBe(
      fightReplayHash(applyPvpCommand(state, 'opponent', command)),
    )
    expect(privatePvpState(state, 'opponent').player.bashoPrompt?.asker).toBe('opponent')
    expect(
      arsenalOptions(privatePvpState(state, 'opponent'), 'player').find(
        (option) => option.command.action === 'basho-answer',
      )?.ready,
    ).toBe(true)
  })
  it('lets the AI prepare useful poems and answer for itself without manufacturing the human’s consent', () => {
    const base = setup('hisoka', 'basho')
    const state = { ...base, opponent: { ...base.opponent, x: 75 } }
    const written = bashoArsenalAi(state, performAuraAttack)!
    expect(written.opponent.bashoPoem?.effect).toBe('ward-weak-spirits')
    expect(written.player.supportConsent).toBeUndefined()
    const ready = advance(written)
    const warded = bashoArsenalAi(ready, performAuraAttack)!
    expect(warded.opponent.bashoWard?.remainingFrames).toBeGreaterThan(0)
  })
  it('shows the actual paper, brush, charm and weak spirit props and disposes their resources', () => {
    const scene = new THREE.Scene(),
      effect = createBashoSupportScene({
        THREE,
        scene,
        worldX: (x) => x * 0.1,
        worldY: (y) => y * 0.1,
      })
    const writingScene = createCinematicPropsScene({
      THREE,
      scene,
      worldX: (x) => x * 0.1,
      worldY: (y) => y * 0.1,
    })
    const writing = composeBashoPoem(
      { state: setup(), side: 'player', text: BASHO_ATTESTED_POEMS['ward-weak-spirits'].fr },
      performAuraAttack,
    )
    effect.sync(writing, 0)
    writingScene.sync(writing, 0)
    expect(scene.getObjectByName('basho-brush:player')!.visible).toBe(true)
    const warded = use(advance(writing), 'basho-ward', 'player')
    effect.sync(warded, 1)
    writingScene.sync(warded, 1)
    expect(scene.getObjectByName('basho:ward:player')!.visible).toBe(true)
    expect(scene.getObjectByName('basho:ward-aura:player')!.visible).toBe(true)
    expect(scene.getObjectByName('basho-brush:player')!.visible).toBe(false)
    effect.dispose()
    writingScene.dispose()
    expect(scene.children).toHaveLength(0)
  })
})
