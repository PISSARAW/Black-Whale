import {
  attributeCounter,
  auraModifier,
  buildManifest,
  canUseNen,
  constraint,
  controlLink,
  curse,
  declaredFlag,
  defineAbility,
  effect,
  effectIsLive,
  listParam,
  masked,
  param,
  person,
  requiresParameter,
  requiresTarget,
  setEffectState,
  spawnNenEntity,
  unrevealed,
  zone,
} from '@black-whale/ability-sdk'

/**
 * The guardian spirit beasts the earlier waves left aside. Three of them are
 * documented in canon; Camilla's is not, and the module refuses to invent it.
 */

/**
 * Camilla's guardian — coercion
 *
 * Canon states the outcome (total control) and hides the conditions. The module
 * therefore ships a dormant effect and an unmet-until-revealed condition, so the
 * "Why?" panel says "condition non révélée" instead of guessing at a trigger.
 */
export const camillaGuardianCoercion = defineAbility({
  id: 'camilla-guardian-coercion',
  name: 'Camilla — coercition du gardien',
  owner: 'prince-camilla',
  category: 'manipulator',

  conditions: [
    canUseNen(),
    // Deliberately blocking: nobody can run this until the manga says how.
    unrevealed('camilla-coercion', 'Les conditions d’activation ne sont pas révélées'),
  ],

  targets: [person()],

  cost: { label: 'Conditions d’activation inconnues du canon', unit: 'inconnu' },

  actions: {
    arm: {
      label: 'Préparer la coercition',
      effects: [
        masked(
          effect({
            kind: 'CUSTOM',
            discriminator: 'coercion',
            state: 'DORMANT',
            attributes: {
              rules: ['Contrôle total de la cible une fois des conditions inconnues remplies.'],
              canonStatus: 'unknown-conditions',
            },
          }),
        ),
      ],
    },
  },

  ui: { componentKey: 'GuardianBeastView' },

  interactionManifest: buildManifest('camilla-guardian-coercion', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['CHARACTER'],
    overlays: ['CONTROL_LINK'],
    entryActions: ['arm'],
    requiredState: ['canUseNen'],
    customComponent: 'GuardianBeastView',
  }),
})

/**
 * Tubeppa's guardian — synthesis
 *
 * Needs a willing partner, which is the one condition worth encoding: without a
 * collaborator there is no chemistry at all.
 */
export const tubeppaGuardianSynthesis = defineAbility({
  id: 'tubeppa-guardian-synthesis',
  name: 'Tubeppa — synthèse du gardien',
  owner: 'prince-tubeppa',
  category: 'transmuter',

  conditions: [canUseNen()],

  targets: [person()],

  cost: {
    label: 'Deux composants coopérants et une alliance active',
    amount: 2,
    unit: 'composants',
  },

  actions: {
    synthesise: {
      label: 'Synthétiser',
      conditions: [
        requiresParameter('compound', 'Un composé est demandé'),
        declaredFlag('partnerConsented', true, 'Un partenaire collabore volontairement'),
      ],
      effects: [
        spawnNenEntity({
          id: (ctx) => `tubeppa-compound-${param(ctx, 'compound') ?? 'sample'}`,
          kind: 'OBJECT',
          label: 'Composé synthétisé',
          metadata: (ctx) => ({ compound: param(ctx, 'compound') }),
        }),
        effect({
          kind: 'CUSTOM',
          discriminator: 'synthesis',
          attributes: (ctx) => ({
            compound: param(ctx, 'compound'),
            rules: ['La synthèse exige un partenaire collaboratif.'],
          }),
        }),
      ],
    },
  },

  ui: { componentKey: 'SynthesisBench' },

  interactionManifest: buildManifest('tubeppa-guardian-synthesis', {
    inputMode: 'SEQUENCE',
    allowedTargets: ['CHARACTER', 'OBJECT'],
    overlays: ['AURA'],
    entryActions: ['synthesise'],
    requiredState: ['canUseNen'],
    customComponent: 'SynthesisBench',
  }),
})

/**
 * Tyson's guardian — Eye-wogs
 *
 * A levy on the reader's aura, returned as happiness proportional to how deeply
 * they believe. Belief is a number here because that is what the canon says
 * drives it, and breaking the taboo fires the effect.
 */
