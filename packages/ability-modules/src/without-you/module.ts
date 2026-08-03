import {
  asserted,
  beliefBroadcast,
  buildManifest,
  canUseNen,
  defineAbility,
  effect,
  listParam,
  moveEntity,
  param,
  perceptionMask,
  person,
  postMortem,
  requiresParameter,
  shown,
  spawnNenEntity,
} from '@black-whale/ability-sdk'

const nenTwinId = (twinId: string): string => `${twinId}-without-you`

/**
 * Without You — Kacho / Fugetsu
 *
 * Three truths at once, one per engine: the twin is dead in the identity engine,
 * present on the map as a Nen entity, and alive in the perspective of everyone
 * who sees her. The ability only exists after its owner's death, so every effect
 * it creates is post-mortem by construction.
 */
export const withoutYou = defineAbility({
  id: 'without-you',
  name: 'Without You',
  owner: 'prince-kacho',
  category: 'specialist',

  site: {
    kind: 'guardian',
    instruction:
      'The guardian memorizes five interactions, intercepts one detected lethal event and can replay its protected memory trail. Press R to switch between Follow, Wander, and Scout modes.',
    rule: 'Kacho’s post-mortem double remains beside the surviving twin, indistinguishable from her and dedicated to protection.',
    cost: 'Death of one twin · post-mortem persistence',
    color: '#f6b8d1',
    action: 'Command the guardian',
  },

  conditions: [canUseNen(), requiresParameter('deceasedTwinId', 'La première jumelle est morte')],

  targets: [person()],

  cost: { label: 'La mort d’une jumelle, puis une aura post-mortem entretenue', unit: 'vie' },

  actions: {
    manifest: {
      label: 'Faire apparaître la jumelle',
      evidence: shown('ch. 398 — à la mort de Kacho, la jumelle apparaît'),
      effects: [
        spawnNenEntity({
          id: (ctx) => nenTwinId(param(ctx, 'deceasedTwinId') ?? 'twin'),
          kind: 'NEN_ENTITY',
          label: 'Jumelle disparue',
          metadata: (ctx) => ({
            postMortem: true,
            originTwinId: param(ctx, 'deceasedTwinId'),
            passesThroughMatter: true,
          }),
        }),
        // Visible to everybody, with the personality and memories of the dead
        // twin: a perception mask that nobody, not even Gyo, sees through.
        postMortem(
          perceptionMask({
            appearsAs: (ctx) => param(ctx, 'deceasedTwinId'),
            auraDetectable: true,
            attributes: {
              inheritsMemories: true,
              inheritsPersonality: true,
              rules: [
                'Apparaît à la mort de la première jumelle.',
                'Visible de tous, traverse la matière.',
                'Interagit avec Magical Worm.',
              ],
            },
          }),
        ),
        moveEntity({
          entity: (ctx) => ({
            id: nenTwinId(param(ctx, 'deceasedTwinId') ?? 'twin'),
            kind: 'NEN_ENTITY',
          }),
        }),
        // The false belief is general and orchestrated by the world, not by a
        // narrator: every witness believes the dead twin is alive.
        beliefBroadcast({
          factId: (ctx) => `alive:${param(ctx, 'deceasedTwinId') ?? 'twin'}`,
          observerIds: (ctx) => listParam(ctx, 'witnessIds'),
        }),
      ],
    },
    follow: {
      label: 'Demander à la jumelle de nous suivre',
      evidence: shown('ch. 398 — la jumelle reste auprès de Fugetsu'),
      effects: [
        effect({
          kind: 'CUSTOM',
          discriminator: 'behavior-follow',
          attributes: { command: 'follow', description: 'La jumelle vous suit de près.' },
        }),
        moveEntity({
          entity: (ctx) => ({
            id: nenTwinId(param(ctx, 'deceasedTwinId') ?? 'twin'),
            kind: 'NEN_ENTITY',
          }),
          locationId: (ctx) => ctx.worldState?.presences[ctx.actorId]?.locationId,
        }),
      ],
    },
    wander: {
      label: 'Laisser la jumelle se balader',
      evidence: asserted('la jumelle agit d’elle-même, avec la personnalité de la disparue'),
      conditions: [requiresParameter('locationId', 'Une destination est choisie')],
      effects: [
        effect({
          kind: 'CUSTOM',
          discriminator: 'behavior-wander',
          attributes: { command: 'wander', description: 'La jumelle se balade de son côté.' },
        }),
        moveEntity({
          entity: (ctx) => ({
            id: nenTwinId(param(ctx, 'deceasedTwinId') ?? 'twin'),
            kind: 'NEN_ENTITY',
          }),
          locationId: (ctx) => param(ctx, 'locationId'),
        }),
      ],
    },
    'pass-through-matter': {
      label: 'Traverser une cloison',
      evidence: shown('ch. 398 — la jumelle passe où les vivants ne passent pas'),
      conditions: [requiresParameter('locationId', 'Une pièce est traversée')],
      effects: [
        moveEntity({
          entity: (ctx) => ({
            id: nenTwinId(param(ctx, 'deceasedTwinId') ?? 'twin'),
            kind: 'NEN_ENTITY',
          }),
          locationId: (ctx) => param(ctx, 'locationId'),
        }),
      ],
    },

    'be-seen-as-dead': {
      label: 'Être perçue comme morte',
      // Three truths at once: DEAD in the identity engine, present on the map,
      // alive in every witness's perspective. The refusal is what holds them
      // apart — nobody sees through this mask, Gyo included.
      refusal: 'La jumelle est visible de tous comme vivante : aucun regard ne la démasque',
      evidence: shown('ch. 398 — l’équipage continue de la croire vivante'),
    },

    'manifest-while-both-alive': {
      label: 'Faire apparaître la jumelle vivante',
      refusal: 'La capacité n’existe qu’à la mort de la première jumelle',
      evidence: shown('ch. 398 — c’est la mort qui la déclenche'),
    },

    scout: {
      label: 'Envoyer la jumelle en éclaireur',
      evidence: asserted('la jumelle va voir ce que Fugetsu ne peut pas atteindre'),
      conditions: [requiresParameter('locationId', 'Une destination est choisie')],
      effects: [
        effect({
          kind: 'CUSTOM',
          discriminator: 'behavior-scout',
          attributes: { command: 'scout', description: 'La jumelle part en reconnaissance.' },
        }),
        moveEntity({
          entity: (ctx) => ({
            id: nenTwinId(param(ctx, 'deceasedTwinId') ?? 'twin'),
            kind: 'NEN_ENTITY',
          }),
          locationId: (ctx) => param(ctx, 'locationId'),
        }),
      ],
    },
  },

  ui: { componentKey: 'WithoutYouView' },

  interactionManifest: buildManifest('without-you', {
    inputMode: 'CUSTOM',
    allowedTargets: ['CHARACTER', 'LOCATION'],
    overlays: ['AURA'],
    entryActions: ['manifest', 'follow', 'wander', 'scout'],
    requiredState: ['canUseNen'],
    perspectiveTransition: {
      canChangeBody: false,
      canChangeConsciousness: false,
      canFollowAura: true,
    },
    customComponent: 'WithoutYouView',
  }),
})
