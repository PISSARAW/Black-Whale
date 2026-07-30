import {
  buildManifest,
  canUseNen,
  defineAbility,
  effectIsLive,
  isConscious,
  object,
  param,
  perceptionMask,
  person,
  postMortem,
  requiresTarget,
  setEffectState,
  surface,
} from '@black-whale/ability-sdk'

/**
 * Texture Surprise — Hisoka Morrow
 *
 * A flat surface made to look like something else. Undetectable to aura once
 * applied, betrayed by touch: two attributes that decide, per perspective, who
 * is fooled. In Gyo the forgery shows nothing; only contact ends it.
 *
 * On the Black Whale it is what holds the rebuilt Hisoka together (post-ch. 357)
 * and what turns forged papers into objects the omniscient view reads correctly
 * while every character reads the lie.
 */
export const textureSurprise = defineAbility({
  id: 'texture-surprise',
  name: 'Texture Surprise',
  owner: 'hisoka',
  category: 'transmuter',

  conditions: [canUseNen(), isConscious()],

  targets: [person(), object(), surface()],

  cost: { label: 'Peu d’aura, mais une surface plane et limitée par masque', unit: 'aura' },

  actions: {
    apply: {
      label: 'Appliquer un masque',
      conditions: [requiresTarget('Une surface plane est visée')],
      effects: [perceptionMask({ tactileFail: true, auraDetectable: false })],
    },

    'forge-document': {
      label: 'Falsifier un document',
      conditions: [requiresTarget('Un document est visé')],
      effects: [
        perceptionMask({
          tactileFail: true,
          auraDetectable: false,
          appearsAs: (ctx) => param(ctx, 'appearsAs'),
          attributes: { surfaceType: 'document' },
        }),
      ],
    },

    'rebuild-body': {
      label: 'Reconstruire le corps',
      conditions: [requiresTarget('Le corps reconstruit est visé')],
      // The rebuilt Hisoka: the masks are worn by a body that already died once,
      // so they must survive that death.
      effects: [
        postMortem(
          perceptionMask({
            tactileFail: true,
            auraDetectable: false,
            attributes: { surfaceType: 'body', prosthetic: true },
          }),
        ),
      ],
      hint: 'Post-ch. 357 — masques permanents sur le corps reconstruit',
    },

    'reveal-by-touch': {
      label: 'Révéler au toucher',
      conditions: [effectIsLive('effectId', 'Un masque est en place')],
      effects: [setEffectState({ state: 'ENDED', attributes: { revealedBy: 'touch' } })],
      hint: 'Le contact met fin à la supercherie',
    },
  },

  ui: { componentKey: 'TextureSurpriseView' },

  interactionManifest: buildManifest('texture-surprise', {
    inputMode: 'DRAW',
    allowedTargets: ['CHARACTER', 'BODY', 'OBJECT'],
    overlays: ['AURA'],
    entryActions: ['apply'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'TextureSurpriseView',
  }),
})
