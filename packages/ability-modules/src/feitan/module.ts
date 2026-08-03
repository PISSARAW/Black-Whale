import {
  attributeCounter,
  auraModifier,
  buildManifest,
  canUseNen,
  constraint,
  defineAbility,
  effect,
  effectAttributeAtLeast,
  effectIsLive,
  isConscious,
  numberParam,
  requiresParameter,
  self,
  setEffectState,
  shown,
  spawnNenEntity,
  zone,
} from '@black-whale/ability-sdk'

/** The armour is worth wearing only once a fight has already cost something. */
const MINIMUM_PACKED_DAMAGE = 1

/**
 * Pain Packer — Feitan Portor
 *
 * The one ability in the catalogue whose output is its user's own injuries. The
 * armour does not heal and does not defend: it packs away the damage already
 * taken and holds it, so the counter it carries is the whole ability. Rising Sun
 * is the other half — it opens the wrapping and spends what is inside.
 *
 * Off the Black Whale, like the rest of the Troupe's pre-voyage kit, and kept on
 * the same terms: the catalogue records what a Spider can do, not only what a
 * Spider did between ch. 340 and ch. 415.
 */
export const painPacker = defineAbility({
  id: 'pain-packer',
  name: 'Pain Packer',
  owner: 'feitan-portor',
  category: 'transmuter',

  site: {
    kind: 'pain-armour',
    instruction:
      'Click anything that still works to take the hit: the wrapping seals its controls and keeps them, and nothing comes back until Rising Sun opens it.',
    rule: 'The armour packs away the damage Feitan has already taken instead of healing it; the more it holds, the more the released form has to spend.',
    cost: 'Damage already taken · nothing returned before the wrapping is opened',
    color: '#b4603c',
    action: 'Pack a hit away',
  },

  arena: {
    effect: 'impact',
    cost: 6,
    persistent: true,
    condition: 'damage-received',
    risk: 'must-survive-charge',
    mechanic: 'retaliation',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [self()],

  cost: { label: 'Les dégâts déjà subis, empaquetés au lieu d’être soignés', unit: 'dégâts' },

  actions: {
    wear: {
      label: 'Enfiler l’armure',
      evidence: shown('ch. 258 — l’armure enfilée après les coups encaissés'),
      conditions: [requiresParameter('damageTaken', 'Des dégâts ont déjà été encaissés')],
      effects: [
        spawnNenEntity({
          id: (ctx) => `pain-packer-armour-${ctx.actorId}`,
          kind: 'CONSTRUCT',
          label: 'Armure de Pain Packer',
          metadata: { hasCape: true, pointedHelmet: true },
        }),
        effect({
          kind: 'AURA_MODIFIER',
          attributes: (ctx) => ({
            form: 'armour',
            // Seeded rather than accumulated from zero: the damage precedes the
            // armour, which is what makes this a wrapping and not a shield.
            packedDamage: numberParam(ctx, 'damageTaken') ?? 0,
            rules: [
              'L’armure n’annule ni ne soigne les dégâts : elle les garde.',
              'Rien n’est rendu avant l’ouverture de l’emballage.',
            ],
          }),
        }),
      ],
    },

    pack: {
      label: 'Empaqueter un nouveau coup',
      evidence: shown('ch. 258 — chaque coup encaissé s’ajoute au paquet'),
      conditions: [effectIsLive('effectId', 'L’armure est en place')],
      effects: [
        attributeCounter({
          increments: (ctx) => ({ packedDamage: numberParam(ctx, 'damage') ?? 1 }),
        }),
      ],
      cost: (ctx) => ({
        label: 'Le coup encaissé, ajouté à ce que l’armure garde',
        amount: numberParam(ctx, 'damage') ?? 1,
        unit: 'dégâts',
      }),
    },

    'heal-instead-of-packing': {
      label: 'Soigner les dégâts empaquetés',
      refusal: 'L’armure garde les dégâts : elle ne les annule ni ne les soigne',
      evidence: shown('ch. 258 — rien n’est rendu avant l’ouverture'),
    },

    open: {
      label: 'Ouvrir l’emballage',
      evidence: shown('ch. 258 — l’emballage s’ouvre sur Rising Sun'),
      conditions: [
        effectIsLive('effectId', 'L’armure est en place'),
        effectAttributeAtLeast({
          key: 'packedDamage',
          threshold: MINIMUM_PACKED_DAMAGE,
          label: 'L’armure garde au moins un coup',
        }),
      ],
      effects: [setEffectState({ state: 'ENDED', attributes: { released: true } })],
      hint: 'Rising Sun dépense ce que l’armure a gardé',
    },
  },

  ui: { componentKey: 'PainPackerArmour' },

  interactionManifest: buildManifest('pain-packer', {
    inputMode: 'HOLD',
    allowedTargets: ['CHARACTER', 'BODY'],
    overlays: ['AURA'],
    entryActions: ['wear'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'PainPackerArmour',
  }),
})

/**
 * Rising Sun — Feitan Portor
 *
 * The released form: a sphere of light whose heat scales with what Pain Packer
 * had packed away, and which does not choose its targets. Both facts are
 * modelled rather than described — the reach reads the counter of the armour's
 * effect, and the constraint states out loud that allies are inside the radius.
 */
export const risingSun = defineAbility({
  id: 'rising-sun',
  name: 'Rising Sun',
  owner: 'feitan-portor',
  category: 'transmuter',

  site: {
    kind: 'sun-flare',
    instruction:
      'Click where the sphere should rise: its radius is however much Pain Packer had packed away, and everything caught inside it is opened.',
    rule: 'The heat is proportional to the stored damage and does not discriminate: whatever stands near the target burns with it.',
    cost: 'Every packed hit, spent at once',
    color: '#f2a63b',
    action: 'Release the stored heat',
  },

  conditions: [
    canUseNen(),
    isConscious(),
    effectAttributeAtLeast({
      key: 'packedDamage',
      threshold: MINIMUM_PACKED_DAMAGE,
      label: 'Pain Packer a empaqueté des dégâts',
      parameterKey: 'painPackerEffectId',
    }),
  ],

  targets: [self(), zone()],

  cost: { label: 'Tout ce que Pain Packer avait empaqueté, dépensé d’un coup', unit: 'dégâts' },

  actions: {
    ignite: {
      label: 'Devenir un soleil',
      evidence: shown('ch. 258 — le soleil se lève'),
      effects: [
        spawnNenEntity({
          id: (ctx) => `rising-sun-${ctx.actorId}`,
          kind: 'CONSTRUCT',
          label: 'Rising Sun',
          metadata: { form: 'sphere', emits: 'heat' },
        }),
        auraModifier({
          form: 'sphere',
          emission: 'heat',
          rules: ['La puissance dégagée est proportionnelle aux dégâts empaquetés.'],
        }),
      ],
    },

    'spare-an-ally': {
      label: 'Épargner un allié',
      refusal: 'La chaleur ne distingue personne : les alliés doivent se mettre à couvert',
      evidence: shown('ch. 258 — l’avertissement lancé aux siens'),
    },

    'ignite-without-packed-damage': {
      label: 'Lever le soleil sans dégâts empaquetés',
      refusal: 'La puissance vient de ce que Pain Packer a gardé : sans paquet, rien à dépenser',
      evidence: shown('ch. 258 — les deux capacités vont ensemble'),
    },

    burn: {
      label: 'Carboniser la zone',
      evidence: shown('ch. 258 — la chaleur ne distingue pas les alliés'),
      conditions: [effectIsLive('effectId', 'Le soleil est levé')],
      effects: [
        constraint({
          rules: [
            'La chaleur carbonise ce qu’elle atteint.',
            'Elle ne distingue pas les alliés des ennemis : ils doivent se mettre à couvert.',
          ],
          attributes: (ctx) => ({
            radiusMeters: numberParam(ctx, 'radiusMeters'),
            spentDamage: numberParam(ctx, 'packedDamage'),
          }),
        }),
        setEffectState({ state: 'ENDED', attributes: { released: true } }),
      ],
      hint: 'Un seul souffle : la charge part entièrement',
    },
  },

  ui: { componentKey: 'RisingSunBurst' },

  interactionManifest: buildManifest('rising-sun', {
    inputMode: 'HOLD',
    allowedTargets: ['CHARACTER', 'LOCATION'],
    overlays: ['AURA', 'RANGE'],
    entryActions: ['ignite'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'RisingSunBurst',
  }),
})
