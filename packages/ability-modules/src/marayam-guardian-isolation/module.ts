import {
  buildManifest,
  canUseNen,
  defineAbility,
  effect,
  effectIsLive,
  knowledgeGrant,
  listParam,
  param,
  requiresParameter,
  setEffectState,
  spawnNenEntity,
  zone,
} from '@black-whale/ability-sdk'

const duplicateOf = (locationId: string): string => `${locationId}-duplicate`

/**
 * Marayam's guardian — isolation of room 1013
 *
 * The site's first space fork. The room exists twice: the real one, holding
 * Biscuit, Hanzo and the prince, and an empty duplicate that everyone outside
 * reaches instead. The outsiders are not uncertain — they are confidently wrong,
 * which is exactly what a CONFIRMED estimate pointing at the wrong room encodes.
 */
export const marayamGuardianIsolation = defineAbility({
  id: 'marayam-guardian-isolation',
  name: 'Marayam — isolement de la chambre',
  owner: 'prince-marayam',
  category: 'unknown',

  conditions: [canUseNen()],

  targets: [zone()],

  cost: { label: 'Une seule pièce protégée à la fois', amount: 1, unit: 'pièce' },

  actions: {
    isolate: {
      label: 'Isoler la pièce',
      conditions: [requiresParameter('locationId', 'La pièce isolée est identifiée')],
      effects: [
        spawnNenEntity({
          id: (ctx) => duplicateOf(param(ctx, 'locationId') ?? 'room'),
          kind: 'LOCATION',
          label: 'Duplicata vide',
          metadata: (ctx) => ({
            duplicateOf: param(ctx, 'locationId'),
            empty: true,
          }),
        }),
        effect({
          kind: 'PORTAL',
          discriminator: 'isolation',
          targets: (ctx) => [{ id: param(ctx, 'locationId') ?? 'room', kind: 'LOCATION' }],
          anchors: (ctx) => [
            { locationId: param(ctx, 'locationId') },
            { locationId: duplicateOf(param(ctx, 'locationId') ?? 'room') },
          ],
          attributes: (ctx) => ({
            realLocationId: param(ctx, 'locationId'),
            duplicateLocationId: duplicateOf(param(ctx, 'locationId') ?? 'room'),
            rules: [
              'Ceux qui sortent et ceux qui entrent atteignent un duplicata vide.',
              'Les occupants réels ne sont plus perceptibles de l’extérieur.',
            ],
          }),
        }),
        // Everybody outside is certain of something false: the estimate is
        // CONFIRMED, it just points at the duplicate.
        (ctx) =>
          listParam(ctx, 'outsiderIds').flatMap((observerId) => [
            ...knowledgeGrant({
              factId: `location:${param(ctx, 'locationId') ?? 'room'}:empty`,
              observerId,
              state: 'BELIEVED',
              confidence: 1,
            })(ctx),
          ]),
      ],
    },

    lift: {
      label: 'Lever l’isolement',
      conditions: [effectIsLive('effectId', 'L’isolement est actif')],
      effects: [setEffectState({ state: 'ENDED' })],
    },
  },

  ui: { componentKey: 'DuplicatedRoomView' },

  interactionManifest: buildManifest('marayam-guardian-isolation', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['LOCATION'],
    overlays: ['RANGE'],
    entryActions: ['isolate'],
    requiredState: ['canUseNen'],
    customComponent: 'DuplicatedRoomView',
  }),
})
