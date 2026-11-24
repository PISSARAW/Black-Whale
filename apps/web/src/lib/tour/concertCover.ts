import type { Vector3 } from 'three'
import type { FilmFrame } from './ConcertFilm'
import { isClashConcertActor } from './clashConcertAudience'
import { concertLandscapeHeight, type ConcertLandscapeSpec } from './concertLandscapeWalk'

/** A posed ensemble for the cover, independent of the concert's blocking. */
export function frameConcertCover(
  { camera, actors }: FilmFrame,
  spec: ConcertLandscapeSpec,
  focus: Vector3,
): void {
  const vertical = camera.aspect < 1
  const [x, z] = spec.origin
  const y = spec.floor
  const audience = Object.entries(actors).filter(
    ([id]) => id !== 'cast:melody' && isClashConcertActor(id),
  )
  audience.forEach(([, actor], index) => {
    if (!actor) return
    const columns = vertical ? 6 : 9
    const row = Math.floor(index / columns)
    const column = index % columns
    const offset = (column - (columns - 1) / 2) * (vertical ? 1.01 : 1.28)
    const at = [
      x + offset + (row % 2 ? 0.52 : 0),
      z + 4.6 + row * (vertical ? 1.35 : 2) + Math.abs(offset) * 0.16,
    ] as const
    actor.root.position.set(at[0], concertLandscapeHeight(spec, at) + 0.04, at[1])
    actor.root.rotation.set(0, Math.PI + offset * 0.056, 0)
    if (actor.humanLod) {
      actor.humanLod.near.visible = true
      actor.humanLod.far.visible = false
    }
  })
  if (vertical) {
    camera.position.set(x + 0.15, y + 4.35, z - 4.55)
    focus.set(x + 0.12, y + 3.08, z + 1.2)
    camera.fov = 52
  } else {
    camera.position.set(x + 0.65, y + 4.0, z - 3.35)
    focus.set(x - 0.72, y + 2.68, z + 1.2)
    camera.fov = 46
  }
  camera.lookAt(focus)
  camera.updateProjectionMatrix()
}
