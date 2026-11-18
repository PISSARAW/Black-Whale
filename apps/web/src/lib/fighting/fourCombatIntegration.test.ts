import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { render } from 'svelte/server'
import Status from '$lib/components/fighting/FightMultiCombatStatus.svelte'
import { multiDuel, multiCommand } from './fourCombatTestKit'
import { createFight, performAuraAttack } from './engine'
import { createFightEnvironment } from './fightEnvironment'
import {
  performBenjaminToxin,
  advanceBenjaminToxin,
  TOXIN_COMA_FRAME,
  TOXIN_FATAL_FRAME,
} from './benjaminToxin'
import { parsePvpPacket } from './pvp/protocol'
import { applyPvpCommand } from './pvp/commands'
import { privatePvpState } from './pvp/view'
import { createHistoricalEquipmentScene } from './historicalEquipmentScene'
import { createHalkenburgArrowScene } from './halkenburgArrowScene'
import { advanceHistoricalWeapons } from './historicalWeaponFrame'
import { multiActive } from './fourCombatTestKit'
import { fourCombatAi } from './fourCombatAi'
import { panelReplayCommand } from './fightReplayPanels'
import { executeReplayPacket } from './fightReplayCommands'
import { createReplayRecorder } from './fightReplayRecorder'
import { createReplayPlayer } from './fightReplayPlayer'
import { decodeFightReplay } from './fightReplayCodec'
import { fightReplayHash } from './fightReplayHash'
import { nextRound } from './engine'
import type { ReplayPacket, ReplayCommand } from './fightReplayTypes'
import type { ArsenalCommand } from './retrospectiveTypes'

vi.mock('$app/stores', async () => {
  const { readable } = await import('svelte/store')
  return { page: readable({ url: new URL('http://localhost/fr/fighting'), data: {} }) }
})

