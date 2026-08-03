import {
  abilityGrant,
  abilityRevoke,
  buildManifest,
  canUseNen,
  checklist,
  defineAbility,
  effect,
  effectIsLive,
  isConscious,
  param,
  person,
  requiresParameter,
  requiresTarget,
  setEffectState,
  withinMinutes,
} from '@black-whale/ability-sdk'

/** The four conditions Chrollo must satisfy, in under an hour, to steal a hatsu. */
export const SKILL_HUNTER_STEPS = [
  'see-ability',
  'ask-about-ability',
  'hear-answer',
  'palm-contact',
]

/**
 * Skill Hunter — Chrollo Lucilfer
 *
 * The book as a temporal projection: at any event, the list of usable pages is
 * whatever the world state says Chrollo owns. Pages die with their creator —
 * Gallery Fake with Kortopi, Black Voice with Shalnark — unless the ability was
 * programmed to outlive them, which is exactly the post-mortem flag.
 */
export const skillHunter = defineAbility({
  id: 'skill-hunter',
  name: 'Skill Hunter',
  owner: 'chrollo-lucilfer',
  category: 'specialist',

  site: {
    kind: 'theft',
    instruction:
      'Click a button or link to steal it into the floating book; the original control is sealed while its copy remains usable.',
    rule: 'A stolen ability is stored in the book and cannot be used by its owner while held.',
    cost: 'Targeted control must be exposed',
    color: '#b69ad9',
    action: 'Open the book and steal a control',
  },

  arena: {
    effect: 'enhance',
    cost: 18,
    persistent: true,
    condition: 'book-and-theft-conditions',
    risk: 'hand-and-page-restrictions',
    mechanic: 'loadout',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  actions: {
    steal: {
      label: 'Voler une capacité',
      conditions: [
        requiresTarget('Une victime est au contact'),
        requiresParameter('targetAbilityId', 'La capacité volée est identifiée'),
        checklist(
          'skill-hunter',
          'Les quatre conditions sont remplies : voir la capacité, interroger, obtenir la réponse, contact paume-couverture',
          SKILL_HUNTER_STEPS,
        ),
        withinMinutes('elapsedMinutes', 60, 'Les quatre conditions tiennent en moins d’une heure'),
      ],
      effects: [
        abilityRevoke({ reason: 'skill-hunter' }),
        effect({
          kind: 'ABILITY_GRANT',
          discriminator: 'page',
          attributes: (ctx) => ({
            storedAbilityId: param(ctx, 'targetAbilityId'),
            creatorId: ctx.targets[0],
            storedIn: 'skill-hunter',
          }),
        }),
        abilityGrant(),
      ],
      cost: { label: 'Une page du livre, mains occupées à la lecture', amount: 1, unit: 'page' },
    },

    'creator-died': {
      label: 'Le créateur est mort',
      conditions: [effectIsLive('effectId', 'La page existe encore')],
      // A page whose creator died stops working — unless it was post-mortem, in
      // which case the world-engine invariant keeps it alive and this action is
      // simply never taken for it.
      effects: [
        abilityRevoke({
          ownerId: 'chrollo-lucilfer',
          reason: 'creator-died',
        }),
        setEffectState({ state: 'ENDED', attributes: { reason: 'creator-died' } }),
      ],
      hint: 'Sauf capacité programmée post-mortem',
    },
  },

  ui: { componentKey: 'BanditsSecretBook' },

  interactionManifest: buildManifest('skill-hunter', {
    // Four conditions in order: this is a sequence, not a click.
    inputMode: 'SEQUENCE',
    allowedTargets: ['CHARACTER'],
    overlays: ['RANGE'],
    entryActions: ['steal'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'BanditsSecretBook',
  }),
})

/**
 * Double Face — Chrollo Lucilfer
 *
 * The bookmark: two stolen abilities usable at once, at the price of having both
 * hands taken by the book.
 */
export const doubleFace = defineAbility({
  id: 'double-face',
  name: 'Double Face',
  owner: 'chrollo-lucilfer',
  category: 'specialist',

  site: {
    kind: 'bookmark',
    instruction:
      'Bookmark up to two sections; both remain pinned and visible while you navigate the rest of the page.',
    rule: 'The bookmark keeps one stolen ability active while Skill Hunter opens on another page.',
    cost: 'Two simultaneous pages maximum',
    color: '#9c7ac4',
    action: 'Bookmark the first section',
  },

  conditions: [canUseNen(), isConscious()],

  actions: {
    bookmark: {
      label: 'Poser le marque-page',
      conditions: [requiresParameter('targetAbilityId', 'Une page est marquée')],
      effects: [
        effect({
          kind: 'ABILITY_GRANT',
          discriminator: 'bookmark',
          attributes: (ctx) => ({
            bookmarkedAbilityId: param(ctx, 'targetAbilityId'),
            simultaneousSlots: 2,
            rules: ['Deux capacités simultanées.', 'Les deux mains restent occupées par le livre.'],
          }),
        }),
      ],
      cost: { label: 'Les deux mains occupées', amount: 2, unit: 'mains' },
    },
  },

  ui: { componentKey: 'BanditsSecretBook' },

  interactionManifest: buildManifest('double-face', {
    inputMode: 'CLICK',
    allowedTargets: ['EVENT'],
    overlays: [],
    entryActions: ['bookmark'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'BanditsSecretBook',
  }),
})
