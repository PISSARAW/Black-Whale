import {
  attributeCounter,
  belowCapacity,
  buildManifest,
  canUseNen,
  curse,
  defineAbility,
  effect,
  effectIsLive,
  isConscious,
  masked,
  numberParam,
  person,
  requiresTarget,
  setEffectState,
  spawnNenEntity,
  unrevealed,
} from '@black-whale/ability-sdk'

/** Canon numbers: four snakes, 44 s each, 11 s when all four bite at once. */
const SNAKE_COUNT = 4
const SECONDS_PER_SNAKE = 44
const SECONDS_WITH_ALL_SNAKES = 11
/** The victim is chosen among ten people in range. */
const CANDIDATE_POOL = 10

/**
 * Silent Majority — an unidentified Heil-Ly member
 *
 * The owner is genuinely unknown in canon, and the module says so rather than
 * inventing one: the ability sheet reads "utilisateur non identifié" until the
 * manga decides. What the engine can already do is narrow the suspects — cross
 * presences with attacks and the deduction falls out of the world state.
 */
export const silentMajority = defineAbility({
  id: 'silent-majority',
  name: 'Silent Majority',
  owner: 'silent-majority-user',
  category: 'conjurer',

  site: {
    kind: 'snakes',
    instruction:
      'Mark ten page targets to conceal the user among them; four snakes then drain the next selected victim while the others remain suspects.',
    rule: 'The curse needs a ten-person range, kills through four snakes and rebounds if dismissed without a victim.',
    cost: 'Ten nearby targets · one mandatory victim',
    color: '#8765aa',
    action: 'Build the ten-target field',
  },

  arena: {
    effect: 'barrage',
    cost: 20,
    persistent: true,
    condition: 'puppet-and-ten-suspects',
    risk: 'user-damage-on-failure',
    mechanic: 'ambush',
  },

  conditions: [canUseNen(), isConscious()],

  // The user is a placeholder character until canon names them.
  notes: [unrevealed('silent-majority-owner', 'L’utilisateur n’est pas identifié par le canon')],

  targets: [person()],

  actions: {
    summon: {
      label: 'Invoquer le pantin',
      effects: [
        spawnNenEntity({
          id: (ctx) => `silent-majority-puppet-${ctx.actorId}`,
          kind: 'NEN_ENTITY',
          label: 'Pantin de Silent Majority',
          metadata: { visibleTo: 'owner-only', snakes: SNAKE_COUNT },
        }),
        // Visible to its user alone — the snakes, however, are not masked.
        masked(
          effect({
            kind: 'CUSTOM',
            discriminator: 'puppet',
            attributes: {
              snakeCount: SNAKE_COUNT,
              secondsPerSnake: SECONDS_PER_SNAKE,
              secondsWithAllSnakes: SECONDS_WITH_ALL_SNAKES,
              rules: [
                'La victime est choisie parmi dix personnes à portée.',
                'Quatre serpents, 44 s par serpent, 11 s à quatre.',
                'Les serpents disparaissent hors de portée du Nen.',
                'Une désactivation prématurée retourne la malédiction sur l’utilisateur.',
              ],
            },
          }),
        ),
      ],
    },

    bite: {
      label: 'Lancer les serpents',
      conditions: [
        requiresTarget('Une victime est désignée'),
        belowCapacity(
          'candidateIndex',
          CANDIDATE_POOL,
          `La victime fait partie des ${CANDIDATE_POOL} personnes à portée`,
        ),
        effectIsLive('effectId', 'Le pantin est invoqué'),
      ],
      effects: [
        attributeCounter({
          attributes: (ctx) => {
            const snakes = numberParam(ctx, 'snakes') ?? 1
            return {
              activeSnakes: snakes,
              drainSecondsRemaining:
                snakes >= SNAKE_COUNT ? SECONDS_WITH_ALL_SNAKES : SECONDS_PER_SNAKE / snakes,
            }
          },
        }),
      ],
      cost: {
        label: 'Durée du drain',
        amount: SECONDS_PER_SNAKE,
        unit: 'secondes par serpent',
      },
    },

    'abort-early': {
      label: 'Désactiver prématurément',
      conditions: [effectIsLive('effectId', 'Le pantin est invoqué')],
      effects: [
        setEffectState({ state: 'ENDED', attributes: { abortedEarly: true } }),
        // The curse comes home.
        curse({
          active: true,
          trigger: 'premature-deactivation',
          rules: ['La malédiction se retourne contre l’utilisateur.'],
        }),
      ],
      hint: 'Retourne la malédiction contre l’utilisateur',
    },
  },

  ui: { componentKey: 'SilentMajorityPuppet' },

  interactionManifest: buildManifest('silent-majority', {
    inputMode: 'TARGET_SELECTION',
    allowedTargets: ['CHARACTER'],
    overlays: ['RANGE', 'AURA'],
    entryActions: ['summon'],
    requiredState: ['isConscious', 'canUseNen'],
    customComponent: 'SilentMajorityPuppet',
  }),
})

export const SILENT_MAJORITY_LIMITS = {
  snakeCount: SNAKE_COUNT,
  secondsPerSnake: SECONDS_PER_SNAKE,
  secondsWithAllSnakes: SECONDS_WITH_ALL_SNAKES,
  candidatePool: CANDIDATE_POOL,
}
