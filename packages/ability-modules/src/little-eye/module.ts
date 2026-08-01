import {
  buildManifest,
  canUseNen,
  controlLink,
  defineAbility,
  effectIsLive,
  isConscious,
  knowledgeGrant,
  listParam,
  moveEntity,
  param,
  person,
  requiresParameter,
  setEffectState,
  spawnNenEntity,
} from '@black-whale/ability-sdk'

const scoutId = (animalId: string): string => `little-eye-${animalId}`

/**
 * Little Eye — Sayird → Kurapika → Oito
 *
 * An aura sphere on a small animal, and everything it sees and hears reaches its
 * holder. Replaying Oito's cockroach round (ch. 390) room by room fills
 * Kurapika's knowledge matrix live, and following the roach is the first real
 * use of `canFollowAura`.
 *
 * Canon detail the module keeps: the link survives the user losing consciousness,
 * so only the initial attachment requires them to be conscious.
 */
export const littleEye = defineAbility({
  id: 'little-eye',
  name: 'Little Eye',
  owner: 'sayird',
  category: 'manipulator',

  conditions: [canUseNen()],

  targets: [person()],

  cost: { label: 'Très peu d’aura, mais un hôte animal vulnérable', amount: 1, unit: 'hôte' },

  actions: {
    attach: {
      label: 'Poser la sphère sur un insecte volant (ou petit animal)',
      conditions: [
        isConscious(),
        requiresParameter('animalId', 'Un petit animal est choisi (hamster au maximum)'),
      ],
      effects: [
        spawnNenEntity({
          id: (ctx) => scoutId(param(ctx, 'animalId') ?? 'animal'),
          kind: 'NEN_ENTITY',
          label: 'Éclaireur Little Eye (Insecte volant)',
          metadata: (ctx) => ({
            animalId: param(ctx, 'animalId'),
            maxSize: 'hamster',
            survivesUserUnconsciousness: true,
            auraColor: 'blue',
            capabilities: ['film', 'fly', 'remote-control'],
          }),
        }),
        controlLink({
          vector: 'aura-sphere',
          mode: 'control',
          targets: (ctx) => [
            { id: scoutId(param(ctx, 'animalId') ?? 'animal'), kind: 'NEN_ENTITY' },
          ],
          attributes: { senses: ['sight', 'hearing'] },
        }),
      ],
    },

    scout: {
      label: 'Faire avancer l’éclaireur (Vol)',
      // Deliberately no isConscious: the sphere keeps reporting even if its
      // holder passes out.
      conditions: [
        effectIsLive('effectId', 'La sphère est encore posée'),
        requiresParameter('locationId', 'Une pièce est choisie'),
      ],
      effects: [
        moveEntity({
          entity: (ctx) => ({
            id: scoutId(param(ctx, 'animalId') ?? 'animal'),
            kind: 'NEN_ENTITY',
          }),
        }),
        // Each room crossed is a batch of facts, each carrying the roach it came
        // from — this is what lets the UI answer "how does Kurapika know that?".
        (ctx) =>
          listParam(ctx, 'observedEntityIds').flatMap((observedId) =>
            knowledgeGrant({
              factId: `present:${observedId}:${param(ctx, 'locationId') ?? 'room'}`,
              state: 'KNOWN',
            })(ctx).map((event) => ({
              ...event,
              sourceIds: [scoutId(param(ctx, 'animalId') ?? 'animal')],
            })),
          ),
      ],
    },

    film: {
      label: 'Filmer les environs',
      conditions: [
        effectIsLive('effectId', 'La sphère est encore posée'),
        requiresParameter('locationId', 'Une pièce est choisie'),
      ],
      effects: [
        (ctx) =>
          listParam(ctx, 'observedEntityIds').flatMap((observedId) =>
            knowledgeGrant({
              factId: `recorded:${observedId}:${param(ctx, 'locationId') ?? 'room'}`,
              state: 'KNOWN',
            })(ctx).map((event) => ({
              ...event,
              sourceIds: [scoutId(param(ctx, 'animalId') ?? 'animal')],
            })),
          ),
      ],
    },

    pilot: {
      label: 'Contrôler à distance',
      conditions: [
        effectIsLive('effectId', 'La sphère est encore posée'),
        requiresParameter('locationId', 'Une direction ou pièce cible'),
        isConscious(),
      ],
      effects: [
        moveEntity({
          entity: (ctx) => ({
            id: scoutId(param(ctx, 'animalId') ?? 'animal'),
            kind: 'NEN_ENTITY',
          }),
        }),
      ],
    },

    dismiss: {
      label: 'Rappeler la sphère',
      conditions: [effectIsLive('effectId', 'La sphère est encore posée')],
      effects: [setEffectState({ state: 'ENDED' })],
    },
  },

  ui: { componentKey: 'LittleEyeScout' },

  interactionManifest: buildManifest('little-eye', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['CHARACTER', 'OBJECT', 'LOCATION'],
    overlays: ['CONTROL_LINK', 'RANGE'],
    entryActions: ['attach', 'pilot', 'film', 'scout', 'dismiss'],
    requiredState: ['canUseNen'],
    perspectiveTransition: {
      canChangeBody: false,
      canChangeConsciousness: false,
      // We literally follow the cockroach.
      canFollowAura: true,
    },
    customComponent: 'LittleEyeScout',
  }),
})
