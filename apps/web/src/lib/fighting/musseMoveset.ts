import { buildMoveset } from './movesetFactory'
import type { FighterMoveset } from './movesetTypes'

/** Chapter 373: an ordinary handgun and a contact surveillance bird, no execution Hatsu. */
export function musseMoveset(): FighterMoveset {
  const base = buildMoveset({
    fighterId: 'musse',
    mechanic: [
      'U : tir au pistolet, sans aura. L : poser Secret Window au contact ; le hibou transmet les gestes de la cible sans dégâts, entrave ni lecture d’aura. La garde ne supprime pas un contact réel. Le hibou n’est visible que de son utilisateur.',
      'U: fire the handgun without aura. L: attach Secret Window by touch; its owl reports the target’s gestures without damage, restraint or aura reading. Guard does not negate physical touch. Only the user sees the owl.',
    ],
    finisherCondition: ['', ''],
    labels: [
      'Direct du garde|Guard Straight',
      'Crochet|Hook',
      'Coup bas|Low Strike',
      'Balayage|Sweep',
      'Direct aérien|Air Straight',
      'Coup descendant|Descending Blow',
      'Direct en avançant|Advancing Straight',
      'Coup d’épaule|Shoulder Strike',
      'Revers|Backfist',
      'Secret Window|Secret Window',
      'Secret Window|Secret Window',
      'Secret Window|Secret Window',
      'Secret Window|Secret Window',
      'Projection|Throw',
      'Secret Window|Secret Window',
    ],
    speed: 0.9,
    power: 1,
    reach: 1,
    combos: [
      ['standingLight', 'standingHeavy'],
      ['lowLight', 'forwardLight', 'forwardHeavy'],
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
              auraCost: 16,
              canon: {
                source: 'Hunter × Hunter — chapter 373, Secret Window',
                evidence: 'manga-shown',
                conditions: ['Attach the surveillance owl through physical contact.'],
                prohibitions: ['No damage, paralysis, evasion, aura reading or prediction.'],
                narrativeCost:
                  'Physical contact; startup, aura cost and Nen interruption are duel tuning.',
                narrativeEffect:
                  'Only the user sees the owl; it relays the target’s bodily actions and speech.',
              },
              tuning: {
                ...move.tuning,
                startup: 12,
                active: 4,
                recovery: 18,
                damage: 0,
                lunge: 0,
                reach: 6,
                hitstun: 0,
                blockstun: 0,
                hitstop: 0,
                knockback: 0,
              },
            },
      ),
  }
}