describe('four-plus encounters: integrations', () => {
  it.each(['leorio', 'hisoka', 'illumi', 'tserriednich', 'franklin'] as const)(
    'reconstructs %s’s setup and physical ticks deterministically',
    (id) => {
      let s = createFight(id, 'theta', { mode: 'versus-local', formatId: 'knockout' })
      const recorder = createReplayRecorder(s)!
      function packet(commands: ReplayCommand[] = [], dt = 1 / 60) {
        const p: ReplayPacket = [dt, 0, 0, commands],
          after = executeReplayPacket(s, p)
        recorder.append(s, p, after)
        s = after
      }
      packet([{ kind: 'start' }], 0)
      const command: ArsenalCommand = (
        {
          leorio: { action: 'weapon-throw' },
          hisoka: { action: 'gum-heart' },
          illumi: { action: 'illumi-mask', target: 'hisoka' },
          tserriednich: { action: 'future-field-mode' },
          franklin: { action: 'franklin-aim', target: 'split' },
        } as const
      )[id]
      const after = multiCommand(s, command)
      expect(after).not.toBe(s)
      packet([panelReplayCommand(s, after)], 0)
      for (let n = 0; n < 45; n++) packet()
      const replay = createReplayPlayer(decodeFightReplay(JSON.stringify(recorder.snapshot())))
      for (let i = 0; i < 200 && !replay.done; i++) replay.advance(0.05, 3)
      expect(replay.error).toBe('')
      expect(replay.done).toBe(true)
      expect(fightReplayHash(replay.state)).toBe(fightReplayHash(s))
    },
  )
  it('routes a real P2 knife order and rejects injected resources', () => {
    const s = multiDuel('theta', 'leorio'),
      command = { action: 'weapon-throw' as const }
    const packet = { sequence: 0, input: 0, commands: [{ kind: 'arsenal', command }] }
    expect(parsePvpPacket(packet)).toEqual(packet)
    expect(
      parsePvpPacket({
        ...packet,
        commands: [
          { kind: 'arsenal', command: { ...command, physicalBlade: { weapon: 'switchblade' } } },
        ],
      }),
    ).toBeNull()
    const next = applyPvpCommand(s, 'opponent', { kind: 'arsenal', command })
    expect(next.opponent.historicalWeaponThrow).toBe('switchblade')
    expect(next.player.historicalWeaponThrow).toBeUndefined()
  })
  it('displays actual finite ammunition and private preparation status', () => {
    const s = multiDuel('tserriednich')
    const html = render(Status, {
      props: {
        state: { ...s, player: { ...s.player, princeSidearmRounds: 3, futureStoredFrames: 120 } },
        side: 'player',
        language: 'fr',
      },
    }).body
    expect(html).toContain('Cartouches')
    expect(html).toContain('3')
    expect(html).toContain('2.0')
  })
  it('preserves remembered-model, corpse-preparation and heard-voice status from the previous lot', () => {
    const s = multiDuel('bonolenov')
    const status = {
      ...s,
      player: {
        ...s.player,
        battleCantabile: {
          models: {},
          preparation: null,
          prologue: false,
          form: null,
          selectedModel: 'hisoka' as const,
        },
        corpsePreparation: { target: 'body', frames: 60, x: 30, y: 0 },
        heardCorpse: {
          frame: s.frame,
          text: 'La voix imposée.',
          source: 'body',
          owner: 'player' as const,
        },
      },
    }
    const html = render(Status, { props: { state: status, side: 'player', language: 'fr' } }).body
    expect(html).toContain('Modèle choisi')
    expect(html).toContain('Implantation du cadavre')
    expect(html).toContain('La voix imposée.')
  })
  it('moves the visible knife with its released projectile and disposes its equipment meshes', () => {
    const s = advanceHistoricalWeapons(
      multiActive(multiCommand(multiDuel('leorio'), { action: 'weapon-throw' })),
    )
    const scene = new THREE.Scene(),
      effect = createHistoricalEquipmentScene({ THREE, scene, worldX: (x) => x, worldY: (y) => y })
    effect.sync(s, 0)
    const root = scene.getObjectByName(
      `historical-weapon:projectile:${s.projectiles[0].id}:switchblade`,
    )!
    expect(root.position.x).toBe(s.projectiles[0].x)
    effect.sync({ ...s, projectiles: [{ ...s.projectiles[0], x: 50 }] }, 1)
    expect(root.position.x).toBe(50)
    effect.dispose()
    expect(scene.children).toHaveLength(0)
  })
  it('draws Halkenburg’s released arrow at the combat coordinate, including beyond its owner’s animation', () => {
    const base = multiDuel('halkenburg'),
      scene = new THREE.Scene()
    const effect = createHalkenburgArrowScene({ THREE, scene, worldX: (x) => x, worldY: (y) => y })
    const s = {
      ...base,
      projectiles: [
        {
          id: 9,
          owner: 'player' as const,
          fighterId: 'halkenburg' as const,
          x: 54,
          y: 6,
          velocityX: 150,
          width: 1,
          height: 0.5,
          damage: 0,
          hitstun: 0,
          blockstun: 0,
          hitstop: 0,
          knockback: 0,
          targetZone: 'torso' as const,
          shape: 'needle' as const,
          colour: '#fff',
          matter: 'nen' as const,
          age: 5,
          lifetime: 120,
          halkenburgArrow: { participant: 'self:player' },
        },
      ],
    }
    effect.sync(s, 0)
    expect(scene.getObjectByName('halkenburg-shot:9')?.position.x).toBe(54)
    effect.dispose()
    expect(scene.children).toHaveLength(0)
  })
  it('gives AI only its own new setup and the distance it actually perceives', () => {
    const s = multiDuel('theta', 'hisoka')
    s.opponent.x = 80
    const next = fourCombatAi(s, performAuraAttack)!
    expect(next.opponent.gumHeartPreparation).toBe(18)
    const hidden = {
      ...s,
      player: { ...s.player, aura: 1, futureStoredFrames: 99999, gumHeartArmed: true },
    }
    expect(fourCombatAi(hidden, performAuraAttack)?.arsenalTrace?.command).toEqual(
      next.arsenalTrace?.command,
    )
  })
  it('treats TSK-17 as finite scenario equipment, exposes the carrier too and retains no cloud across rounds', () => {
    const base = multiDuel('benjamin', 'camilla'),
      command = { action: 'benjamin-toxin' as const }
    expect(multiCommand(base, command)).toBe(base)
    let s = {
      ...base,
      environment: createFightEnvironment({
        preparation: { mode: 'scenario', resources: [], cohorts: [] },
      }),
      opponent: { ...base.opponent, x: 34 },
    }
    s = performBenjaminToxin({ state: s, side: 'player', command })
    expect(s.player.toxinChargeSpent).toBe(true)
    expect(multiCommand(s, command)).toBe(s)
    s = advanceBenjaminToxin(s)
    expect(s.player.toxinExposure?.age).toBe(1)
    expect(s.opponent.toxinExposure?.age).toBe(1)
    const view = privatePvpState(s, 'opponent')
    expect(view.toxinClouds).toHaveLength(0)
    expect(view.opponent.toxinExposure).toBeUndefined()
    s = {
      ...s,
      player: { ...s.player, toxinExposure: { owner: 'player', age: TOXIN_COMA_FRAME - 1 } },
    }
    expect(advanceBenjaminToxin(s).player.hitStun).toBeGreaterThan(0)
    const next = nextRound({ ...s, phase: 'finished', winner: 'draw' })
    expect(next.toxinClouds).toBeUndefined()
    expect(next.player.toxinExposure).toBeUndefined()
  })
  it('attributes a delayed toxin death without promising a new counter to Cat’s Name', () => {
    let s = multiDuel('benjamin', 'camilla')
    s = {
      ...s,
      player: { ...s.player, health: 0 },
      opponent: { ...s.opponent, toxinExposure: { owner: 'player', age: TOXIN_FATAL_FRAME - 1 } },
    }
    const dead = advanceBenjaminToxin(s)
    expect(dead.opponent.health).toBe(0)
    expect(dead.catsName).toBeUndefined()
  })
})
