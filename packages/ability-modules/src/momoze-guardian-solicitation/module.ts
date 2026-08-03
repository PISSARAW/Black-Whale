import {
  auraModifier,
  buildManifest,
  canUseNen,
  controlLink,
  declaredFlag,
  defineAbility,
  effect,
  effectIsLive,
  masked,
  person,
  requiresTarget,
  setEffectState,
  spawnNenEntity,
} from '@black-whale/ability-sdk'

const BEAST_ID = 'momoze-guardian-spider'

/**
 * Momoze's guardian — "Are you free?"
 *
 * A beast that asks, over and over, until somebody says yes; the agreement puts
 * a spider in their ear. Hanzo, standing guard, sees nothing — the beast only
 * emits events visible to Nen perspectives, which is what makes Momoze's death
 * (ch. 390) a locked-room mystery the investigation mode can actually pose.
 */
export const momozeGuardianSolicitation = defineAbility({
  id: 'momoze-guardian-solicitation',
  name: 'Are You Free?',
  owner: 'prince-momoze',
  category: 'unknown',

  site: {
    kind: 'solicitation',
    instruction:
      'Ask a target and touch it again for yes; every target left unanswered keeps being pestered, and only one body can be held at a time.',
    rule: 'Only an affirmative answer lets the spider enter the ear and manipulate the victim using their own aura.',
    cost: 'Repeated solicitation · explicit yes · heavy host fatigue',
    color: '#e8a9a1',
    action: 'Ask “Are you free?”',
  },

  conditions: [canUseNen()],

  targets: [person()],

  actions: {
    solicit: {
      label: 'Solliciter',
      conditions: [requiresTarget('Une cible est sollicitée')],
      effects: [
        spawnNenEntity({
          id: BEAST_ID,
          kind: 'NEN_ENTITY',
          label: 'Bête gardienne de Momoze',
          metadata: { visibleTo: 'nen-users-only' },
        }),
        // Dormant and masked: the offer is standing, and nobody without Nen can
        // see it being made.
        masked(
          effect({
            kind: 'CUSTOM',
            discriminator: 'solicitation',
            state: 'DORMANT',
            attributes: {
              rules: [
                'La bête répète sa sollicitation jusqu’à obtenir un accord.',
                'L’accord insère une araignée dans l’oreille de la cible.',
              ],
            },
          }),
        ),
      ],
    },

    accept: {
      label: 'La cible accepte',
      conditions: [
        effectIsLive('effectId', 'Une sollicitation est en cours'),
        declaredFlag('consented', true, 'La cible a donné son accord'),
      ],
      effects: [
        setEffectState({ state: 'TRIGGERED', attributes: { consented: true } }),
        controlLink({ vector: 'spider', mode: 'control' }),
        // The drain is what eventually kills.
        auraModifier({ drain: true, source: BEAST_ID }),
      ],
      cost: { label: 'Drain d’aura continu', unit: 'aura' },
    },
  },

  ui: { componentKey: 'GuardianBeastView' },

  interactionManifest: buildManifest('momoze-guardian-solicitation', {
    inputMode: 'SEQUENCE',
    allowedTargets: ['CHARACTER', 'LOCATION'],
    overlays: ['CONTROL_LINK', 'AURA'],
    entryActions: ['solicit'],
    requiredState: ['canUseNen'],
    customComponent: 'GuardianBeastView',
  }),
})
