import { untrack } from 'svelte'
import { mangaViewById, type MangaView } from './mangaViews'
import type { Ship } from './blueprint'
import type { TourNavigationState } from './pageNavigationState.svelte'
import type { Space, Vec2 } from './types'

export function initialTierForRequest(ship: Ship, url: URL): string {
  const view = mangaViewById(url.searchParams.get('mangaView'))
  const space = ship.spaces.get(url.searchParams.get('space') ?? '')
  const deck = url.searchParams.get('deck')
  return (
    ship.spaces.get(view?.spaceId ?? '')?.tierId ??
    space?.tierId ??
    (deck && ship.plans.has(deck) ? deck : ship.tiers[0].id)
  )
}

type CameraArrival = TourNavigationState & { jumpCameraDistance?: number | null }
type CameraView = MangaView & { cameraDistance?: number }

export function applyMangaView(navigation: CameraArrival, view: CameraView): void {
  navigation.jumpTo = view.spaceId
  navigation.jumpAt = view.at
  navigation.jumpHeading = view.heading
  navigation.jumpPitch = view.pitch
  navigation.jumpEyeHeight = view.eyeHeight ?? null
  navigation.jumpCameraDistance = view.cameraDistance ?? null
  navigation.jumpVisibleSpaceIds = view.visibleSpaceIds ?? null
}

/** The existing URL-to-camera effect, kept outside the page's presentation. */
export function watchMangaRequest(options: {
  navigation: TourNavigationState
  read: () => {
    space: Space | null
    deck: string | null
    view: MangaView | null
    arrival?: { at: Vec2; heading: number } | null
  }
  onView: (view: MangaView) => void
}): void {
  $effect(() => {
    const { space, deck, view, arrival } = options.read()
    untrack(() => {
      if (view) {
        options.navigation.honor(space, deck)
        options.onView(view)
        applyMangaView(options.navigation, view)
      } else if (space && arrival) {
        options.navigation.goToSpace(space, arrival.at)
        options.navigation.jumpHeading = arrival.heading
        options.navigation.jumpPitch = 0
      } else {
        options.navigation.honor(space, deck)
      }
    })
  })
}
