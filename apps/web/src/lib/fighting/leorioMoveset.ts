import { buildMoveset } from './movesetFactory'
import type { FighterMoveset } from './movesetTypes'

/** Only the surface-transmitted punch is attested; ordinary blows stay arcade abstractions. */
export function leorioMoveset(): FighterMoveset {
  const base = buildMoveset({
    fighterId: 'leorio',
    mechanic: [
      'Poing à distance : frappe le sol et transmet l’aura dans la surface. Le poing surgit au point visé, sans suivre la cible après la frappe. L et U utilisent la même technique, au sol uniquement.',
      'Remote punch: strike the floor and transmit aura through the surface. The fist emerges at the aimed point without tracking the target afterward. L and U use the same technique, grounded only.',
    ],
    finisherCondition: ['', ''],
    labels: [
      'Direct|Straight',
      'Crochet|Hook',
      'Coup au corps|Body Blow',
      'Balayage|Sweep',
      'Direct aérien|Air Straight',
      'Poing sous le pont|Under-Bridge Fist',
      'Direct d’urgence|Emergency Straight',
      'Diagnostic bas|Low Diagnosis',
      'Réanimation combative|Combat Resuscitation',
      'Poing à distance|Remote Punch',
      'Poing à distance|Remote Punch',
      'Poing à distance|Remote Punch',
      'Poing à distance|Remote Punch',
      'Salle d’opération|Operating Room',
      'Poing à distance|Remote Punch',
    ],
    speed: 1.02,
    power: 1.02,
    reach: 1,
    combos: [
      ['standingLight', 'standingHeavy', 'neutralSpecial'],
      ['lowLight', 'forwardLight', 'neutralSpecial'],
      ['airLight', 'airHeavy'],
    ],
  })
  return {
    ...base,
    moves: base.moves
      .filter((move) => move.category !== 'finisher')
      .filter((move) => move.category !== 'special' || move.slot === 'neutralSpecial')
      .map((move) =>
        move.slot !== 'neutralSpecial'
          ? move
          : {
              ...move,
              input: 'L / U',
              tuning: {
                ...move.tuning,
                startup: 18,
                active: 1,
                recovery: 30,
                damage: 19,
                reach: 33,
                lunge: 0,
                targetZone: 'head',
              },
            },
      ),
  }
}
