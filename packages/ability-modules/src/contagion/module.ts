import {
  abilityGrant,
  attributeCounter,
  belowCapacity,
  buildManifest,
  canUseNen,
  checklist,
  controlLink,
  defineAbility,
  effect,
  effectAttributeAtLeast,
  effectIsLive,
  isConscious,
  knowledgeGrant,
  param,
  person,
  requiresParameter,
  requiresTarget,
  setEffectState,
  spawnNenEntity,
} from '@black-whale/ability-sdk'

const COHORT_ID = 'heil-ly-infected'

/** Canon point values: an ordinary victim is worth one level, a prince fifty. */
const KILL_VALUES: Record<string, number> = {
  ordinary: 1,
  'nen-user': 10,
  prince: 50,
}

/** The level at which an infected member generates an ability of their own. */
const UNIQUE_ABILITY_LEVEL = 20
/** Member Zero. */
const MEMBER_ZERO_LEVEL = 100
/** Morena can hold at most twenty-two infected at a time. */
const NETWORK_CAPACITY = 22

const INFECTION_STEPS = ['game-won-yes', 'kiss', 'witnessed-murder']

function killValue(status: string | undefined): number {
  return status ? (KILL_VALUES[status] ?? KILL_VALUES['ordinary']!) : KILL_VALUES['ordinary']!
}

/**
 * Contagion (Et tu, Juliet) — Morena Prudo
 *
 * The ability that exercises every engine at once: a bounded cohort, a per-member
 * counter that levels up on kills, a permanent knowledge feed back to Morena, and
 * an ability granted at level 20. The three canonical infection conditions are a
 * checklist rather than a paragraph, so the "Why?" panel can show which of them
 * a given candidate has already met.
 */
export const contagion = defineAbility({
  id: 'contagion',
  name: 'Contagion (Et tu, Juliet)',
  owner: 'morena-prudo',
  category: 'manipulator',

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  actions: {
    'open-network': {
      label: 'Ouvrir le réseau',
      effects: [
        spawnNenEntity({ id: COHORT_ID, kind: 'COHORT', label: 'Infectés Heil-Ly' }),
        effect({
          kind: 'CUSTOM',
          discriminator: 'network',
          targets: () => [{ id: COHORT_ID, kind: 'COHORT' }],
          attributes: {
            cohortId: COHORT_ID,
            memberIds: [],
            capacity: NETWORK_CAPACITY,
            rules: [
              'Vingt-deux infectés au maximum.',
              'La contamination passe par la salive.',
              'Le jeu prend fin à la mort de Morena, à la mort de la cible, ou lorsqu’il est accompli.',
            ],
          },
        }),
      ],
    },

    infect: {
      label: 'Infecter',
      conditions: [
        requiresTarget('Une cible est embrassée'),
        checklist(
          'infection',
          'Les trois conditions d’infection sont remplies (jeu gagné en « Yes », baiser, meurtre observé)',
          INFECTION_STEPS,
        ),
        belowCapacity('memberCount', NETWORK_CAPACITY, 'Le réseau compte moins de 22 infectés'),
        effectIsLive('effectId', 'Le réseau est ouvert'),
      ],
      effects: [
        attributeCounter({ append: (ctx) => ({ memberIds: ctx.targets }) }),
        // One effect per member: this is what the Heil-Ly dashboard reads.
        effect({
          kind: 'CUSTOM',
          discriminator: 'member',
          attributes: (ctx) => ({
            cohortId: COHORT_ID,
            memberId: ctx.targets[0],
            level: 0,
            kills: 0,
          }),
        }),
        // Morena sees the position, the state and the score of every member.
        controlLink({ vector: 'saliva', mode: 'listen', attributes: { cohortId: COHORT_ID } }),
        knowledgeGrant({
          factId: (ctx) => `infected:${ctx.targets[0] ?? 'unknown'}`,
          state: 'KNOWN',
        }),
      ],
      cost: { label: 'Une place du réseau', amount: 1, unit: 'slot sur 22' },
    },

    'record-kill': {
      label: 'Enregistrer un meurtre',
      conditions: [
        effectIsLive('effectId', 'Le membre est toujours infecté'),
        requiresParameter('victimStatus', 'Le statut de la victime est connu'),
      ],
      effects: [
        // The engine knows whether the victim was an ordinary person, a Nen user
        // or a prince, so the score does not have to be supplied by the caller.
        attributeCounter({
          increments: (ctx) => ({
            kills: 1,
            level: killValue(param(ctx, 'victimStatus')),
          }),
        }),
        knowledgeGrant({
          factId: (ctx) => `kill:${param(ctx, 'victimId') ?? 'unknown'}`,
          observerId: 'morena-prudo',
          state: 'KNOWN',
        }),
      ],
    },

    'grant-unique-ability': {
      label: 'Générer la capacité unique (niveau 20)',
      conditions: [
        effectIsLive('effectId', 'Le membre est toujours infecté'),
        effectAttributeAtLeast(
          'level',
          UNIQUE_ABILITY_LEVEL,
          `Le membre a atteint le niveau ${UNIQUE_ABILITY_LEVEL}`,
        ),
      ],
      effects: [abilityGrant({ ownerId: (ctx) => param(ctx, 'memberId') ?? ctx.targets[0] })],
      hint: `Requiert le niveau ${UNIQUE_ABILITY_LEVEL}`,
    },

    'end-game': {
      label: 'Clore le jeu',
      conditions: [effectIsLive('effectId', 'Le réseau est ouvert')],
      effects: [setEffectState({ state: 'ENDED', attributes: { reason: 'game-completed' } })],
    },
  },

  ui: { componentKey: 'ContagionDashboard' },

  interactionManifest: buildManifest('contagion', {
    // Infection is a sequence, not a click: game, kiss, witnessed murder.
    inputMode: 'SEQUENCE',
    allowedTargets: ['CHARACTER'],
    overlays: ['CONTROL_LINK', 'RANGE'],
    entryActions: ['open-network', 'infect'],
    requiredState: ['isConscious', 'canUseNen'],
    perspectiveTransition: {
      canChangeBody: false,
      canChangeConsciousness: false,
      canFollowAura: true,
    },
    customComponent: 'ContagionDashboard',
  }),
})

export const CONTAGION_LIMITS = {
  cohortId: COHORT_ID,
  capacity: NETWORK_CAPACITY,
  uniqueAbilityLevel: UNIQUE_ABILITY_LEVEL,
  memberZeroLevel: MEMBER_ZERO_LEVEL,
  infectionSteps: INFECTION_STEPS,
  killValues: KILL_VALUES,
}
