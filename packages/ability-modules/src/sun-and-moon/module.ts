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
  shown,
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
  name: 'The Sun and Moon',
  owner: 'chrollo-lucilfer',
  category: 'specialist',

  site: {
    kind: 'polarity',
    instruction:
      'Mark the Sun, hold the contact to charge it, then mark the Moon; the pair only goes off once the two marks touch, and a full charge takes the neighbours.',
    rule: 'Opposite marks explode on contact and persist through post-mortem Nen.',
    cost: 'One Sun mark plus one Moon mark',
    color: '#ffb347',
    action: 'Place the Sun mark',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [person(), object()],

  cost: { label: 'Une marque de Soleil et une marque de Lune', amount: 2, unit: 'marques' },

  actions: {
    'mark-sun': {
      evidence: shown('ch. 371 — la marque du soleil posée au contact'),
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
      evidence: shown('ch. 371 — la marque de la lune, l’autre moitié du piège'),
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
      evidence: shown('ch. 371 — soleil et lune se rejoignent, la charge part'),
      label: 'Mise en contact',
      conditions: [effectIsLive('effectId', 'Une marque est en place')],
      effects: [
        setEffectState({ state: 'TRIGGERED', attributes: { detonated: true } }),
        bodyState({ state: 'DEAD' }),
      ],
      hint: 'Requiert le contact d’une marque solaire et d’une marque lunaire',
    },

    'survive-the-book-closing': {
      label: 'Tenir livre fermé',
      // The post-mortem page: the marks keep working when Chrollo no longer
      // holds the ability, which is what makes them a standing threat.
      evidence: shown('ch. 371 — les marques posées survivent à la page rendue'),
      effects: [setEffectState({ state: 'DORMANT', attributes: { postMortem: true } })],
    },

    'detonate-a-single-mark': {
      label: 'Faire exploser une seule marque',
      refusal: 'Il faut le soleil et la lune : une marque seule ne fait rien',
      evidence: shown('ch. 371 — c’est le contact des deux qui déclenche'),
    },

    'mark-at-a-distance': {
      label: 'Marquer à distance',
      refusal: 'Les marques se posent par contact de la paume',
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
