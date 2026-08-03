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
  shown,
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
      evidence: shown('ch. 386 — la bête répète son offre'),
      gyo: 'la bête gardienne et l’offre qu’elle répète, invisible aux non-utilisateurs',
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
      evidence: shown('ch. 386 — l’accord donné, l’araignée entre dans l’oreille'),
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

    drain: {
      label: 'Poursuivre le drain',
      // The closed-room death of ch. 390: the guard sees nothing because the
      // beast only emits in the Nen perspectives.
      evidence: shown('ch. 390 — la mort de Momoze, sans témoin capable de voir'),
      conditions: [effectIsLive('effectId', 'Une araignée est en place')],
      effects: [auraModifier({ drain: true, source: BEAST_ID, fatal: true })],
      cost: { label: 'La vie de la porteuse', unit: 'vie' },
    },

    'force-consent': {
      label: 'Passer outre le refus',
      refusal: 'La bête sollicite : sans accord, l’araignée n’entre pas',
      evidence: shown('ch. 386 — l’offre est répétée, jamais imposée'),
    },

    'be-seen-by-a-non-user': {
      label: 'Être vue par un non-utilisateur',
      refusal: 'La bête n’existe que dans les perspectives Nen : la garde ne voit rien',
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
