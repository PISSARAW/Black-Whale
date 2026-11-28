import { fragmentChunkName } from './jsonFragments'

type ChunkGraph = {
  getModuleIds: () => IterableIterator<string>
  getModuleInfo: (id: string) => { importedIds: readonly string[]; code?: string | null } | null
}

let graphOwner: ChunkGraph['getModuleInfo'] | undefined
let cycleChunks = new Map<string, string>()

/** Cache boundaries follow data, locale dictionaries and Three.js subsystems. */
export function manualChunks(id: string, graph?: ChunkGraph): string | undefined {
  const fragment = fragmentChunkName(id)
  if (fragment) return fragment
  if (id.endsWith('/data/characters/appearance.json')) return 'data-character-appearances'
  if (/\/i18n\/messages\/(en|fr)\.ts$/.test(id))
    return `interface-${id.endsWith('/fr.ts') ? 'fr' : 'en'}`
  if (/\/(?:packages\/nen-engine|node_modules\/@black-whale\/nen-engine)\//.test(id))
    return 'nen-engine'
  if (graph) {
    if (graphOwner !== graph.getModuleInfo) {
      graphOwner = graph.getModuleInfo
      cycleChunks = fightingGraphChunks(graph)
    }
    const cycle = cycleChunks.get(id)
    if (cycle) return cycle
  }
  const clash = clashChunkName(id)
  if (clash) return clash
  if (!id.includes('/three/src/')) return undefined
  if (/\/Three(?:\.Core)?\.js$/.test(id)) return undefined
  return threeChunkName(id)
}

/**
 * Partition the combat graph without creating chunk-level import cycles.
 *
 * Catalogue-based grouping used to place mutually recursive modules in
 * separate files. Rollup could emit those files, but the browser then reached
 * an imported binding before its module had initialized. Strongly connected
 * components stay atomic here; the remaining DAG is packed only with modules
 * at the same dependency depth, so no packed chunk can point back to itself.
 */
function fightingGraphChunks(graph: ChunkGraph): Map<string, string> {
  const modules = [...graph.getModuleIds()].filter((id) => /\/src\/lib\/fighting\/.*\.ts$/.test(id))
  const included = new Set(modules)
  const indexById = new Map<string, number>()
  const lowById = new Map<string, number>()
  const stack: string[] = []
  const stacked = new Set<string>()
  const components: string[][] = []
  let index = 0

  const visit = (id: string) => {
    indexById.set(id, index)
    lowById.set(id, index)
    index += 1
    stack.push(id)
    stacked.add(id)
    for (const dependency of graph.getModuleInfo(id)?.importedIds ?? []) {
      if (!included.has(dependency)) continue
      if (!indexById.has(dependency)) {
        visit(dependency)
        lowById.set(id, Math.min(lowById.get(id)!, lowById.get(dependency)!))
      } else if (stacked.has(dependency)) {
        lowById.set(id, Math.min(lowById.get(id)!, indexById.get(dependency)!))
      }
    }
    if (lowById.get(id) !== indexById.get(id)) return
    const component: string[] = []
    while (stack.length) {
      const member = stack.pop()!
      stacked.delete(member)
      component.push(member)
      if (member === id) break
    }
    component.sort()
    components.push(component)
  }

  for (const id of modules) if (!indexById.has(id)) visit(id)
  const componentByModule = new Map<string, number>()
  components.forEach((component, componentId) => {
    for (const id of component) componentByModule.set(id, componentId)
  })
  const dependencies = components.map(() => new Set<number>())
  components.forEach((component, componentId) => {
    for (const id of component) {
      for (const dependency of graph.getModuleInfo(id)?.importedIds ?? []) {
        const dependencyId = componentByModule.get(dependency)
        if (dependencyId !== undefined && dependencyId !== componentId)
          dependencies[componentId].add(dependencyId)
      }
    }
  })
  const depths = new Map<number, number>()
  const depthOf = (componentId: number): number => {
    const known = depths.get(componentId)
    if (known !== undefined) return known
    const depth =
      1 + Math.max(-1, ...[...dependencies[componentId]].map((dependency) => depthOf(dependency)))
    depths.set(componentId, depth)
    return depth
  }
  components.forEach((_component, componentId) => depthOf(componentId))

  const found = new Map<string, string>()
  const byDepth = new Map<number, number[]>()
  components.forEach((component, componentId) => {
    if (component.length > 1) {
      const anchor = component[0].split('/').at(-1)!.replace(/\.ts$/, '')
      for (const id of component) found.set(id, `clash-runtime-cycle-${anchor}`)
      return
    }
    const depth = depths.get(componentId)!
    byDepth.set(depth, [...(byDepth.get(depth) ?? []), componentId])
  })

  // Source bytes leave room for Rollup helpers and minifier variance under the
  // unchanged 500 kB emitted-code ceiling.
  const TARGET_SOURCE_BYTES = 300_000
  for (const [depth, componentIds] of byDepth) {
    componentIds.sort((left, right) => components[left][0].localeCompare(components[right][0]))
    let bucket = 0
    let bytes = 0
    for (const componentId of componentIds) {
      const id = components[componentId][0]
      const size = graph.getModuleInfo(id)?.code?.length ?? 0
      if (bytes > 0 && bytes + size > TARGET_SOURCE_BYTES) {
        bucket += 1
        bytes = 0
      }
      found.set(id, `clash-runtime-${depth}-${bucket}`)
      bytes += size
    }
  }
  return found
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
    /\/fighting\/(?:en\/profiles|physicalBodyMap|bodyguardFirearms|luiniKnife|illumiNeedleMatter|gumResuscitationRules|sunMoonMarkPoint|leorioAttack)\.ts$/,
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
