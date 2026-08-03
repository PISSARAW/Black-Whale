/**
 * The post-processing pass, named once so the walk does not name it five times.
 *
 * `ShaderPass` lives under `three/examples`, which is a deep path with a
 * runtime cost attached: every pass in the tour is imported lazily so that a
 * visitor who never opens the walk never downloads a composer. A *type* import
 * has no such cost — it is erased — so this is where the deep path is written,
 * and everything else says `PostPass`.
 *
 * Everything the walk does to a pass is add it, flip `enabled`, and write a
 * uniform, so this stays the real class rather than a structural stand-in: the
 * composer type-checks what it is handed, and a hand-rolled interface would
 * only mean casting at every `addPass`.
 */
export type { ShaderPass as PostPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
