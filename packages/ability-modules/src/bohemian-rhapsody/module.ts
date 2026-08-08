import {
  buildManifest,
  canUseNen,
  declaredFlag,
  effect,
  person,
  postMortem,
  requiresTarget,
  asserted,
  defineAbility,
} from '@black-whale/ability-sdk'

/**
 * Bohemian Rhapsody — Benjamin's Guardian Spirit Beast
 *
 * Chapter 417 explains a post-mortem succession plan; it does not show the
 * fusion happening. The executable branch therefore requires Benjamin's death
 * to be declared and keeps the canonical chapter use classified as explained.
 */
export const bohemianRhapsody = defineAbility({
  id: 'bohemian-rhapsody',
  name: 'Bohemian Rhapsody',
  owner: 'prince-benjamin',
  category: 'unknown',

  site: {
    kind: 'postmortem-host-succession',
    instruction:
      'After Benjamin dies, choose one blood relative as the next host. Before that death, the succession remains a declared plan rather than an active effect.',
    rule: "After Benjamin's death, his Nen and Guardian Spirit Beast merge and pass through his bloodline, alternating the choice of host.",
    cost: "Benjamin's death · blood relative host · loss of Succession Contest eligibility",
    color: '#6f567d',
    action: 'Choose the next bloodline host',
  },

  conditions: [canUseNen()],
  targets: [person()],
  cost: { label: 'Mort de Benjamin et fusion post-mortem', unit: 'vie' },

  actions: {
    merge: {
      label: 'Fusionner après la mort de Benjamin',
      evidence: asserted('ch. 417 — Benjamin décrit le mécanisme ; la fusion reste future'),
      conditions: [
        declaredFlag('benjaminDead', true, 'Benjamin est mort'),
        requiresTarget('Un parent de sang est choisi comme hôte'),
      ],
      effects: [
        postMortem(
          effect({
            kind: 'CUSTOM',
            discriminator: 'bloodline-host',
            attributes: {
              fusedWithGuardianBeast: true,
              alternatesHostChoice: true,
              preservesBenjaminNen: true,
            },
          }),
        ),
      ],
    },
    'merge-before-death': {
      label: 'Fusionner avant la mort de Benjamin',
      refusal: "La mort de Benjamin est la condition d'activation",
      evidence: asserted('ch. 417 — le plan ne commence qu’après sa mort'),
    },
    'choose-a-non-relative': {
      label: 'Choisir un hôte hors de la lignée',
      refusal: 'Le nouvel hôte doit être un parent de sang de Benjamin',
      evidence: asserted('ch. 417 — la succession reste dans la lignée de Benjamin'),
    },
    'remain-in-the-contest': {
      label: 'Rester candidat après la fusion',
      refusal: 'La fusion retire Benjamin de la Guerre de Succession',
      evidence: asserted('ch. 417 — la fusion lui fait perdre son éligibilité'),
    },
  },

  ui: { componentKey: 'BloodlineSuccessionPanel' },

  interactionManifest: buildManifest('bohemian-rhapsody', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['CHARACTER'],
    overlays: ['CONTROL_LINK', 'AURA'],
    entryActions: ['merge'],
    requiredState: ['canUseNen'],
    customComponent: 'BloodlineSuccessionPanel',
  }),
})
