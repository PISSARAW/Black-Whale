import {
  attributeCounter,
  buildManifest,
  canUseNen,
  condition,
  defineAbility,
  effectIsLive,
  isConscious,
  knowledgeGrant,
  object,
  param,
  person,
  requiresParameter,
  requiresTarget,
  self,
  setEffectState,
  shown,
  spawnNenEntity,
} from '@black-whale/ability-sdk'

/**
 * Combo Master — Furykov
 *
 * The eighty-third entry, and the only one in the catalogue whose canonical
 * manifestation is an *interface*: a hand-held console conjured at the Kakin
 * succession tree, its menus drawn nearly verbatim, an alert triangle and a
 * ブーン. Everything below is that console's own behaviour.
 *
 * Three durations are all the manga gives, and they are carried as they are:
 *
 *   ~10 days   to decipher a prince's Guardian Spirit Beast
 *   365 days   to decode Beyond Netero's sacrificial curse
 *   700 days   to counter it
 *
 * Nothing is interpolated between them. A curve fitted through three points
 * would be a rate for an ability whose rate the manga never states, and the
 * whole reason this module exists is that the three numbers are attested and
 * everything between them is not.
 *
 * The asymmetry is the ability. Deciphering accumulates with co-presence and
 * survives being interrupted; fabrication takes about as long and resets to
 * zero the moment he leaves or is disturbed. Leaving costs everything, and only
 * on one side of the menu.
 *
 * And the lock. While either is running Furykov casts nothing at all — his own
 * last arc has him held by his own decipher, 365 days deep in Beyond's curse.
 * The refusal is permanent, and it is the character rather than a gap.
 */
