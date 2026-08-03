import {
  buildManifest,
  canUseNen,
  controlLink,
  defineAbility,
  effectIsLive,
  isConscious,
  knowledgeGrant,
  param,
  person,
  requiresTarget,
  setEffectState,
  shown,
} from '@black-whale/ability-sdk'

/**
 * Black Voice — inherited from Shalnark
 *
 * Total control through a planted antenna, and a second antenna held as a
 * threat. The interesting event is not the control but the revocation: Shalnark
 * dies, the page dies, and the timeline shows it.
 */
export const blackVoice = defineAbility({
  id: 'black-voice',
  name: 'Black Voice',
  owner: 'chrollo-lucilfer',
  category: 'manipulator',

  site: {
    kind: 'puppet',
    instruction:
      'Plant both antennae in buttons or links, then click anywhere; the order goes into one of them and never says which.',
    rule: 'The antenna grants total remote control until removed or the target is destroyed.',
    cost: 'One antenna and one controller',
    color: '#7f92b8',
    action: 'Plant an antenna',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [person()],

  cost: { label: 'Une antenne implantée par cible contrôlée', amount: 1, unit: 'antenne' },

  actions: {
    'plant-antenna': {
      label: 'Planter une antenne',
      evidence: shown('ch. 106 — l’antenne plantée dans la nuque'),
      conditions: [requiresTarget('Une cible est piquée')],
      effects: [
        controlLink({
          vector: 'antenna',
          mode: 'control',
          attributes: {
            rules: [
              'Le contrôle est total et se commande par téléphone.',
              'Une seconde antenne sert de menace.',
            ],
          },
        }),
      ],
    },

    'threaten-with-a-second': {
      label: 'Menacer d’une seconde antenne',
      // Canon uses the antenna as leverage before it is ever planted.
      evidence: shown('ch. 106 — la seconde antenne brandie comme menace'),
      effects: [
        knowledgeGrant({
          factId: (ctx) => `threat:second-antenna:${ctx.targets[0] ?? 'target'}`,
          state: 'KNOWN',
        }),
      ],
    },

    'command-by-phone': {
      label: 'Commander par téléphone',
      evidence: shown('ch. 106 — l’ordre passe par le combiné, à distance'),
      conditions: [effectIsLive('effectId', 'Une antenne est plantée')],
      effects: [
        setEffectState({
          state: 'ACTIVE',
          attributes: (ctx) => ({ lastOrder: param(ctx, 'order'), vector: 'phone' }),
        }),
      ],
    },

    'command-without-antenna': {
      label: 'Commander sans antenne',
      refusal: 'Sans antenne plantée, le combiné ne commande personne',
    },

    command: {
      label: 'Donner un ordre',
      evidence: shown('ch. 106 — le corps de la cible exécute l’ordre reçu'),
      conditions: [effectIsLive('effectId', 'Une antenne est plantée')],
      // The controller acts with the target's body: actorId stays Chrollo.
      effects: [
        setEffectState({
          state: 'ACTIVE',
          attributes: (ctx) => ({ lastOrder: param(ctx, 'order'), actingBodyId: ctx.targets[0] }),
        }),
      ],
    },
  },

  ui: { componentKey: 'AntennaControl' },

  interactionManifest: buildManifest('black-voice', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['CHARACTER', 'BODY', 'OBJECT'],
    overlays: ['CONTROL_LINK'],
    entryActions: ['plant-antenna'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'AntennaControl',
  }),
})
