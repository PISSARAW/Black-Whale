import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performMove } from './engine'
import { moveById, moveForAction, moveForSlot, movesetFor } from './movesets'
import { REPLAY_RULESET } from './fightReplayTypes'
import { EMPTY_INPUT, type FighterId } from './types'

describe('priority signature moves and contextual follow-ups', () => {
  it('uses the current replay ruleset', () => {
    expect(REPLAY_RULESET).toBe('clash-combat-104')
  })

  it.each([
    [
      'kurapika',
      {
        forwardLight: ['Pendule rasant', 'Low Pendulum'],
        forwardHeavy: ['Pas de l’index', 'Index Step'],
        backHeavy: ['Rappel du geôlier', 'Jailer Recall'],
        airHeavy: ['Croix des cinq doigts', 'Five-Finger Cross'],
        throw: ['Verdict écarlate', 'Scarlet Verdict'],
      },
    ],
    [
      'chrollo',
      {
        forwardLight: ['Page tranchante', 'Cutting Page'],
        forwardHeavy: ['Lecture en mouvement', 'Moving Reading'],
        backHeavy: ['Pas du voleur', 'Thief’s Step'],
        airHeavy: ['Signet trompeur', 'Deceptive Bookmark'],
        throw: ['Chapitre final', 'Final Chapter'],
      },
    ],
    [
      'benjamin',
      {
        forwardLight: ['Percée du premier prince', 'First Prince Breakthrough'],
        forwardHeavy: ['Genou d’exécution', 'Execution Knee'],
        backHeavy: ['Discipline de fer', 'Iron Discipline'],
        airHeavy: ['Air Blow ascendant', 'Ascending Air Blow'],
        throw: ['Commandement absolu', 'Absolute Command'],
      },
    ],
    [
      'tserriednich',
      {
        forwardLight: ['Pas après la pause', 'Step after the Pause'],
        forwardHeavy: ['Rupture de l’axe', 'Break the Line'],
        backHeavy: ['Temps volé', 'Stolen Beat'],
        airHeavy: ['Revers suspendu', 'Suspended Backfist'],
        throw: ['Un instant de retard', 'A Moment Too Late'],
      },
    ],
    [
      'theta',
      {
        forwardLight: ['Prise de ligne', 'Line Check'],
        forwardHeavy: ['Interception au genou', 'Knee Intercept'],
        backHeavy: ['Contre sous couverture', 'Covering Counter'],
        airHeavy: ['Talon de barrage', 'Blocking Heel'],
        throw: ['Mise à l’écart', 'Removal from the Line'],
      },
    ],
    [
      'biscuit',
      {
        forwardLight: ['Leçon de posture', 'Posture Lesson'],
        forwardHeavy: ['Petit pas Shingen', 'Short Shingen Step'],
        backHeavy: ['Révélation musculaire', 'Muscular Reveal'],
        airHeavy: ['Paume montante', 'Rising Palm'],
        throw: ['Correction absolue', 'Absolute Correction'],
      },
    ],
    [
      'phinks',
      {
        forwardLight: ['Marche du Cyclotron', 'Cyclotron March'],
        forwardHeavy: ['Bélier de Meteor City', 'Meteor City Ram'],
        backHeavy: ['Faux relâchement', 'False Release'],
        airHeavy: ['Tour mort', 'Dead Turn'],
        throw: ['Poing sans retour', 'No-Return Fist'],
      },
    ],
    [
      'franklin',
      {
        forwardLight: ['Marche de suppression', 'Suppression March'],
        forwardHeavy: ['Croisement balistique', 'Ballistic Crossfire'],
        backHeavy: ['Crosse humaine', 'Human Stock'],
        airHeavy: ['Rideau antiaérien', 'Anti-Air Curtain'],
        throw: ['Dernière cartouche', 'Last Round'],
      },
    ],
    [
      'illumi',
      {
        forwardLight: ['Pas arrêté', 'Stop Step'],
        forwardHeavy: ['Percussion du talon', 'Heel Intercept'],
        backHeavy: ['Reprise dans l’axe', 'Line Reset'],
        airHeavy: ['Tranchant en descente', 'Descending Hand Edge'],
        throw: ['L’articulation inutile', 'The Useless Joint'],
      },
    ],
    [
      'bonolenov',
      {
        forwardLight: ['Pas en travers', 'Cross Step'],
        forwardHeavy: ['Tour du talon', 'Turning Heel'],
        backHeavy: ['Reprise sur le contretemps', 'Offbeat Return'],
        airHeavy: ['Talon de cadence', 'Cadence Heel'],
        throw: ['La valse du guerrier', 'The Warrior’s Waltz'],
      },
    ],
    [
      'shizuku',
      {
        forwardLight: ['Blinky marteau', 'Hammer Blinky'],
        forwardHeavy: ['Nettoyage latéral', 'Lateral Cleaning'],
        backHeavy: ['Zone propre', 'Clean Zone'],
        airHeavy: ['Remontée de poussière', 'Dust Uprise'],
        throw: ['Hémorragie aspirée', 'Vacuumed Hemorrhage'],
      },
    ],
    [
      'hinrigh',
      {
        forwardLight: ['Main sur l’épaule', 'Shoulder Check'],
        forwardHeavy: ['Percée de l’épaule', 'Shoulder Entry'],
        backHeavy: ['Revers de dégagement', 'Clearing Backfist'],
        airHeavy: ['Rabattage à deux bras', 'Two-Arm Takedown'],
        throw: ['La poignée de main des Xi-Yu', 'The Xi-Yu Handshake'],
      },
    ],
    [
      'mizaistom',
      {
        forwardLight: ['Marquer la ligne', 'Mark the Line'],
        forwardHeavy: ['Refoulement', 'Pushback'],
        backHeavy: ['Coude de barrage', 'Barring Elbow'],
        airHeavy: ['Coude d’interception', 'Intercepting Elbow'],
        throw: ['Fin de la déposition', 'End of Deposition'],
      },
    ],
    [
      'leorio',
      {
        forwardLight: ['Double pas de boxe', 'Boxing Step'],
        forwardHeavy: ['Direct du droit en charge', 'Driving Right Cross'],
        backHeavy: ['Crochet de recul', 'Pull Counter'],
        airHeavy: ['Crochet à la retombée', 'Dropping Hook'],
        throw: ['La bascule de l’épaule', 'The Shoulder Turn'],
      },
    ],
    [
      'hanzo',
      {
        forwardLight: ['Pas masqué', 'Hidden Step'],
        forwardHeavy: ['Paume de traversée', 'Crossing Palm'],
        backHeavy: ['Retrait en ciseaux', 'Scissor Retreat'],
        airHeavy: ['Talon rabattu', 'Dropping Heel'],
        throw: ['La clef silencieuse', 'The Silent Lock'],
      },
    ],
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
        forwardLight: ['Pas de couture', 'Stitch Step'],
        forwardHeavy: ['Double appui de traction', 'Braced Pull'],
        backHeavy: ['Reprise au poignet', 'Wrist Return'],
        airHeavy: ['Crochet qui ramène', 'Drawing Hook'],
        throw: ['Le point de croix', 'The Cross-Stitch'],
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
        forwardLight: ['Pas de pointe', 'Staff Step'],
        forwardHeavy: ['Grand arc de la hampe', 'Wide Staff Arc'],
        backHeavy: ['Talon du bâton', 'Staff Butt'],
        airHeavy: ['Hampe descendante', 'Descending Shaft'],
        throw: ['Le grand levier', 'The Long Lever'],
      },
    ],
  ] as const)('replaces the five generic physical slots for %s', (id, map) => {
    const moveset = movesetFor(id as FighterId)!
    expect(moveset.followUps?.length).toBeGreaterThanOrEqual(2)
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
    expect(moveForAction(afterCrossingHit, 'heavy', { ...EMPTY_INPUT, left: true })?.id).toBe(
      'feitan:shadowless-blade',
    )

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
