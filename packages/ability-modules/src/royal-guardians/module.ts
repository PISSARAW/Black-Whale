import {
  asserted,
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
  hypothesis,
  listParam,
  masked,
  moveEntity,
  param,
  person,
  requiresParameter,
  requiresTarget,
  setEffectState,
  shown,
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
  name: "Camilla's Guardian Coercion",
  owner: 'prince-camilla',
  category: 'manipulator',

  site: {
    kind: 'coercive-beast',
    instruction:
      'Fulfil three unknown-condition contacts on one target; the third contact captures its control for remote command.',
    rule: 'The Beast’s total Manipulation is confirmed, but its actual activation conditions remain deliberately unknown.',
    cost: 'Unknown conditions · represented as three unresolved contacts',
    color: '#d98cae',
    action: 'Probe the first unknown condition',
  },

  conditions: [
    canUseNen(),
    // Deliberately blocking: nobody can run this until the manga says how.
    unrevealed('camilla-coercion', 'Les conditions d’activation ne sont pas révélées'),
  ],

  targets: [person()],

  cost: { label: 'Conditions d’activation inconnues du canon', unit: 'inconnu' },

  actions: {
    'trigger-the-coercion': {
      label: 'Déclencher la coercition',
      refusal: 'Condition non révélée : le manga n’a pas dit ce qui déclenche le gardien',
    },

    'guess-the-conditions': {
      label: 'Supposer les conditions',
      evidence: hypothesis('toute règle d’activation que le canon n’a pas donnée'),
      effects: [
        effect({
          kind: 'CUSTOM',
          discriminator: 'coercion-hypothesis',
          attributes: { canonStatus: 'speculative' },
        }),
      ],
    },

    'stay-dormant': {
      label: 'Rester dormant',
      // The state the guardian is actually in, at every cursor the manga has
      // shown so far: armed, masked, and waiting for a rule nobody has read.
      evidence: shown('ch. 386 — le gardien attend, sans qu’on sache quoi'),
      effects: [setEffectState({ state: 'DORMANT' })],
    },

    arm: {
      label: 'Préparer la coercition',
      evidence: shown('ch. 386 — le gardien est là, ses conditions ne le sont pas'),
      gyo: 'le gardien lui-même ; ce qui le déclenche reste inconnu',
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
    allowedTargets: ['CHARACTER', 'LOCATION'],
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
  name: 'Collaborative Drug Synthesis',
  owner: 'prince-tubeppa',
  category: 'transmuter',

  site: {
    kind: 'drug-synthesis',
    instruction:
      'Choose two collaborating components; two carrying routes give a shortcut, two carrying material give a revelation, and a mismatched pair gives an inert batch.',
    rule: 'The chemical-producing Beast requires a collaborative partner and can create many effects whose limits remain unknown.',
    cost: 'Active alliance · two cooperating components',
    color: '#91bd72',
    action: 'Choose the research partner',
  },

  conditions: [canUseNen()],

  targets: [person()],

  cost: {
    label: 'Deux composants coopérants et une alliance active',
    amount: 2,
    unit: 'composants',
  },

  actions: {
    'hand-over-a-compound': {
      label: 'Remettre un composé',
      evidence: asserted('ce qui est synthétisé passe ensuite de main en main'),
      conditions: [requiresParameter('compound', 'Un composé est demandé')],
      effects: [
        moveEntity({
          entity: (ctx) => ({
            id: `tubeppa-compound-${param(ctx, 'compound') ?? 'sample'}`,
            kind: 'OBJECT',
          }),
        }),
      ],
    },

    'synthesise-alone': {
      label: 'Synthétiser sans partenaire',
      refusal: 'La capacité demande deux composants coopérants : seule, elle ne produit rien',
      evidence: shown('ch. 386 — la coopération est la condition'),
    },

    'synthesise-an-unknown-compound': {
      label: 'Synthétiser un composé inconnu',
      evidence: asserted('la limite exacte des composés possibles n’est pas donnée'),
      conditions: [requiresParameter('compound', 'Un composé est demandé')],
      effects: [
        effect({
          kind: 'CUSTOM',
          discriminator: 'synthesis-attempt',
          attributes: (ctx) => ({ compound: param(ctx, 'compound'), outcome: 'unrevealed' }),
        }),
      ],
    },

    synthesise: {
      label: 'Synthétiser',
      evidence: shown('ch. 386 — la synthèse demande un partenaire consentant'),
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
    allowedTargets: ['CHARACTER', 'OBJECT', 'LOCATION'],
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
  name: 'Eye-wogs',
  owner: 'prince-tyson',
  category: 'emitter',

  site: {
    kind: 'aura-levy',
    instruction:
      'Attach an Eye-wog to a reader: it levies one control and returns happiness in proportion to how much was read; asking twice breaks the one taboo.',
    rule: 'Depth of engagement with Tyson’s Book determines returned happiness, while violating its single taboo brings punishment.',
    cost: 'Book exposure · continuous aura levy',
    color: '#ef91c4',
    action: 'Attach an Eye-wog to a reader',
  },

  conditions: [canUseNen()],

  targets: [person(), zone()],

  actions: {
    'gather-readers': {
      label: 'Rassembler les lecteurs',
      evidence: shown('ch. 386 — les lecteurs du Livre rassemblés'),
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
      evidence: shown('ch. 386 — l’Eye-wog se fixe au lecteur'),
      conditions: [requiresTarget('Un lecteur est visé')],
      effects: [auraModifier({ levy: true, returns: 'happiness', proportionalTo: 'adherence' })],
      cost: { label: 'Aura prélevée sur le lecteur', unit: 'aura' },
    },

    'levy-without-adherence': {
      label: 'Prélever sans adhésion',
      refusal:
        'Le bonheur rendu est proportionnel à l’adhésion : sans elle, il n’y a rien à prélever',
      evidence: shown('ch. 386 — la règle énoncée avec la capacité'),
    },

    'attach-to-a-non-reader': {
      label: 'Fixer un Eye-wog hors du Livre',
      refusal: 'Les Eye-wogs se fixent aux lecteurs du Livre, à personne d’autre',
    },

    'punish-taboo': {
      label: 'Punir la violation du tabou',
      evidence: shown('ch. 386 — la violation du tabou est punie'),
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
  name: 'Desire Trap',
  owner: 'prince-luzurus',
  category: 'conjurer',

  site: {
    kind: 'desire-trap',
    instruction:
      'Read a target and the Beast materializes its desire as bait; the coercion only starts once the bait is taken.',
    rule: 'The Beast materializes what its victim wants and applies pseudo-coercive Manipulation only after the bait is accepted.',
    cost: 'Known desire · voluntarily satisfied bait',
    color: '#98b65c',
    action: 'Read the target’s desire',
  },

  conditions: [canUseNen()],

  targets: [person()],

  cost: { label: 'Un désir connu et un appât accepté volontairement', unit: 'appât' },

  actions: {
    bait: {
      label: 'Matérialiser le désir',
      evidence: shown('ch. 386 — la Bête donne au piégé ce qu’il désire'),
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
      evidence: shown('ch. 386 — le piège se referme sur le désir satisfait'),
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

    'spring-without-the-bait-taken': {
      label: 'Refermer le piège sans appât accepté',
      refusal: 'La satisfaction volontaire du désir est le déclencheur : rien avant',
      evidence: shown('ch. 386 — le piège attend que l’appât soit pris'),
    },

    'bait-an-unknown-desire': {
      label: 'Appâter sans connaître le désir',
      refusal: 'L’appât prend la forme du désir de la cible : il faut le connaître',
    },

    'count-temptation': {
      label: 'Compter une tentation',
      evidence: asserted('le piège compte les tentations avant de se refermer'),
      conditions: [effectIsLive('effectId', 'Un appât est en place')],
      effects: [attributeCounter({ increments: { temptations: 1 } })],
    },
  },

  ui: { componentKey: 'DesireTrapView' },

  interactionManifest: buildManifest('luzurus-guardian-desire-trap', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['CHARACTER', 'OBJECT', 'LOCATION'],
    overlays: ['AURA', 'RANGE'],
    entryActions: ['bait'],
    requiredState: ['canUseNen'],
    customComponent: 'DesireTrapView',
  }),
})
