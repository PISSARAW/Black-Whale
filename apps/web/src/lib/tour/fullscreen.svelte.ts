/**
 * Full screen, as the walk means it.
 *
 * Not a canvas handed to the browser: the reconstruction is a scene *and* the
 * column beside it — the decks and the plan on the walk, the cards and the
 * transcript at Morena's table — and taking the screen has to take both, or it
 * would be a view with no way to act on what is in it.
 *
 * Two rooms of the archive want that now, so the behaviour lives here rather
 * than twice. What each page keeps for itself is its layout: this holds only
 * the two facts every consumer needs — whether the page has the screen, and
 * whether the browser is the one giving it.
 */

/** The class the archive's chrome stands down under. Styled in `app.css`. */
const IMMERSIVE = 'tour-immersive'

export class Fullscreen {
  /** Whether the page has taken the screen, natively or by fixed layout. */
  immersive = $state(false)
  /**
   * Whether the browser actually took the element. A phone has no element full
   * screen to give — `requestFullscreen` is missing on iOS Safari altogether —
   * so the same layout stands on `position: fixed` instead. That one has to be
   * undone by hand: there is no `fullscreenchange` coming for it.
   */
  native = $state(false)

  /**
   * What is handed to the browser is the document rather than the page,
   * because the Nen dock is the archive's and hangs outside the route. Full
   * screen on a route's own grid would take the room and leave the aura at the
   * door.
   */
  async toggle() {
    if (this.immersive) {
      if (this.native && document.fullscreenElement) {
        try {
          await document.exitFullscreen()
        } catch {
          // Refused: fall through and drop the layout ourselves.
        }
      }
      this.native = false
      this.immersive = false
      return
    }

    this.immersive = true
    if (document.fullscreenEnabled && document.documentElement.requestFullscreen) {
      try {
        await document.documentElement.requestFullscreen()
        this.native = true
      } catch {
        this.native = false
      }
    }
  }

  /**
   * The document-level half, for an `$effect` in the consuming page: the
   * archive's chrome stands down while the room has the screen, and Esc, F11
   * and the window chrome all leave full screen without asking the page, so the
   * browser stays the authority on whether we are still in it.
   */
  watch() {
    const root = document.documentElement
    root.classList.toggle(IMMERSIVE, this.immersive)

    const sync = () => {
      if (this.native && !document.fullscreenElement) {
        this.native = false
        this.immersive = false
      }
    }
    document.addEventListener('fullscreenchange', sync)

    return () => {
      root.classList.remove(IMMERSIVE)
      document.removeEventListener('fullscreenchange', sync)
    }
  }

  /**
   * Leaving the route leaves full screen with it: the room asked for the
   * screen, and no other page of the archive did.
   */
  leave() {
    if (this.native && document.fullscreenElement) void document.exitFullscreen()
  }
}
