import { fragmentChunkName } from './jsonFragments'

/** Cache boundaries follow data, locale dictionaries and Three.js subsystems. */
export function manualChunks(id: string): string | undefined {
  const fragment = fragmentChunkName(id)
  if (fragment) return fragment
  if (/\/i18n\/messages\/(en|fr)\.ts$/.test(id))
    return `interface-${id.endsWith('/fr.ts') ? 'fr' : 'en'}`
  if (/\/fighting\/duelCombo\w*(?:Profiles|Lessons)\.ts$/.test(id)) return 'clash-combo-catalogues'
  if (
    /\/fighting\/(?:easterEggRoster(?:One|Two|Three|Four)|rosterChoreography(?:First|Second)|fightStancesRoster|fightExpressionProfiles)\.ts$/.test(
      id,
    )
  )
    return 'clash-presentation-catalogues'
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
