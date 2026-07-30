import {
  auraModifier,
  buildManifest,
  canUseNen,
  defineAbility,
  effect,
  effectIsLive,
  isConscious,
  numberParam,
  perceptionMask,
  person,
  requiresTarget,
  self,
  setEffectState,
  spawnNenEntity,
} from '@black-whale/ability-sdk'

/** Canon: half an hour of treatment is worth eight hours of sleep. */
const TREATMENT_MINUTES = 30
const SLEEP_EQUIVALENT_HOURS = 8

/**
 * Magical Esthetician: Cookie — Biscuit Krueger
 *
 * A masseuse and a lotion, and a very concrete exchange rate. Useful the moment
 * the site tracks fatigue — the royal sector guards work shifts, and this is the
 * only ability in the catalogue that resets one.
 */
export const magicalEstheticianCookie = defineAbility({
  id: 'magical-esthetician-cookie',
  name: 'Magical Esthetician: Cookie',
  owner: 'biscuit-krueger',
  category: 'transmuter',

  conditions: [canUseNen(), isConscious()],

  targets: [person(), self()],

  actions: {
    summon: {
      label: 'Invoquer Cookie',
      effects: [
        spawnNenEntity({
          id: (ctx) => `cookie-${ctx.actorId}`,
          kind: 'NEN_ENTITY',
          label: 'Cookie',
          metadata: { role: 'masseuse' },
        }),
      ],
    },

    treat: {
      label: 'Masser',
      conditions: [requiresTarget('Une personne est massée')],
      effects: [
        auraModifier({
          mode: 'RECOVERY',
          treatmentMinutes: TREATMENT_MINUTES,
          sleepEquivalentHours: SLEEP_EQUIVALENT_HOURS,
          rules: [
            `${TREATMENT_MINUTES} minutes de soin valent ${SLEEP_EQUIVALENT_HOURS} h de sommeil.`,
          ],
        }),
      ],
      cost: {
        label: 'Durée du soin',
        amount: TREATMENT_MINUTES,
        unit: 'minutes',
      },
    },
  },

  ui: { componentKey: 'FatigueGauge' },

  interactionManifest: buildManifest('magical-esthetician-cookie', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['CHARACTER', 'BODY'],
    overlays: ['AURA'],
    entryActions: ['summon'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'FatigueGauge',
  }),
})

/**
 * Body transformation — Biscuit Krueger
 *
 * An inverted perception mask: her small form is the disguise, and dropping it
 * shows the truth. A small sheet, but a neat illustration of the gap between
 * appearance and reality that the whole perspective layer is built on.
 */
export const biscuitBodyTransformation = defineAbility({
  id: 'biscuit-body-transformation',
  name: 'Transformation corporelle',
  owner: 'biscuit-krueger',
  category: 'transmuter',

  conditions: [canUseNen(), isConscious()],

  targets: [self()],

  cost: { label: 'Transformation maintenue en continu', unit: 'aura' },

  actions: {
    'maintain-youthful-form': {
      label: 'Maintenir la forme juvénile',
      effects: [
        // The mask is the default state, not the exception.
        perceptionMask({
          appearsAs: 'biscuit-krueger-youthful',
          auraDetectable: false,
          attributes: { inverted: true, note: 'La forme réelle est massivement musclée.' },
        }),
      ],
    },

    'reveal-true-form': {
      label: 'Révéler la forme réelle',
      conditions: [effectIsLive('effectId', 'La forme juvénile est maintenue')],
      effects: [
        setEffectState({ state: 'ENDED', attributes: { revealedBy: 'choice' } }),
        effect({
          kind: 'AURA_MODIFIER',
          discriminator: 'true-form',
          attributes: (ctx) => ({
            form: 'true',
            strengthFactor: numberParam(ctx, 'strengthFactor') ?? 1,
          }),
        }),
      ],
    },
  },

  ui: { componentKey: 'FormToggle' },

  interactionManifest: buildManifest('biscuit-body-transformation', {
    inputMode: 'CLICK',
    allowedTargets: ['CHARACTER', 'BODY'],
    overlays: ['AURA'],
    entryActions: ['maintain-youthful-form'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'FormToggle',
  }),
})
