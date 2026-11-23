import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performMove } from './engine'
import { moveById, moveForAction, moveForSlot, movesetFor } from './movesets'
import { REPLAY_RULESET } from './fightReplayTypes'
import { EMPTY_INPUT, type FighterId } from './types'

describe('priority signature moves and contextual follow-ups', () => {
  it('advances the replay ruleset for the updated moveset behaviour', () => {
    expect(REPLAY_RULESET).toBe('clash-combat-90')
  })

  it.each([
    [
      'feitan',
      {
        forwardLight: ['Croisement funèbre', 'Crossing Funeral'],
        forwardHeavy: ['Escalier de la douleur', 'Stairway of Pain'],
        backHeavy: ['Lame sans ombre', 'Shadowless Blade'],
        airHeavy: ['Pluie du bourreau', 'Executioner Rain'],
        throw: ['Retour de supplice', 'Torment Return'],
      },
    ],
    [
      'machi',
      {
        forwardLight: ['Point invisible', 'Invisible Stitch'],
        forwardHeavy: ['Croix de couture', 'Seam Cross'],
        backHeavy: ['Marionnette brisée', 'Broken Puppet'],
        airHeavy: ['Rappel de l’aiguille', 'Needle Recall'],
        throw: ['Suture punitive', 'Punitive Suture'],
      },
    ],
    [
      'hisoka',
      {
        forwardLight: ['Carte boomerang', 'Boomerang Card'],
        forwardHeavy: ['Tête de marteau', 'Hammerhead'],
        backHeavy: ['Faux déséquilibre', 'False Off-Balance'],
        airHeavy: ['Trapèze meurtrier', 'Deadly Trapeze'],
        throw: ['Étreinte élastique', 'Elastic Embrace'],
      },
    ],
    [
      'kalluto',
      {
        forwardLight: ['Éventail lunaire', 'Lunar Fan'],
        forwardHeavy: ['Pas de papier', 'Paper Step'],
        backHeavy: ['Mue protectrice', 'Protective Shedding'],
        airHeavy: ['Serpent ascendant', 'Ascending Serpent'],
        throw: ['Morsure aux cent écailles', 'Hundred-Scale Bite'],
      },
    ],
    [
      'saiyu',
      {
        forwardLight: ['Perche du singe', 'Monkey Pole'],
        forwardHeavy: ['Queue balayante', 'Sweeping Tail'],
        backHeavy: ['Trois refus', 'Three Refusals'],
        airHeavy: ['Bond du pèlerin', 'Pilgrim Leap'],
        throw: ['Cage des trois singes', 'Three Monkeys Cage'],
      },
    ],
  ] as const)('replaces the five generic physical slots for %s while keeping 15 slots', (id, map) => {
    const moveset = movesetFor(id as FighterId)!
    expect(moveset.moves).toHaveLength(15)
    for (const [slot, [fr, en]] of Object.entries(map)) {
      const move = moveForSlot(id as FighterId, slot as keyof typeof map)!
      expect(move.nameFr).toBe(fr)
      expect(move.nameEn).toBe(en)
    }
  })

  it('registers contextual MoveFollowUp variants and resolves them on condition', () => {
    const feitan = movesetFor('feitan')!
    expect(feitan.followUps?.map((entry) => entry.id)).toEqual([
      'feitan:pain-stairway',
      'feitan:execution-rain',
      'feitan:shadowless-blade',
    ])
    expect(moveById('feitan:pain-stairway')?.nameFr).toBe('Escalier de la douleur')
    expect(moveById('feitan:execution-rain')?.nameFr).toBe('Pluie du bourreau')
    expect(moveById('feitan:shadowless-blade')?.nameFr).toBe('Lame sans ombre')

    const state = beginFight(createFight('feitan', 'hisoka', { mode: 'training' }))
    const afterCrossingHit = {
      ...state.player,
      attack: {
        moveId: 'feitan:forwardLight',
        kind: 'light' as const,
        frame: 6,
        impacted: true,
        confirmedHit: true,
        auraCharged: false,
        concealed: false,
        hatsuSource: null,
        projectileSpawned: false,
        reversal: false,
      },
    }
    expect(moveForAction(afterCrossingHit, 'heavy', EMPTY_INPUT)?.id).toBe('feitan:pain-stairway')
    expect(
      moveForAction(afterCrossingHit, 'heavy', { ...EMPTY_INPUT, left: true })?.id,
    ).toBe('feitan:shadowless-blade')

    const airborneLauncher = {
      ...afterCrossingHit,
      y: 4,
      attack: {
        ...afterCrossingHit.attack,
        moveId: 'feitan:forwardHeavy',
        kind: 'heavy' as const,
      },
    }
    expect(moveForAction(airborneLauncher, 'heavy', EMPTY_INPUT)?.id).toBe('feitan:execution-rain')
  })

  it('supports Machi on-hit and on-block follow-ups from Point invisible', () => {
    const state = beginFight(createFight('machi', 'chrollo', { mode: 'training' }))
    const baseAttack = {
      moveId: 'machi:forwardLight',
      kind: 'light' as const,
      frame: 7,
      impacted: true,
      confirmedHit: true,
      confirmedBlock: false,
      auraCharged: false,
      concealed: false,
      hatsuSource: null,
      projectileSpawned: false,
      reversal: false,
    }
    const onHitMachi = { ...state.player, attack: baseAttack }
    expect(moveForAction(onHitMachi, 'heavy', EMPTY_INPUT)?.id).toBe('machi:seam-cross')

    const onBlockMachi = {
      ...state.player,
      attack: { ...baseAttack, confirmedHit: false, confirmedBlock: true },
    }
    expect(moveForAction(onBlockMachi, 'heavy', EMPTY_INPUT)?.id).toBe('machi:broken-puppet')

    const next = performMove({
      state: { ...state, player: onBlockMachi },
      side: 'player',
      action: 'heavy',
      input: EMPTY_INPUT,
    })
    expect(next.player.attack?.moveId).toBe('machi:broken-puppet')
  })
})