export const tysonGuardianEyeWogs = defineAbility({
  id: 'tyson-guardian-eye-wogs',
  name: 'Tyson — Eye-wogs',
  owner: 'prince-tyson',
  category: 'emitter',

  conditions: [canUseNen()],

  targets: [person(), zone()],

  actions: {
    'gather-readers': {
      label: 'Rassembler les lecteurs',
      effects: [
        spawnNenEntity({ id: 'tyson-readers', kind: 'COHORT', label: 'Lecteurs du Livre' }),
        effect({
          kind: 'CUSTOM',
          discriminator: 'congregation',
          targets: () => [{ id: 'tyson-readers', kind: 'COHORT' }],
          attributes: (ctx) => ({
            cohortId: 'tyson-readers',
            memberIds: listParam(ctx, 'memberIds'),
            rules: [
              'Les Eye-wogs se fixent aux lecteurs du Livre.',
              'Ils prélèvent l’aura et rendent du bonheur proportionnel à l’adhésion.',
              'La violation du tabou entraîne une punition.',
            ],
          }),
        }),
      ],
    },

    attach: {
      label: 'Fixer un Eye-wog',
      conditions: [requiresTarget('Un lecteur est visé')],
      effects: [auraModifier({ levy: true, returns: 'happiness', proportionalTo: 'adherence' })],
      cost: { label: 'Aura prélevée sur le lecteur', unit: 'aura' },
    },

    'punish-taboo': {
      label: 'Punir la violation du tabou',
      conditions: [effectIsLive('effectId', 'Un Eye-wog est fixé')],
      effects: [setEffectState({ state: 'TRIGGERED', attributes: { taboo: 'violated' } })],
    },
  },

  ui: { componentKey: 'CongregationLedger' },

  interactionManifest: buildManifest('tyson-guardian-eye-wogs', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['CHARACTER', 'LOCATION'],
    overlays: ['AURA', 'CONTROL_LINK'],
    entryActions: ['gather-readers'],
    requiredState: ['canUseNen'],
    customComponent: 'CongregationLedger',
  }),
})

/**
 * Luzurus's guardian — desire trap
 *
 * The bait is whatever the target wants, so the module stores the desire rather
 * than a fixed lure: the trap is personal by construction.
 */
export const luzurusGuardianDesireTrap = defineAbility({
  id: 'luzurus-guardian-desire-trap',
  name: 'Luzurus — piège du désir',
  owner: 'prince-luzurus',
  category: 'conjurer',

  conditions: [canUseNen()],

  targets: [person()],

  cost: { label: 'Un désir connu et un appât accepté volontairement', unit: 'appât' },

  actions: {
    bait: {
      label: 'Matérialiser le désir',
      conditions: [
        requiresTarget('Une cible est appâtée'),
        requiresParameter('desire', 'Le désir de la cible est connu'),
      ],
      effects: [
        curse({
          trigger: 'desire-satisfied',
          rules: [
            'L’appât prend la forme du désir de la cible.',
            'Sa satisfaction déclenche le piège.',
          ],
          attributes: (ctx) => ({ desire: param(ctx, 'desire') }),
        }),
      ],
    },

    spring: {
      label: 'Refermer le piège',
      conditions: [
        effectIsLive('effectId', 'Un appât est en place'),
        declaredFlag('desireSatisfied', true, 'La cible a satisfait son désir'),
      ],
      effects: [
        setEffectState({ state: 'TRIGGERED' }),
        controlLink({ vector: 'desire', mode: 'control', attributes: { coercionLike: true } }),
        constraint({ rules: ['La cible est piégée et partiellement contrainte.'] }),
      ],
    },

    'count-temptation': {
      label: 'Compter une tentation',
      conditions: [effectIsLive('effectId', 'Un appât est en place')],
      effects: [attributeCounter({ increments: { temptations: 1 } })],
    },
  },

  ui: { componentKey: 'DesireTrapView' },

  interactionManifest: buildManifest('luzurus-guardian-desire-trap', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['CHARACTER', 'OBJECT'],
    overlays: ['AURA', 'RANGE'],
    entryActions: ['bait'],
    requiredState: ['canUseNen'],
    customComponent: 'DesireTrapView',
  }),
})
