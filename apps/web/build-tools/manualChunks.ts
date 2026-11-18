import { fragmentChunkName } from './jsonFragments'

/** Cache boundaries follow data, locale dictionaries and Three.js subsystems. */
export function manualChunks(id: string): string | undefined {
  const fragment = fragmentChunkName(id)
  if (fragment) return fragment
  if (/\/i18n\/messages\/(en|fr)\.ts$/.test(id))
    return `interface-${id.endsWith('/fr.ts') ? 'fr' : 'en'}`
  const clash = clashChunkName(id)
  if (clash) return clash
  if (!id.includes('/three/src/')) return undefined
  if (/\/Three(?:\.Core)?\.js$/.test(id)) return undefined
  return threeChunkName(id)
}

function threeChunkName(id: string): string {
  if (
    /\/renderers\/shaders\/(UniformsUtils\.js|ShaderChunk\/default_(vertex|fragment)\.glsl\.js)$/.test(
      id,
    )
  )
    return 'three-foundation'
  if (id.includes('/renderers/shaders/')) return 'three-shaders'
  if (/\/renderers\/(WebGLRenderer\.js|webgl\/|webxr\/WebXRManager\.js)/.test(id))
    return 'three-renderer'
  return 'three-foundation'
}

const CLASH_CHUNK_RULES: readonly (readonly [RegExp, string])[] = [
  [/\/fighting\/ghostwriterScenarioData\.ts$/, 'clash-fortune-scenarios'],
  [/\/fighting\/stageCatalogue\.ts$/, 'clash-stage-catalogue'],
  [
    /\/fighting\/(?:en\/profiles|physicalBodyMap|bodyguardFirearms|luiniKnife|illumiNeedleMatter|gumResuscitationRules)\.ts$/,
    'clash-physical-rules',
  ],
  [
    /\/fighting\/(?:fightClock|formats|health|towerJudging|preparationTuning|preparationResources|trainingTypes|fightStyles\w*|styleMatchups\w*|roster(?:ThirdWave|FourthWave|CombatCompletion)?)\.ts$/,
    'clash-style-catalogues',
  ],
  [
    /\/fighting\/(?:movesetWave\w+|movesetRosterFinal|movesetFactory|rosterCombatRoutes|billSupportTuning|secretWindowListeningMove|kallutoTuning|(?:phinks|longhi|voconte|parallelFuture|kurapika|machi|kalluto|bill|leorio|musse|mizaistom|padaille|rihan|feitan|camilla|hisoka|gel|chrollo|theta)Moveset|bonolenovMovesetTuning|retrospectiveTypes|deviceTypes|bungeeTypes|battleCantabileTypes|lynchTypes|melodyTuning|predatorTuning|crossGameTuning|combatProperties|techniqueCatalogue)\.ts$/,
    'clash-move-catalogues',
  ],
  [/\/fighting\/arenaTechnique(?:Types|sFirst|sSecond)\.ts$/, 'clash-arena-catalogues'],
  [
    /\/fighting\/kameos\/(?:catalogue|comboLessonCatalogue|comboRosterRoutes)\.ts$/,
    'clash-kameo-catalogues',
  ],
  [
    /\/fighting\/duelCombo(?:\w*(?:Profiles|Lessons)|Grammar|DerivedGrammar)\.ts$/,
    'clash-combo-catalogues',
  ],
  [
    /\/fighting\/(?:nenCanon(?:First|Second)?|nenCatalogue\.gen|(?:benjamin|chrollo|biohazard|bonolenov|illumi)Canon)\.ts$/,
    'clash-nen-canon',
  ],
  [
    /\/fighting\/(?:easterEggAuthoring|fightPose|fightStanceParts|kameos\/expressionProfiles|easterEggRoster(?:One|Two|Three|Four)|rosterChoreography(?:First|Second)|fightStancesRoster|fightExpressionProfiles|rosterTechniqueGestures|ghostwriterPresentation)\.ts$/,
    'clash-presentation-catalogues',
  ],
  [
    /\/fighting\/cinematic(?:Troupe|Royal|Control|Support|Object|Movement|Kurapika|Nen)Rules\.ts$/,
    'clash-camera-catalogues',
  ],
  [
    /\/fighting\/(?:arenaMap|dowsingMap(?:Ai|Body|Matter|Options|Presentation|Types)?)\.ts$/,
    'clash-map-location',
  ],
  [/\/fighting\/kalluto(?:Gather|StoredPaper|CopyKit)\.ts$/, 'clash-paper-inventory'],
  [/\/fighting\/[^/]+Options\.ts$/, 'clash-arsenal-options'],
]

function clashChunkName(id: string): string | undefined {
  return CLASH_CHUNK_RULES.find(([pattern]) => pattern.test(id))?.[1]
}
