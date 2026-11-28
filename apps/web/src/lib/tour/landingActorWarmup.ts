import type { Object3D } from 'three'
import type { Apparition } from './apparitions'
import type { RenderedApparition } from './ApparitionView'
import { humanStateKey } from './humanFigure'

/** Warming and live synchronisation must agree on every attribute that changes the rig. */
export function apparitionKey(seen: Apparition, sight: string): string {
  return `${seen.kind}|${seen.variant ?? ''}|${seen.carried ?? ''}|${seen.colour}|${seen.size}|${seen.hidden}|${seen.pair?.spaceId ?? ''}|${seen.climb ?? ''}|${seen.face ?? ''}|${humanStateKey(seen)}|sight:${sight}`
}

type PreparedActor = RenderedApparition & { humanLod?: { far: Object3D } }

/** Build one rig at a time, and let the renderer upload it in a separate step. */
export function* landingActorSteps(options: {
  actors: readonly Apparition[]
  prepare: (seen: Apparition) => PreparedActor | null
}): Generator<Object3D | undefined, void> {
  for (const seen of options.actors) {
    if (seen.kind !== 'avatar' || seen.hidden) continue
    yield
    const actor = options.prepare(seen)
    if (!actor) continue

    const { root, humanLod } = actor
    root.position.set(seen.at[0], seen.y, seen.at[1])
    const far = humanLod?.far
    const wasVisible = far?.visible
    if (far) far.visible = true
    try {
      yield root
    } finally {
      if (far) far.visible = wasVisible ?? false
    }
  }
}
