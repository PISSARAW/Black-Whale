import {
  buildManifest,
  canUseNen,
  defineAbility,
  effect,
  isConscious,
  param,
  requiresParameter,
  self,
  setEffectState,
  spawnNenEntity,
  transferConsciousness,
} from '@black-whale/ability-sdk'

const doubleId = (actorId: string): string => `${actorId}-astral-double`

/**
 * Hanzo — Skill 4 (astral double)
 *
 * The simple case of a consciousness outside its body, and the tutorial the
 * identity engine needs before Grimmel: one mind, two vessels, and a body left
 * asleep that anybody can wake by speaking to it or touching it.
 */
export const hanzoSkill4 = defineAbility({
  id: 'hanzo-skill-4',
  name: 'Hanzo Skill 4',
  owner: 'hanzo',
  category: 'specialist',

  site: {
    kind: 'projection',
    instruction:
      'Send the double out of a section and it passes through anything; touching the sleeping body it left behind pulls it straight back.',
    rule: 'Hanzo’s consciousness leaves his sleeping body as an invisible double but must return if the body is disturbed.',
    cost: 'Motionless unconscious body',
    color: '#8bd1cf',
    action: 'Project the double',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [self()],

  actions: {
    project: {
      label: 'Projeter le double',
      conditions: [
        requiresParameter('consciousnessId', 'La conscience projetée est identifiée'),
        requiresParameter('fromBodyId', 'Le corps laissé derrière est identifié'),
      ],
      effects: [
        spawnNenEntity({
          id: (ctx) => doubleId(ctx.actorId),
          kind: 'AURA_ENTITY',
          label: 'Double astral',
          metadata: (ctx) => ({ ownerId: ctx.actorId, passesThroughMatter: true }),
        }),
        // The double is the vessel; the body stays behind, asleep.
        (ctx) =>
          transferConsciousness()({
            ...ctx,
            targets: [doubleId(ctx.actorId)],
            targetRefs: [{ id: doubleId(ctx.actorId), kind: 'AURA_ENTITY' }],
          }),
        effect({
          kind: 'CONSTRAINT',
          discriminator: 'sleeping-body',
          targets: (ctx) => [{ id: param(ctx, 'fromBodyId') ?? ctx.actorId, kind: 'BODY' }],
          attributes: {
            mentalState: 'SLEEPING',
            rules: [
              'Parler au corps ou le toucher interrompt la projection.',
              'Le double traverse la matière mais ne peut pas agir physiquement.',
            ],
          },
        }),
      ],
      cost: { label: 'Le corps reste sans défense pendant la projection', unit: 'vulnérabilité' },
    },

    recall: {
      label: 'Rappeler le double',
      conditions: [requiresParameter('consciousnessId', 'La conscience projetée est identifiée')],
      effects: [
        (ctx) =>
          transferConsciousness()({
            ...ctx,
            parameters: { ...ctx.parameters, fromBodyId: doubleId(ctx.actorId) },
            targets: [param(ctx, 'toBodyId') ?? ctx.actorId],
            targetRefs: [{ id: param(ctx, 'toBodyId') ?? ctx.actorId, kind: 'BODY' }],
          }),
        setEffectState({ state: 'ENDED' }),
      ],
    },
  },

  ui: { componentKey: 'AstralDoubleView' },

  interactionManifest: buildManifest('hanzo-skill-4', {
    inputMode: 'CLICK',
    allowedTargets: ['CHARACTER', 'BODY', 'AURA'],
    overlays: ['AURA'],
    entryActions: ['project'],
    requiredState: ['isConscious', 'canUseNen'],
    perspectiveTransition: {
      canChangeBody: true,
      canChangeConsciousness: false,
      canFollowAura: true,
    },
    customComponent: 'AstralDoubleView',
  }),
})
