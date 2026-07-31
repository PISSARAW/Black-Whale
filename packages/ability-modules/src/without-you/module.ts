import {
  beliefBroadcast,
  buildManifest,
  canUseNen,
  defineAbility,
  listParam,
  moveEntity,
  param,
  perceptionMask,
  person,
  postMortem,
  requiresParameter,
  spawnNenEntity,
  effect,
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

  conditions: [canUseNen(), requiresParameter('deceasedTwinId', 'La première jumelle est morte')],

  targets: [person()],

  cost: { label: 'La mort d’une jumelle, puis une aura post-mortem entretenue', unit: 'vie' },

  actions: {
    manifest: {
      label: 'Faire apparaître la jumelle',
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
      effects: [
        effect({
          kind: 'CUSTOM',
          discriminator: 'behavior-follow',
          attributes: { command: 'follow', description: 'La jumelle vous suit de près.' },
        }),
      ],
    },
    wander: {
      label: 'Laisser la jumelle se balader',
      effects: [
        effect({
          kind: 'CUSTOM',
          discriminator: 'behavior-wander',
          attributes: { command: 'wander', description: 'La jumelle se balade de son côté.' },
        }),
      ],
    },
    scout: {
      label: 'Envoyer la jumelle en éclaireur',
      effects: [
        effect({
          kind: 'CUSTOM',
          discriminator: 'behavior-scout',
          attributes: { command: 'scout', description: 'La jumelle part en reconnaissance.' },
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
