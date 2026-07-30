import {
  bodyState,
  buildManifest,
  canUseNen,
  curse,
  defineAbility,
  effectIsLive,
  isConscious,
  object,
  person,
  postMortem,
  requiresTarget,
  setEffectState,
} from '@black-whale/ability-sdk'

/**
 * Sun and Moon — Chrollo Lucilfer (stolen from the Elder)
 *
 * Two marks laid by touch, harmless on their own; bringing a sun and a moon
 * together detonates. Post-mortem in the strict sense the world engine means:
 * the marks keep working after the book is closed, and after their creator died,
 * which is why Skill Hunter's "a page dies with its creator" rule does not
 * apply here.
 */
export const sunAndMoon = defineAbility({
  id: 'sun-and-moon',
  name: 'Sun and Moon',
  owner: 'chrollo-lucilfer',
  category: 'specialist',

  conditions: [canUseNen(), isConscious()],

  targets: [person(), object()],

  cost: { label: 'Une marque de Soleil et une marque de Lune', amount: 2, unit: 'marques' },

  actions: {
    'mark-sun': {
      label: 'Poser une marque solaire',
      conditions: [requiresTarget('Une cible est marquée')],
      effects: [
        postMortem(
          curse({
            trigger: 'sun-moon-contact',
            rules: [
              'Le contact d’une marque solaire et d’une marque lunaire provoque une explosion.',
              'Les marques persistent après la fermeture du livre et la mort de leur créateur.',
            ],
            attributes: { mark: 'sun' },
          }),
        ),
      ],
    },

    'mark-moon': {
      label: 'Poser une marque lunaire',
      conditions: [requiresTarget('Une cible est marquée')],
      effects: [
        postMortem(
          curse({
            trigger: 'sun-moon-contact',
            rules: [
              'Le contact d’une marque solaire et d’une marque lunaire provoque une explosion.',
              'Les marques persistent après la fermeture du livre et la mort de leur créateur.',
            ],
            attributes: { mark: 'moon' },
          }),
        ),
      ],
    },

    detonate: {
      label: 'Mise en contact',
      conditions: [effectIsLive('effectId', 'Une marque est en place')],
      effects: [
        setEffectState({ state: 'TRIGGERED', attributes: { detonated: true } }),
        bodyState({ state: 'DEAD' }),
      ],
      hint: 'Requiert le contact d’une marque solaire et d’une marque lunaire',
    },
  },

  ui: { componentKey: 'SunMoonMarks' },

  interactionManifest: buildManifest('sun-and-moon', {
    inputMode: 'CLICK',
    allowedTargets: ['CHARACTER', 'BODY', 'OBJECT'],
    overlays: ['AURA'],
    entryActions: ['mark-sun', 'mark-moon'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'SunMoonMarks',
  }),
})
