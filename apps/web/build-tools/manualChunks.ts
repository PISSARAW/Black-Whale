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

function clashChunkName(id: string): string | undefined {
  if (
    /\/fighting\/(?:fightClock|formats|health|towerJudging|preparationTuning|fightStyles\w*|styleMatchups\w*|roster(?:ThirdWave|FourthWave|CombatCompletion)?)\.ts$/.test(
      id,
    )
  )
    return 'clash-style-catalogues'
  if (
    /\/fighting\/(?:movesetWave\w+|movesetRosterFinal|movesetFactory|billSupportTuning|secretWindowListeningMove|kallutoTuning|(?:phinks|longhi|voconte|parallelFuture|kurapika|machi|kalluto|bill|leorio|musse|mizaistom|padaille|rihan|feitan)Moveset|bonolenovMovesetTuning|retrospectiveTypes|deviceTypes|bungeeTypes|battleCantabileTypes|lynchTypes|melodyTuning|predatorTuning|crossGameTuning|combatProperties|techniqueCatalogue)\.ts$/.test(
      id,
    )
  )
    return 'clash-move-catalogues'
  if (/\/fighting\/arenaTechnique(?:Types|sFirst|sSecond)\.ts$/.test(id))
    return 'clash-arena-catalogues'

  if (/\/fighting\/duelCombo(?:\w*(?:Profiles|Lessons)|Grammar|DerivedGrammar)\.ts$/.test(id))
    return 'clash-combo-catalogues'
  if (
    /\/fighting\/(?:nenCanon(?:First|Second)?|nenCatalogue\.gen|(?:benjamin|chrollo|biohazard|bonolenov)Canon)\.ts$/.test(
      id,
    )
  )
    return 'clash-nen-canon'
  if (
    /\/fighting\/(?:easterEggAuthoring|fightPose|fightStanceParts|kameos\/expressionProfiles|easterEggRoster(?:One|Two|Three|Four)|rosterChoreography(?:First|Second)|fightStancesRoster|fightExpressionProfiles)\.ts$/.test(
      id,
    )
  )
    return 'clash-presentation-catalogues'
  if (
    /\/fighting\/cinematic(?:Troupe|Royal|Control|Support|Object|Movement|Kurapika|Nen)Rules\.ts$/.test(
      id,
    )
  )
    return 'clash-camera-catalogues'
  if (
    /\/fighting\/(?:arenaMap|dowsingMap(?:Ai|Body|Matter|Options|Presentation|Types)?)\.ts$/.test(
      id,
    )
  )
    return 'clash-map-location'
  if (/\/fighting\/kalluto(?:Gather|StoredPaper|CopyKit)\.ts$/.test(id))
    return 'clash-paper-inventory'
  if (/\/fighting\/[^/]+Options\.ts$/.test(id)) return 'clash-arsenal-options'
  return undefined
}
