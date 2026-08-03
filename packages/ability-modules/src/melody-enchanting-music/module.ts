import {
  asserted,
  auraModifier,
  buildManifest,
  canUseNen,
  defineAbility,
  isConscious,
  knowledgeGrant,
  listParam,
  param,
  requiresParameter,
  setEffectState,
  shown,
  zone,
} from '@black-whale/ability-sdk'

/**
 * Enchanting Music — Melody
 *
 * Two halves that the engine models differently. The flute is an aura effect
 * over a room; her absolute hearing is not an ability at all but a permanent
 * knowledge source — she hears heartbeats and lies, which is why her view of the
 * Kacho/Fugetsu escape (ch. 390) is the richest perspective of the banquet: she
 * knows things the map cannot show.
 */
export const melodyEnchantingMusic = defineAbility({
  id: 'melody-enchanting-music',
  name: 'Enchanting Music',
  owner: 'melody',
  category: 'specialist',

  site: {
    kind: 'melody',
    instruction:
      'Play three notes and every other section stops noticing anything for three minutes, however many of them are listening.',
    rule: 'Music carries aura directly into listeners, soothing them and shaping their emotional state.',
    cost: 'Continuous performance and hearing',
    color: '#70c6d7',
    action: 'Play the first note',
  },

  conditions: [canUseNen()],

  targets: [zone()],

  cost: { label: 'Interprétation continue — l’auditeur doit entendre', unit: 'souffle' },

  actions: {
    play: {
      label: 'Jouer de la flûte',
      evidence: shown('ch. 45 — la flûte apaise ceux qui l’entendent'),
      conditions: [isConscious(), requiresParameter('locationId', 'Une pièce est choisie')],
      effects: [
        auraModifier({
          scope: 'room',
          mood: 'calm',
          rules: ['Apaise et capte l’attention des auditeurs présents.'],
        }),
      ],
    },

    listen: {
      label: 'Écouter (ouïe absolue)',
      evidence: shown('ch. 45 — elle entend les battements et les émotions'),
      // Passive: no Nen required, and it works on whoever shares her room.
      effects: [
        (ctx) =>
          listParam(ctx, 'audibleSubjectIds').flatMap((subjectId) => [
            ...knowledgeGrant({
              factId: `emotion:${subjectId}`,
              state: 'KNOWN',
              confidence: 0.9,
            })(ctx),
            ...knowledgeGrant({
              factId: `truthfulness:${subjectId}:${param(ctx, 'statementId') ?? 'statement'}`,
              // A heartbeat is a strong hint, not a confession.
              state: 'SUSPECTED',
              confidence: 0.6,
            })(ctx),
          ]),
      ],
    },

    'hear-a-lie': {
      label: 'Entendre un mensonge',
      // The heartbeat is what her ear reads, so a lie arrives as a strong
      // suspicion and never as a confession.
      evidence: shown('ch. 45 — le battement trahit le mensonge'),
      effects: [
        knowledgeGrant({
          factId: (ctx) => `lie:${param(ctx, 'subjectId') ?? 'subject'}`,
          state: 'SUSPECTED',
          confidence: 0.7,
        }),
      ],
    },

    'listen-through-a-wall': {
      label: 'Écouter à travers une cloison',
      evidence: asserted('son ouïe porte au-delà de ce que la carte montre'),
      effects: [
        knowledgeGrant({
          factId: (ctx) => `heard:${param(ctx, 'locationId') ?? 'room'}`,
          state: 'BELIEVED',
          confidence: 0.6,
        }),
      ],
    },

    'harm-with-the-flute': {
      label: 'Blesser par la mélodie',
      refusal: 'Enchanting Music apaise et capte l’attention : elle ne blesse pas',
    },

    stop: {
      label: 'Cesser de jouer',
      evidence: asserted('la pièce s’arrête quand elle cesse de jouer'),
      effects: [setEffectState({ state: 'ENDED' })],
    },
  },

  ui: { componentKey: 'MelodyHearing' },

  interactionManifest: buildManifest('melody-enchanting-music', {
    inputMode: 'HOLD',
    allowedTargets: ['LOCATION', 'CHARACTER'],
    overlays: ['AURA', 'RANGE'],
    entryActions: ['play', 'listen'],
    requiredState: ['canUseNen'],
    customComponent: 'MelodyHearing',
  }),
})
