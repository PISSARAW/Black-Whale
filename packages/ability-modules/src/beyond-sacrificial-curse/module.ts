import {
  bodyState,
  buildManifest,
  canUseNen,
  curse,
  defineAbility,
  effectIsLive,
  masked,
  param,
  person,
  postMortem,
  requiresParameter,
  requiresTarget,
  revealedAt,
  setEffectState,
  shown,
} from '@black-whale/ability-sdk'

/** The chapter that turns these birthmarks into a threat. */
const REVEAL_CHAPTER = 415

/**
 * Sacrificial curse — Beyond Netero
 *
 * A birthmark visible only in Gyo, carried from birth, that kills a designated
 * target when the sacrifice dies. Before chapter 415 the marked characters look
 * ordinary; after it, the Gyo toggle reveals the marks and the sacrifice → royal
 * target graph unfolds. The spoiler engine is what guards that, not a caption.
 */
export const beyondSacrificialCurse = defineAbility({
  id: 'beyond-sacrificial-curse',
  name: 'Sacrificial Curse',
  owner: 'beyond-netero',
  category: 'specialist',

  site: {
    kind: 'curse',
    instruction:
      'Choose the distant victim; the sacrifice among its own is chosen with it and hidden, so use Gyo to find the mark before spending it.',
    rule: 'The dormant mark awakens its carrier from birth and kills the preselected target only when that sacrifice dies.',
    cost: 'Prepared child sacrifice · death · post-mortem Nen',
    color: '#9d65d0',
    action: 'Mark the intended victim',
  },

  conditions: [canUseNen()],

  targets: [person()],

  actions: {
    mark: {
      label: 'Marquer un sacrifice',
      evidence: shown('ch. 415, scène avant le voyage — marque visible en Gyo seul'),
      gyo: 'la marque de naissance que rien d’autre ne montre',
      conditions: [
        requiresTarget('Un enfant est marqué'),
        requiresParameter('curseTargetId', 'La cible désignée est choisie'),
      ],
      effects: [
        revealedAt(
          // Masked: the birthmark only exists for Gyo and for the omniscient view.
          // Post-mortem: the whole point is that it fires when its bearer dies.
          masked(
            postMortem(
              curse({
                trigger: 'sacrifice-death',
                rules: [
                  'La marque de naissance n’est visible qu’en Gyo.',
                  'Le porteur est éveillé au Nen dès la naissance.',
                  'La mort du sacrifice tue la cible désignée, malgré son gardien et à grande distance.',
                ],
                attributes: (ctx) => ({
                  // Sealed until the reveal: the target is part of the mystery.
                  curseTargetId: param(ctx, 'curseTargetId'),
                  sealed: true,
                }),
              }),
            ),
          ),
          REVEAL_CHAPTER,
        ),
      ],
      cost: { label: 'La vie du sacrifice', unit: 'vie' },
    },

    trigger: {
      label: 'Déclencher le sacrifice',
      evidence: shown('ch. 415, scène avant le voyage — la mort emporte la cible désignée'),
      conditions: [
        effectIsLive('effectId', 'La marque est encore en place'),
        requiresParameter('curseTargetId', 'La cible désignée est connue'),
      ],
      effects: [
        setEffectState({ state: 'TRIGGERED', attributes: { firedAt: 'sacrifice-death' } }),
        bodyState({ bodyId: (ctx) => param(ctx, 'curseTargetId'), state: 'DEAD' }),
      ],
      hint: 'La mort du porteur tue la cible, quel que soit son gardien',
    },

    'kill-at-any-distance': {
      label: 'Frapper à l’autre bout du monde',
      // The reason Furykov calls it the strongest curse ever observed: neither
      // distance nor a guardian beast changes the outcome.
      evidence: shown('ch. 415, scène avant le voyage — distance et gardien sont ignorés'),
      effects: [setEffectState({ state: 'TRIGGERED', attributes: { ignoresDistance: true } })],
      cost: { label: 'La vie du sacrifice', unit: 'vie' },
    },

    'see-the-mark-without-gyo': {
      label: 'Voir la marque sans Gyo',
      refusal: 'La marque de naissance n’apparaît qu’en Gyo',
      evidence: shown('ch. 415, scène avant le voyage — le Gyo révèle la marque'),
    },

    'read-the-sealed-target': {
      label: 'Lire la cible désignée',
      refusal: 'La cible reste scellée : le manga ne l’a pas encore nommée',
    },
  },

  ui: { componentKey: 'SacrificialCurseGraph' },

  interactionManifest: buildManifest('beyond-sacrificial-curse', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['CHARACTER', 'BODY', 'LOCATION'],
    overlays: ['AURA'],
    entryActions: ['mark'],
    requiredState: ['canUseNen'],
    customComponent: 'SacrificialCurseGraph',
  }),
})

export const BEYOND_CURSE_REVEAL_CHAPTER = REVEAL_CHAPTER
