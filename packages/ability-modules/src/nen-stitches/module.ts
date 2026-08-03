import {
  bodyState,
  buildManifest,
  canUseNen,
  controlLink,
  defineAbility,
  effect,
  isConscious,
  masked,
  numberParam,
  object,
  person,
  requiresTarget,
  setEffectState,
} from '@black-whale/ability-sdk'

/**
 * Nen Stitches — Machi Komacine
 *
 * The second consumer of the filament component Bungee Gum introduced, and the
 * module that shows a typed heal: surgery is an INJURED → ALIVE transition, not
 * a hit-point number. Canon detail kept as an attribute rather than dropped: the
 * thread weakens as it lengthens.
 */
export const nenStitches = defineAbility({
  id: 'nen-stitches',
  name: 'Nen Stitches',
  owner: 'machi-komacine',
  category: 'transmuter',

  site: {
    kind: 'stitch',
    instruction:
      'Sew two sections together — the shorter the thread, the stronger the seam — or sew a section to itself to put back what was cut off it.',
    rule: 'Aura threads reconnect severed flesh with exceptional speed and precision.',
    cost: 'Thread length and precision',
    color: '#dd77b7',
    action: 'Choose the first torn edge',
  },

  arena: {
    effect: 'restore',
    cost: 10,
    persistent: true,
    condition: 'shorter-thread-is-stronger',
    risk: 'thread-can-be-cut',
    mechanic: 'threads',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [person(), object()],

  cost: { label: 'Fil d’aura proportionnel à la plaie recousue', unit: 'fil' },

  actions: {
    thread: {
      label: 'Tendre un fil',
      conditions: [requiresTarget('Une cible est reliée')],
      effects: [
        effect({
          kind: 'ELASTIC_BINDING',
          attributes: (ctx) => ({
            retractable: true,
            lengthMeters: numberParam(ctx, 'lengthMeters'),
            // The longer the thread, the weaker it is.
            strength: 'inverse-to-length',
          }),
        }),
      ],
    },

    'thread-hidden': {
      label: 'Tendre un fil dissimulé (In)',
      conditions: [requiresTarget('Une cible est reliée')],
      effects: [masked(effect({ kind: 'ELASTIC_BINDING', attributes: { retractable: true } }))],
      hint: 'Visible uniquement en Gyo',
    },

    puppet: {
      label: 'Manipuler comme une marionnette',
      conditions: [requiresTarget('Une cible est reliée')],
      effects: [controlLink({ vector: 'thread', mode: 'control' })],
    },

    suture: {
      label: 'Recoudre',
      conditions: [requiresTarget('Un blessé est recousu')],
      effects: [bodyState({ state: 'ALIVE' })],
    },

    cut: {
      label: 'Couper le fil',
      effects: [setEffectState({ state: 'ENDED' })],
    },
  },

  ui: { componentKey: 'FilamentInteraction' },

  interactionManifest: buildManifest('nen-stitches', {
    inputMode: 'DRAG',
    allowedTargets: ['CHARACTER', 'BODY', 'OBJECT'],
    overlays: ['TENSION', 'CONTROL_LINK', 'AURA'],
    entryActions: ['thread'],
    requiredState: ['isConscious', 'canUseNen'],
    // Shares Bungee Gum's filament renderer.
    customComponent: 'FilamentInteraction',
  }),
})
