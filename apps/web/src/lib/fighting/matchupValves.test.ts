import { describe, expect, it } from 'vitest'
import { beginFight, createFight } from './engine'
import { EMPTY_INPUT } from './types'
import { blinkySwallowNonNen } from './shizukuHanzoKallutoUpgrades'
import { deployHinrighBioPigeon } from './hinrighZakuroLuiniUpgrades'
import { kameoCooldownFactor, YOKOTANI_KAMEO_COOLDOWN_FACTOR } from './martialSpecialists'
import { nenTransferFrames } from './nenTransfer'
import { resolveContextInput } from './contextInput'
import { PREDATOR_FULL_FRAMES } from './predatorUpgrades'
import { attachMusseOwl } from './musseWindowUpgrades'
import { SENSE_BITS } from './saiyuSenses'
import {
  activateRihanTacticalRead,
  advanceMatchupValves,
  canSubdueCamilla,
  kurapikaChainDrainMultiplier,
  kurapikaDowsingDetectsBluff,
  releaseUniversalLocksOnBurst,
  RIHAN_TACTICAL_DEFENCE_FACTOR,
  RIHAN_TACTICAL_TRANSFER_FRAMES,
  rihanTacticalDefenceFactor,
  subdueCamillaWithoutKill,
  tserriednichConcentrationBroken,
  yokotaniIntrusionBreached,
} from './matchupValves'

describe('Anti-9-1 canonical matchup valves & Golden Rule', () => {
  it('1. Blinky rejects living Biohazard animals and Shu/Nen-charged bullets', () => {
    let state = beginFight(createFight('shizuku', 'theta', { mode: 'versus-local' }))
    state = deployHinrighBioPigeon(state, 'opponent')
    state = {
      ...state,
      hinrighBioPigeon: { ...state.hinrighBioPigeon!, x: state.player.x + 4 },
      projectiles: [
        {
          id: 'theta:shu-bullet',
          owner: 'opponent',
          x: state.player.x + 4,
          y: 4,
          vx: -2,
          vy: 0,
          radius: 1,
          damage: 12,
          knockback: 2,
          hitstun: 10,
          blockstun: 8,
          age: 1,
          lifetime: 40,
          physical: true,
          shuCharged: true,
        },
      ],
    }
    const after = blinkySwallowNonNen(state, 'player')
    expect(after.hinrighBioPigeon?.active).toBe(true)
    expect(after.projectiles).toHaveLength(1)
    expect(after.player.shizukuSwallowed).toBeUndefined()
  })

  it('2. Camilla in Zetsu at <= 15% HP can be captured via Contexte (subdue) without waking Cat’s Name', () => {
    const state = beginFight(createFight('phinks', 'camilla', { mode: 'versus-local' }))
    const lowZetsu = {
      ...state,
      opponent: {
        ...state.opponent,
        health: 12,
        nen: { ...state.opponent.nen, mode: 'zetsu' as const },
      },
    }
    expect(canSubdueCamilla(lowZetsu, 'player')).toBe(true)
    expect(resolveContextInput(lowZetsu, 'player', { ...EMPTY_INPUT, context: true }).subdue).toBe(true)

    const captured = subdueCamillaWithoutKill(lowZetsu, 'player')
    expect(captured.phase).toBe('finished')
    expect(captured.winner).toBe('player')
    expect(captured.catsName).toBeUndefined()
  })

  it('3. Yokotani LSDF requires intrusion breach in hideout and gets -35% Kameo cooldown outside', () => {
    const state = beginFight(createFight('yokotani', 'hisoka', { mode: 'versus-local' }))
    expect(kameoCooldownFactor(state.player)).toBe(YOKOTANI_KAMEO_COOLDOWN_FACTOR)

    const inHideout = {
      ...state,
      arenaId: 'heilly-hideout',
      player: { ...state.player, x: 20 },
      opponent: { ...state.opponent, x: 60 },
    }
    expect(yokotaniIntrusionBreached(inHideout, 'opponent')).toBe(false)
    const breached = { ...inHideout, opponent: { ...inHideout.opponent, x: 25 } }
    expect(yokotaniIntrusionBreached(breached, 'opponent')).toBe(true)
  })

  it('4. Rihan gets Tactical Read (2f transfer + 15% defence, no 48h seal) against non-conjured foes', () => {
    const state = beginFight(createFight('rihan', 'beyond', { mode: 'versus-local' }))
    const studied = { ...state, player: { ...state.player, predatorStudyFrames: PREDATOR_FULL_FRAMES } }
    const read = activateRihanTacticalRead(studied, 'player')
    expect(read.player.rihanTacticalRead).toBe(true)
    expect(nenTransferFrames(read.player)).toBe(RIHAN_TACTICAL_TRANSFER_FRAMES)
    expect(rihanTacticalDefenceFactor(read.player)).toBe(RIHAN_TACTICAL_DEFENCE_FACTOR)
  })

  it('5. Tserriednich Zetsu concentration breaks on sound threat or Ren Malice fear stagger', () => {
    const state = beginFight(createFight('tserriednich', 'melody', { mode: 'versus-local' }))
    const zetsuTser = {
      ...state,
      player: { ...state.player, nen: { ...state.player.nen, mode: 'zetsu' as const } },
      opponent: {
        ...state.opponent,
        melodyPerformance: { startedFrame: 0, auraSpent: 0, range: 30, active: true } as never,
      },
    }
    expect(tserriednichConcentrationBroken(zetsuTser, 'player')).toBe(true)
  })

  it('6. Kurapika Dowsing detects call bluffs and active chains accelerate Emperor Time drain', () => {
    const state = beginFight(createFight('kurapika', 'hisoka', { mode: 'versus-local' }))
    expect(kurapikaDowsingDetectsBluff(state, 'player', { ...EMPTY_INPUT, call: true })).toBe(true)
    expect(kurapikaChainDrainMultiplier({ ...state.player, chainJail: { holder: 'player' } as never })).toBe(1.5)
  })

  it('Golden Rule: Burst clears absolute binary locks (Beast seal, swap, needles, cuffs, sense seals, owl)', () => {
    let state = beginFight(createFight('musse', 'hisoka', { mode: 'versus-local' }))
    state = attachMusseOwl(state, 'player')
    state = {
      ...state,
      opponent: {
        ...state.opponent,
        burstZetsuFrames: 60,
        tserriednichBeastSealed: true,
        halkenburgSwappedFrames: 200,
        illumiNeedleOrder: { order: 'zetsu', remainingFrames: 120 },
        hinrighCuffed: true,
        hatsuEffects: { ...state.opponent.hatsuEffects, senseSeals: SENSE_BITS.speech },
      },
    }
    const freed = releaseUniversalLocksOnBurst(state, 'opponent')
    expect(freed.opponent.tserriednichBeastSealed).toBeUndefined()
    expect(freed.opponent.halkenburgSwappedFrames).toBeUndefined()
    expect(freed.opponent.illumiNeedleOrder).toBeUndefined()
    expect(freed.opponent.hinrighCuffed).toBeUndefined()
    expect(freed.opponent.hatsuEffects.senseSeals).toBe(0)
    expect(freed.musseOwl).toBeUndefined()

    const stepped = advanceMatchupValves(state, { player: EMPTY_INPUT, opponent: EMPTY_INPUT })
    expect(stepped.opponent.tserriednichBeastSealed).toBeUndefined()
  })
})
