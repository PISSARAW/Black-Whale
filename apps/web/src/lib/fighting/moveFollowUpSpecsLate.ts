import type { FighterId } from './types'
import type { FollowUpSpec } from './moveFollowUps'

export const LATE_WAVE_FOLLOW_UPS: Partial<Record<FighterId, readonly FollowUpSpec[]>> = {
  rihan: [
    {
      id: 'rihan:recorded-error',
      sourceSlot: 'forwardLight',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'rihan:predator-followup',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
  zakuro: [
    {
      id: 'zakuro:blood-needle',
      sourceSlot: 'forwardLight',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'zakuro:bloody-mary-followup',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
  melody: [
    {
      id: 'melody:heard-heartbeat',
      sourceSlot: 'forwardLight',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'melody:three-minutes-silence',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
  basho: [
    {
      id: 'basho:fire-rhyme',
      sourceSlot: 'forwardLight',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'basho:final-tercet',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
  camilla: [
    {
      id: 'camilla:provocation-shot',
      sourceSlot: 'forwardLight',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'camilla:cats-name-followup',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
  halkenburg: [
    {
      id: 'halkenburg:princes-bow',
      sourceSlot: 'forwardLight',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'halkenburg:grimmels-arrow',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
  gel: [
    {
      id: 'gel:constricting-spiral',
      sourceSlot: 'forwardLight',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'gel:zodiac-fang',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
  lynch: [
    {
      id: 'lynch:cross-interrogation',
      sourceSlot: 'forwardLight',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'lynch:forced-confession',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
  luini: [
    {
      id: 'luini:false-exit',
      sourceSlot: 'forwardLight',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'luini:inner-world-tour',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
  bill: [
    {
      id: 'bill:obstacle-vine',
      sourceSlot: 'forwardLight',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'bill:emergency-growth',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
  furykov: [
    {
      id: 'furykov:graduated-pressure',
      sourceSlot: 'forwardLight',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'furykov:combo-master-followup',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
  cluck: [
    {
      id: 'cluck:blinding-wingbeat',
      sourceSlot: 'forwardLight',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'cluck:zodiac-flock',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
  beyond: [
    {
      id: 'beyond:forbidden-crossing',
      sourceSlot: 'forwardLight',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'beyond:expedition-debt',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
  longhi: [
    {
      id: 'longhi:five-second-truce',
      sourceSlot: 'forwardLight',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'longhi:final-rider',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
  musse: [
    {
      id: 'musse:cross-listening',
      sourceSlot: 'forwardLight',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'musse:monitored-execution',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
  padaille: [
    {
      id: 'padaille:returning-axe',
      sourceSlot: 'forwardLight',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'padaille:three-tools-one-victim',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
  sayird: [
    {
      id: 'sayird:sensory-recall',
      sourceSlot: 'forwardLight',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'sayird:total-surveillance',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
  terebellum: [
    {
      id: 'terebellum:crossed-passage',
      sourceSlot: 'forwardLight',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'terebellum:sweet-home-followup',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
  voconte: [
    {
      id: 'voconte:swinging-return',
      sourceSlot: 'forwardLight',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'voconte:domestic-labyrinth',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
  yokotani: [
    {
      id: 'yokotani:summons',
      sourceSlot: 'forwardLight',
      baseSlot: 'airHeavy',
      input: 'heavy',
      condition: 'airborne',
    },
    {
      id: 'yokotani:lsdf-followup',
      sourceSlot: 'forwardHeavy',
      baseSlot: 'throw',
      input: 'heavy',
      condition: 'on-hit',
    },
  ],
}