export const comboMaster = defineAbility({
  id: 'combo-master',
  name: 'Combo Master',
  owner: 'furykov',
  category: 'specialist',

  site: {
    kind: 'decipher',
    instruction:
      'Stay in the room with the ability you want read; the console counts the time you spend beside it and reports the days left. SELECT then WEAPON, ARMOR or TOOL to build against what it decoded — and stay put, because fabrication starts again from zero if you leave.',
    rule: 'Deciphering advances with cumulative co-presence and survives interruption; fabrication takes about as long and resets on leaving. Nothing else may be cast while either runs.',
    cost: 'Days of co-presence · no other Hatsu while it runs',
    color: '#4d8ff0',
    action: 'Open the console',
  },

  arena: {
    effect: 'bind',
    cost: 0,
    persistent: true,
    condition: 'co-presence',
    risk: 'locked-out',
  },

  conditions: [canUseNen(), isConscious()],

  targets: [person(), object(), self()],

  actions: {
    conjure: {
      label: 'Invoquer le portable',
      evidence: shown('ch. 413 — le portable conjuré, ses menus et son « ブーン »'),
      effects: [
        spawnNenEntity({
          id: 'combo-master-console',
          kind: 'CONSTRUCT',
          label: 'Portable de Furykov',
        }),
      ],
      hint: 'SELECT · WEAPON / ARMOR / TOOL',
    },

    decipher: {
      label: 'Déchiffrer par co-présence',
      evidence: shown('ch. 413 — le compteur de jours restants sur l’écran'),
      // Cumulative, and it survives interruption: the counter is on the
      // console and the console does not forget when he walks out.
      conditions: [requiresTarget('Une capacité est visée')],
      effects: [
        attributeCounter({
          effectId: 'combo-master-decipher',
          increments: { coPresenceDays: 1 },
        }),
      ],
      cost: { label: 'Jours de co-présence', unit: 'day' },
      hint: '≈ 10 j pour une bête gardienne · 365 j pour la malédiction de Beyond',
    },

    'read-out': {
      label: 'Lire le déchiffrage',
      evidence: shown('ch. 413 — les jours restants s’affichent'),
      conditions: [effectIsLive('combo-master-decipher', 'Un déchiffrage est en cours')],
      effects: [
        knowledgeGrant({
          factId: (ctx) => `decipher:${param(ctx, 'targetAbilityId') ?? 'unknown'}`,
          state: 'KNOWN',
        }),
      ],
    },

    fabricate: {
      label: 'Fabriquer l’équipement',
      evidence: shown('ch. 413-415 — SELECT → WEAPON / ARMOR / TOOL'),
      // The asymmetry, declared rather than described: staying is the
      // condition, and there is no such condition on deciphering.
      conditions: [
        requiresParameter('slot', 'WEAPON, ARMOR ou TOOL est choisi'),
        condition('stays-in-room', 'Furykov ne quitte pas la pièce', (ctx) =>
          param(ctx, 'left') === 'true' ? 'UNMET' : 'MET',
        ),
      ],
      effects: [
        attributeCounter({
          effectId: 'combo-master-fabrication',
          increments: { fabricationDays: 1 },
        }),
      ],
      cost: { label: 'Jours de fabrication', unit: 'day' },
      hint: 'Sortir ou être interrompu remet à zéro',
    },

    'remove-curse': {
      label: 'Potion REMOVE CURSE',
      evidence: shown('ch. 415 — 365 j pour décoder, 700 j pour contrer'),
      // The two attested numbers, carried as numbers and not as a rate. What
      // sits between them the manga does not say, and neither does this.
      conditions: [
        requiresTarget('La malédiction visée est choisie'),
        effectIsLive('combo-master-decipher', 'Le décodage est terminé'),
      ],
      effects: [
        setEffectState({
          state: 'ACTIVE',
          attributes: { slot: 'TOOL', decodeDays: 365, counterDays: 700 },
        }),
      ],
      cost: { label: 'Jours de contre-mesure', unit: 'day' },
      hint: 'Décodage 365 j · contre-mesure 700 j — les seules durées données',
    },

    'affected-users': {
      label: 'Alarme AFFECTED USERS',
      evidence: shown('ch. 415 — le triangle d’alerte et la liste des co-affectés'),
      // Fires on any concealed Nen attack aimed at him — curse, disease,
      // staged manipulation — and lists whoever else carries the same thing.
      // An aura signature it cannot read is shown as a question mark rather
      // than guessed at, which is the console being honest in the same way the
      // archive is.
      effects: [
        knowledgeGrant({
          factId: (ctx) => `affected:${param(ctx, 'attackId') ?? 'unknown'}`,
          state: 'KNOWN',
        }),
      ],
      hint: 'Portrait et code (px4098) · « ? » pour une signature masquée',
    },

    'cast-while-locked': {
      label: 'Lancer un autre hatsu pendant un travail',
      refusal:
        'Pendant un déchiffrage ou une fabrication, Furykov ne lance rien d’autre : le portable tient la totalité de son aura.',
    },

    // A refusal rather than a hypothesis, and the distinction matters: a
    // hypothesis is a claim about the ability that the walk offers off the
    // canon branch, and this is a claim about the *archive* — that it gives
    // three durations and no fourth. There is nothing here to promote if a
    // later chapter says more; there is only a number that does not exist.
    'guess-between-the-numbers': {
      label: 'Estimer une durée non donnée',
      refusal:
        'Le canon ne donne que trois durées : ≈ 10 j, 365 j et 700 j. Une courbe tracée entre elles serait une cadence inventée pour une capacité dont la cadence n’est jamais énoncée.',
    },
  },

  ui: { componentKey: 'ComboMasterInteraction' },

  interactionManifest: buildManifest('combo-master', {
    inputMode: 'CLICK',
    allowedTargets: ['CHARACTER', 'OBJECT'],
    overlays: ['AURA'],
    entryActions: ['conjure'],
    requiredState: ['isConscious', 'canUseNen'],
    perspectiveTransition: {
      canChangeBody: false,
      canChangeConsciousness: false,
      canFollowAura: false,
    },
    customComponent: 'ComboMasterInteraction',
  }),
})

/** How many co-presence days each attested reading takes. Three, and no more. */
export const COMBO_MASTER_DAYS = {
  /** A prince's Guardian Spirit Beast, ch. 413. */
  guardianBeast: 10,
  /** Beyond's sacrificial curse, decoded — ch. 415. */
  decodeCurse: 365,
  /** And countered. The second number of the same panel. */
  counterCurse: 700,
} as const

/** A guard against a fourth number sneaking in beside the three attested ones. */
export const COMBO_MASTER_ATTESTED = Object.values(COMBO_MASTER_DAYS)
