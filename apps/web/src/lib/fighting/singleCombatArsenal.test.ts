import { captureDolphinAura } from './dolphinAura'
import { describe, expect, it } from 'vitest'
import {
  beginFight,
  createFight,
  nextRound,
  performAttack,
  performAuraAttack,
  tickFight,
} from './engine'
import { performArsenalAction } from './arsenalExecution'
import { arsenalOptions, validArsenalCommand, performArsenalCommand } from './retrospectiveArsenal'
import { speakPaperWords } from './kallutoListening'
import { privatePvpState } from './pvp/view'
import { BASHO_TRIAL_POEMS } from './bashoPoem'
import { resolveBashoPoemImpact } from './bashoFire'
import { resolveSweetHomeImpact } from './sweetHomeImpact'
import { advanceLsdf } from './lsdf'
import { attackData } from './frameData'
import { canUseRangedAttack } from './projectiles'
import { canAskBasho } from './bashoInterrogation'
import { singleCombatArsenalAi } from './singleCombatAi'
import { encodeFightSnapshot, decodeFightSnapshot } from './fightReplaySnapshot'
import type { ArsenalCommand } from './retrospectiveTypes'
import { EMPTY_INPUT, type FightState, type FighterId, type FightSide } from './types'

function duel(id: FighterId = 'musse'): FightState {
  let state = beginFight(
    createFight(id, 'hisoka', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: { preparation: { mode: 'scenario', resources: ['writing'], cohorts: [] } },
    }),
  )
  if (id === 'basho' || id === 'kurapika') {
    state = { ...state, player: { ...state.player, x: 25 } }
    state = performArsenalCommand(state, 'player', {
      action: 'writing-take',
      target: 'player:writing-kit',
    })
  }
  return {
    ...state,
    player: { ...state.player, x: 40, aura: 100 },
    opponent: { ...state.opponent, x: 70, aura: 100 },
  }
}
function command(state: FightState, value: ArsenalCommand, side: FightSide = 'player') {
  return performArsenalAction({ state, side, command: value }, performAuraAttack)
}
function frames(state: FightState, count: number) {
  for (let i = 0; i < count; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function listen(state = duel()) {
  return frames(command(state, { action: 'window-listen' }), 35)
}

describe('single-encounter arsenal: observed applications', () => {
  it('listens without remote touch, damage, images, a second owl or free reactivation', () => {
    const initial = duel()
    const started = command(initial, { action: 'window-listen' })
    expect(started.player.aura).toBe(initial.player.aura - 16)
    const state = frames(started, 35)
    expect(state.player.secretWindowListening).toMatchObject({ activatedAt: expect.any(Number) })
    expect(state.player.secretWindow).toBeUndefined()
    expect(state.opponent.health).toBe(initial.opponent.health)
    expect(command(state, { action: 'window-listen' })).toBe(state)
    const stopped = command(state, { action: 'window-stop-listening' })
    const switched = frames(performAttack(stopped, 'player', 'special'), 35)
    // Switching dismisses the shoulder bird, but does not attach out of reach.
    expect(switched.player.secretWindow).toBeUndefined()
  })

  it('relays actual distant speech privately and keeps the latest received words', () => {
    const state = listen()
    const first = speakPaperWords(state, 'opponent', 'Première parole.')
    const second = speakPaperWords(
      { ...first, frame: first.frame + 1 },
      'opponent',
      'Deuxième parole.',
    )
    expect(second.player.heardWords).toBeUndefined() // outside ordinary voice range
    expect(second.player.secretWindowListening?.heard?.text).toBe('Deuxième parole.')
    expect(privatePvpState(second, 'opponent').opponent.secretWindowListening).toBeUndefined()
    expect(privatePvpState(second, 'player').player.secretWindowListening?.heard?.text).toBe(
      'Deuxième parole.',
    )
    const silent = {
      ...state,
      opponent: {
        ...state.opponent,
        arsenalSleep: { owner: 'player' as const, cause: 'cookie' as const },
      },
    }
    expect(speakPaperWords(silent, 'opponent', 'Impossible.')).toBe(silent)
  })

  it('relays contact-target speech and records action changes without exposing aura or thoughts', () => {
    const initial = duel()
    const state = frames(
      performAttack({ ...initial, opponent: { ...initial.opponent, x: 46 } }, 'player', 'special'),
      35,
    )
    const spoken = speakPaperWords(state, 'opponent', 'Je réponds.')
    expect(spoken.player.secretWindow?.heard?.text).toBe('Je réponds.')
    const moving = tickFight(spoken, EMPTY_INPUT, {
      dt: 1 / 60,
      opponentInput: { ...EMPTY_INPUT, right: true },
    })
    expect(moving.player.secretWindow?.observation.action).toBe('walk')
    expect(moving.player.secretWindow?.observation).not.toHaveProperty('aura')
    expect(command(moving, { action: 'window-recall' }).player.secretWindow).toBeUndefined()
  })

  it('keeps both birds behind Nen access, real startup, stolen pages and the shared command validator', () => {
    const initial = duel()
    for (const patch of [
      { aura: 0 },
      { hitStun: 20 },
      { nen: { ...initial.player.nen, mode: 'zetsu' as const } },
    ]) {
      const unavailable = { ...initial, player: { ...initial.player, ...patch } }
      expect(command(unavailable, { action: 'window-listen' })).toBe(unavailable)
    }
    const listening = listen()
    const stopped = frames(
      {
        ...listening,
        player: {
          ...listening.player,
          hatsuEffects: { ...listening.player.hatsuEffects, hatsuStolen: 1 },
        },
      },
      1,
    )
    expect(stopped.player.secretWindow).toBeUndefined()
    expect(validArsenalCommand({ action: 'window-listen', forged: true })).toBe(false)
    expect(
      arsenalOptions(initial, 'player').some((option) => option.command.action === 'window-listen'),
    ).toBe(true)
  })

  it('preserves the selected listening application through Skill Hunter and single-use Dolphin', () => {
    const base = duel()
    const chrollo = createFight('chrollo', 'hisoka').player
    const copied = frames(
      command(
        {
          ...base,
          player: {
            ...chrollo,
            x: 40,
            chrolloBook: { pages: ['musse'], page: 0, open: true, bookmark: null },
          },
        },
        { action: 'copied-move', target: 'musse:downSpecial' },
      ),
      35,
    )
    expect(copied.player.secretWindowListening).toBeDefined()
    const kurapika = createFight('kurapika', 'hisoka').player
    const borrowed = frames(
      command(
        {
          ...base,
          player: {
            ...kurapika,
            x: 40,
            kurapika: {
              ...kurapika.kurapika!,
              emperorTime: true,
              held: {
                source: 'musse',
                auraSupply: {
                  ...captureDolphinAura(createFight('musse', 'hisoka').player),
                  amount: 60,
                },
                moveId: 'musse:neutralSpecial',
                victim: 'opponent',
                loaded: true,
                used: false,
                sustainedKeys: [],
              },
            },
          },
        },
        { action: 'dolphin-move', target: 'musse:downSpecial' },
      ),
      35,
    )
    expect(borrowed.player.secretWindowListening).toBeDefined()
    expect(borrowed.player.kurapika?.held?.used).toBe(true)
    expect(command(borrowed, { action: 'window-contact' })).toBe(borrowed)
  })

  it('writes the second poem and asks an audible question without inventing a punishment or an answer', () => {
    const initial = duel('basho')
    const close = { ...initial, opponent: { ...initial.opponent, x: 50 } }
    const writing = command(close, { action: 'basho-compose', target: 'trial' })
    expect(writing.player.bashoPoem).toMatchObject({
      text: BASHO_TRIAL_POEMS.fr,
      effect: 'trial-by-fire',
      ready: false,
    })
    expect(command(writing, { action: 'basho-ask', target: 'identity' })).toBe(writing)
    const ready = frames(writing, 60)
    const asked = command(ready, { action: 'basho-ask', target: 'identity' })
    expect(asked.opponent.bashoPrompt?.owner).toBe('player')
    expect(asked.opponent.heardWords?.text).toContain('Qui es-tu')
    expect(frames(asked, 60).opponent.bashoPrompt).toBeDefined() // silence stays silence
    const answered = command(asked, { action: 'basho-answer', target: 'lie' }, 'opponent')
    expect(answered.player.heardWords?.text).toBe('Je suis Kurapika.')
    expect(answered.opponent.health).toBe(close.opponent.health)
    expect(answered.opponent.bashoBurn).toBeUndefined()
    expect(answered.player.dowsingReading).toBeUndefined()
    expect(answered.opponent.bashoPrompt).toBeUndefined()
    const punching = performAttack(ready, 'player', 'light')
    expect(
      resolveBashoPoemImpact(
        punching,
        {
          ...punching,
          impact: {
            ...createImpact(),
            projectileId: null,
          },
        },
        'player',
      ).opponent.bashoBurn,
    ).toBeUndefined()
  })

  it('expires questioning on loss of the written ability and refuses out-of-range questions', () => {
    const initial = duel('basho')
    const ready = frames(command(initial, { action: 'basho-compose', target: 'trial' }), 60)
    expect(command(ready, { action: 'basho-ask', target: 'identity' })).toBe(ready)
    const close = { ...ready, opponent: { ...ready.opponent, x: 50 } }
    const asked = command(close, { action: 'basho-ask', target: 'identity' })
    const lost = frames({ ...asked, player: { ...asked.player, bashoPoem: undefined } }, 1)
    expect(lost.opponent.bashoPrompt).toBeUndefined()
  })

  it('routes a contacted body’s wound through the right hand into the actual left-hand object', () => {
    const initial = duel('terebellum')
    const state: FightState = {
      ...initial,
      opponent: { ...initial.opponent, x: 45 },
      battlefield: {
        entities: [
          {
            id: 'receiver',
            kind: 'crate',
            material: 'real',
            owner: 'neutral',
            x: 43,
            y: 0,
            present: true,
            health: 100,
          },
        ],
        interactionHeld: { player: false, opponent: false },
        completed: { player: 0, opponent: 0 },
      },
    }
    const selected = command(state, { action: 'sweet-home-object', target: 'receiver' })
    const started = performAuraAttack({
      state: selected,
      side: 'player',
      kind: 'special',
      moveId: 'terebellum:forwardSpecial',
      auraCharged: false,
    })
    const active = {
      ...started,
      player: {
        ...started.player,
        attack: { ...started.player.attack!, frame: attackData('special', started.player).startup },
      },
    }
    const damaged = {
      ...active,
      opponent: { ...active.opponent, health: active.opponent.health - 20 },
      impact: createImpact(),
    }
    const next = resolveSweetHomeImpact({ before: active, after: damaged, damagedSide: 'opponent' })
    expect(next.opponent.health).toBe(active.opponent.health)
    expect(next.player.health).toBe(active.player.health)
    expect(next.battlefield!.entities[0].health).toBe(80)
    expect(next.impact?.objectTransfer).toEqual({
      objectId: 'receiver',
      owner: 'player',
      damage: 20,
    })
    const far = {
      ...active,
      battlefield: {
        ...active.battlefield!,
        entities: [{ ...active.battlefield!.entities[0], x: 80 }],
      },
    }
    expect(
      resolveSweetHomeImpact({ before: far, after: damaged, damagedSide: 'opponent' }).impact
        ?.objectTransfer,
    ).toBeUndefined()
  })

  it('confiscates a real handgun during LSDF escort, keeps it unavailable after expulsion in training, and resets it next round', () => {
    const initial = duel('yokotani')
    const theta = createFight('yokotani', 'theta').opponent
    const state: FightState = {
      ...initial,
      mode: 'training',
      battlefield: undefined,
      opponent: { ...theta, x: 50 },
      environment: {
        ...initial.environment,
        stageId: 'heilly-hideout',
        morenaPresent: true,
        unlawfulIntruders: { player: false, opponent: true },
      },
      lsdf: { player: { target: 'opponent', x: 50, exitX: 100, level: 1, phase: 'escorting' } },
    }
    const escorted = advanceLsdf(state)
    expect(escorted.opponent.weaponsConfiscated).toBe(true)
    expect(canUseRangedAttack(escorted.opponent)).toBe(false)
    expect(performAttack(escorted, 'opponent', 'ranged')).toBe(escorted)
    const expelled = advanceLsdf({
      ...escorted,
      lsdf: { player: { ...escorted.lsdf!.player!, x: 99.9 } },
    })
    expect(expelled.phase).toBe('fighting')
    expect(expelled.opponent.weaponsConfiscated).toBe(true)
    const reset = nextRound({ ...expelled, phase: 'finished', winner: 'player' })
    expect(reset.opponent.weaponsConfiscated).toBeUndefined()
  })

  it('allows a loaded Dolphin to select the second written composition before its one use', () => {
    const initial = duel('kurapika')
    const prepared = {
      ...initial,
      player: {
        ...initial.player,
        aura: 100,
        kurapika: {
          ...initial.player.kurapika!,
          emperorTime: true,
          held: {
            source: 'basho' as const,
            auraSupply: {
              ...captureDolphinAura(createFight('basho', 'hisoka').player),
              amount: 80,
            },
            moveId: 'basho:neutralSpecial',
            victim: 'opponent' as const,
            loaded: true,
            used: false,
            sustainedKeys: [],
          },
        },
      },
    }
    expect(
      arsenalOptions(prepared, 'player').find(
        (option) => option.command.action === 'basho-compose' && option.command.target === 'trial',
      )?.ready,
    ).toBe(true)
    const written = command(prepared, { action: 'basho-compose', target: 'trial' })
    expect(written.player.bashoPoem?.effect).toBe('trial-by-fire')
    expect(written.player.kurapika?.held?.used).toBe(true)
    expect(canAskBasho(written, 'player')).toBe(false)
  })

  it('preserves the received private feed through a replay snapshot and lets the AI use its own listening bird', () => {
    const spoken = speakPaperWords(listen(), 'opponent', 'Parole enregistrée.')
    const decoded = decodeFightSnapshot(encodeFightSnapshot(spoken), {
      player: 'musse',
      opponent: 'hisoka',
      mode: 'versus-local',
      formatId: 'knockout',
      environment: spoken.environment,
    })
    expect(decoded.player.secretWindow).toEqual(spoken.player.secretWindow)
    const initial = duel()
    const mirrored = { ...initial, player: initial.opponent, opponent: initial.player }
    const ai = singleCombatArsenalAi(mirrored, performAuraAttack)!
    expect(ai.opponent.secretWindowMode).toBe('listening')
    expect(ai.opponent.attack).not.toBeNull()
  })

  it('lets the AI switch poems, ask without answering for the human, then return to the fist poem', () => {
    const written = frames(command(duel('basho'), { action: 'basho-compose', target: 'punch' }), 60)
    const state = {
      ...written,
      frame: 650,
      player: { ...written.opponent, x: 50 },
      opponent: { ...written.player, x: 40 },
    }
    const writing = singleCombatArsenalAi(state, performAuraAttack)!
    expect(writing.opponent.bashoPoem?.effect).toBe('trial-by-fire')
    const ready = frames(writing, 60)
    const asked = singleCombatArsenalAi(ready, performAuraAttack)!
    expect(asked.player.bashoPrompt?.owner).toBe('opponent')
    expect(asked.opponent.heardWords).toBeUndefined()
    const resumed = singleCombatArsenalAi(
      { ...asked, frame: asked.frame + 180 },
      performAuraAttack,
    )!
    expect(resumed.opponent.bashoPoem?.effect).toBe('ignite-punched-target')
    expect(resumed.player.health).toBe(state.player.health)
  })
})

function createImpact(): NonNullable<FightState['impact']> {
  return {
    sequence: 1,
    attacker: 'player',
    kind: 'heavy',
    damage: 20,
    blocked: false,
    parried: false,
    critical: false,
    knockdown: false,
    counterHit: false,
    punish: false,
    antiAir: false,
    wallSplat: false,
    invulnerable: false,
    comboHits: 1,
    damageScale: 1,
    points: 1,
    zone: 'torso',
    concealed: false,
    avoided: false,
    projectileId: null,
    position: { x: 45, y: 7 },
  }
}
