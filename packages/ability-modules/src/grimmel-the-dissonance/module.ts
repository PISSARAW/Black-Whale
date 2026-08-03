import {
  attributeCounter,
  auraModifier,
  buildManifest,
  canUseNen,
  defineAbility,
  effect,
  effectId,
  effectIsLive,
  isConscious,
  listParam,
  param,
  person,
  requiresParameter,
  requiresTarget,
  soulSwap,
  spawnNenEntity,
  unrevealed,
} from '@black-whale/ability-sdk'

const COHORT_ID = 'halkenburg-fin-bearers'

/**
 * Grimmel the Dissonance — Halkenburg
 *
 * The reason the identity engine exists. The arrow does not wound: it swaps the
 * target's soul with that of a randomly chosen fin bearer, and the allied
 * consciousness takes priority in the body it lands in. Everything the status
 * header shows — followed consciousness, occupied body, perceived as — was
 * designed for the state this ability produces.
 *
 * Canonical rules encoded here:
 *   - the cohort is the set of bearers who share Halkenburg's will;
 *   - the swap is atomic (two CONSCIOUSNESS_TRANSFERRED in one activation);
 *   - the displaced consciousness sleeps until its body sleeps or dies;
 *   - Halkenburg risks his own life at every shot.
 */
export const grimmelTheDissonance = defineAbility({
  id: 'grimmel-the-dissonance',
  name: 'The Boy Who Shoots the Arrow: Grimmel the Dissonance',
  owner: 'prince-halkenburg',
  category: 'specialist',

  site: {
    kind: 'arrow',
    instruction:
      'Materialize the bow, then strike a character; a marked bearer is chosen and the two visible bodies exchange positions and perspective.',
    rule: 'Collective aura forms invincible armour and an arrow that pierces every defence before swapping two souls.',
    cost: 'United supporters · one bearer risks their soul',
    color: '#f7e27d',
    action: 'Gather collective will',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  cost: { label: 'Risque vital pour Halkenburg à chaque tir', unit: 'vie' },

  actions: {
    'raise-cohort': {
      label: 'Rassembler les porteurs d’ailerons',
      effects: [
        spawnNenEntity({
          id: COHORT_ID,
          kind: 'COHORT',
          label: 'Porteurs d’ailerons de Halkenburg',
        }),
        effect({
          kind: 'CUSTOM',
          discriminator: 'cohort',
          targets: () => [{ id: COHORT_ID, kind: 'COHORT' }],
          attributes: (ctx) => ({
            cohortId: COHORT_ID,
            memberIds: listParam(ctx, 'memberIds'),
            requiresSharedWill: true,
          }),
        }),
        // The armour is a group aura, not a per-target buff: it only holds while
        // the bearers share his will.
        auraModifier({ cohortId: COHORT_ID, defense: 'invincible-while-shared-will' }),
      ],
    },

    'mark-bearer': {
      label: 'Marquer un porteur',
      conditions: [
        requiresTarget('Un porteur est marqué'),
        effectIsLive('effectId', 'La cohorte existe'),
      ],
      effects: [
        attributeCounter({
          append: (ctx) => ({ memberIds: ctx.targets }),
        }),
      ],
    },

    shoot: {
      label: 'Tirer la flèche',
      conditions: [
        requiresTarget('Une cible est visée'),
        requiresParameter('consciousnessId', 'La conscience de la cible est identifiée'),
        requiresParameter(
          'otherConsciousnessId',
          'La conscience du porteur échangé est identifiée',
        ),
      ],
      notes: [
        // Canon leaves the draw to chance; the module says so instead of
        // pretending Halkenburg chooses, and does not block the shot for it.
        unrevealed(
          'grimmel-selection',
          'Le porteur échangé est tiré au hasard parmi les marqués (Halkenburg inclus)',
        ),
      ],
      effects: [
        // Atomic: emitting the two transfers separately would leave a frame in
        // which one of the two bodies holds nobody.
        soulSwap(),
        // The displaced consciousness sleeps in its new body until that body
        // sleeps or dies — this is what makes the allied will take priority.
        effect({
          kind: 'CONSTRAINT',
          discriminator: 'suppressed',
          targets: (ctx) => [
            { id: param(ctx, 'consciousnessId') ?? ctx.actorId, kind: 'CONSCIOUSNESS' },
          ],
          attributes: {
            mentalState: 'SUPPRESSED',
            rules: [
              'La conscience alliée prime dans le corps adverse.',
              'La conscience déplacée dort jusqu’au sommeil ou à la mort du corps.',
              'Si le corps du porteur meurt d’abord, l’âme de la cible y retourne en priorité.',
            ],
          },
        }),
      ],
      cost: { label: 'Espérance de vie de Halkenburg', unit: 'vie' },
    },
  },

  perspective: (ctx) => [
    {
      type: 'replace',
      targetField: 'occupiedBodyId',
      value: param(ctx, 'toBodyId') ?? ctx.targets[0],
    },
  ],

  ui: { componentKey: 'GrimmelArrowView' },

  interactionManifest: buildManifest('grimmel-the-dissonance', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['CHARACTER', 'BODY', 'LOCATION'],
    // The arrow goes through walls: the trajectory ignores the location graph.
    overlays: ['TRAJECTORY', 'AURA'],
    entryActions: ['raise-cohort', 'shoot'],
    requiredState: ['isConscious', 'canUseNen'],
    perspectiveTransition: {
      canChangeBody: true,
      canChangeConsciousness: true,
      canFollowAura: false,
    },
    customComponent: 'GrimmelArrowView',
  }),
})

/** The cohort effect id, so the UI can read the bearer list back. */
export const grimmelCohortEffectId = (actorId: string, eventId: string): string =>
  effectId({ abilityId: 'grimmel-the-dissonance', actorId, eventId, targets: [] }, 'cohort')
