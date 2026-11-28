import type { Object3D, PerspectiveCamera, Scene, Vector3 } from 'three'
import { OWL_FILM_SECONDS } from '$lib/tour/cast/kinds'

interface OwlFilmOptions<Deck> {
  scene: Scene
  camera: () => PerspectiveCamera
  deck: (id: string) => Deck
  active: () => Deck | null
  retained: (deck: Deck) => boolean
  owl: () => { position: Vector3; tierId: string } | null
}

/**
 * Secret Window's film: where the bird was, and the playback of it.
 *
 * The owl is materialized for twenty seconds and hands back the last
 * ten, so what the walk has to keep is the bird's own path — sampled on
 * the same tenth of a second the visitor's is, and for the same reason:
 * everything else in the scene is a function of the clock and can simply
 * be run again, and this is not. The playback is a third camera walking
 * that path, inset in the corner exactly as the eye's feed is.
 */
export function createTourOwlFilm<Deck extends { root: Object3D }>(options: OwlFilmOptions<Deck>) {
  let filmCamera: PerspectiveCamera | null = null
  let filmDeck: Deck | null = null
  const filmTrack: { at: number; where: [number, number]; y: number; tierId: string }[] = []
  let showing: { through: number; frames: typeof filmTrack } | null = null
  let owlWasUp = false
  let sinceFilmSample = 0

  /**
   * Where the bird is this tenth of a second, kept for the last ten.
   *
   * Read off the apparition rather than off the world, because the world
   * only knows which room it is in: what the film is worth is the flight,
   * and the flight is the drift the scene gives it inside that room.
   */
  function recordTheOwl(clock: number, delta: number) {
    sinceFilmSample += delta
    if (sinceFilmSample < 0.1) return
    sinceFilmSample = 0
    const bird = options.owl()
    if (!bird) return
    filmTrack.push({
      at: clock,
      where: [bird.position.x, bird.position.z],
      y: bird.position.y,
      tierId: bird.tierId,
    })
    while (filmTrack.length && filmTrack[0].at < clock - OWL_FILM_SECONDS) filmTrack.shift()
  }

  /** Takes the film off the bird that has just gone, and starts it running. */
  function startFilm() {
    endFilm()
    if (!filmTrack.length) return
    const frames = [...filmTrack]
    filmTrack.length = 0

    filmCamera = options.camera()
    // The deck it was flying over has to be in the scene to be filmed on,
    // however far from the visitor's own it is — the same arrangement the
    // eye's feed uses, and it is taken away again when the film ends.
    const built = options.deck(frames[frames.length - 1].tierId)
    if (built !== options.active()) {
      options.scene.add(built.root)
      filmDeck = built
    }
    showing = { through: 0, frames }
  }

  /** Puts the film away: the camera, and the deck it was shown against. */
  function endFilm() {
    if (filmDeck) {
      if (filmDeck !== options.active() && !options.retained(filmDeck)) {
        options.scene.remove(filmDeck.root)
      }
      filmDeck = null
    }
    filmCamera = null
    showing = null
  }

  /**
   * The playback, walked at the speed it was recorded.
   *
   * Ten seconds, and then the corner goes back to being the corner. The
   * camera looks the way the bird was going, which is the nearest the walk
   * can get to what a bird was looking at.
   */
  function runFilm(delta: number) {
    if (!showing || !filmCamera) return
    showing.through += delta
    if (showing.through >= OWL_FILM_SECONDS) {
      endFilm()
      return
    }
    const frames = showing.frames
    const wanted = frames[0].at + showing.through
    let index = frames.findIndex((frame) => frame.at >= wanted)
    if (index < 0) index = frames.length - 1
    const later = frames[index]
    const earlier = frames[Math.max(0, index - 1)]
    const span = later.at - earlier.at || 1
    const along = Math.min(1, Math.max(0, (wanted - earlier.at) / span))
    const x = earlier.where[0] + (later.where[0] - earlier.where[0]) * along
    const z = earlier.where[1] + (later.where[1] - earlier.where[1]) * along
    filmCamera.position.set(x, earlier.y + (later.y - earlier.y) * along, z)
    // Facing the way it was flying, and facing the room when it was still.
    const ahead = frames[Math.min(frames.length - 1, index + 4)]
    const dx = ahead.where[0] - x
    const dz = ahead.where[1] - z
    filmCamera.rotation.set(0, 0, 0)
    filmCamera.rotateY(Math.hypot(dx, dz) > 0.15 ? Math.atan2(dx, dz) : showing.through * 0.6)
  }

  return {
    get deck() {
      return filmDeck
    },
    get camera() {
      return filmCamera
    },
    get showing() {
      return Boolean(showing)
    },
    tick(clock: number, delta: number, owlUp: boolean) {
      if (owlUp) recordTheOwl(clock, delta)
      if (owlWasUp && !owlUp) startFilm()
      owlWasUp = owlUp
      runFilm(delta)
    },
  }
}
