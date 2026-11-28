import { parsePathname } from '$lib/i18n'
import { diningVisitUrl } from '$lib/tour/diningVisit'
import { tserriednichRouteUrl } from '$lib/tour/tserriednichRoute'
import type { MangaView } from '$lib/tour/mangaViewModel'

interface TouristControlsOptions {
  view: MangaView | null
  french: boolean
  princeLabel: string
  url: () => URL
  openUrl: (url: URL) => void
  apply: (view: MangaView) => void
  screenshot: () => (() => Promise<Blob | null>) | null
  save: (blob: Blob) => void
}

function mangaAngleLabel(view: MangaView, french: boolean): string {
  const label = french ? view.labelFr : view.label
  const volume = view.volume ? `${french ? 'tome' : 'vol.'} ${view.volume}, ` : ''
  const pages = view.pages ? `, p. ${view.pages}` : ''
  return `${label} — ${volume}${french ? 'chap.' : 'ch.'} ${view.chapter}${pages}`
}

function openAngle(view: MangaView, options: TouristControlsOptions): void {
  const url = new URL(options.url())
  if (url.searchParams.get('mangaView') === view.id) return options.apply(view)
  url.searchParams.delete('deck')
  url.searchParams.delete('eventId')
  url.searchParams.set('space', view.spaceId)
  url.searchParams.set('mangaView', view.id)
  options.openUrl(url)
}

async function takePhoto(options: TouristControlsOptions, includeHud: boolean): Promise<void> {
  const element = includeHud ? document.getElementById('tour-stage-container') : null
  if (includeHud && !element) return
  const screenshot = options.screenshot()
  if (!screenshot) return
  const scene = await screenshot()
  if (!scene) return
  if (!element) return options.save(scene)
  const { captureStageWithHud } = await import('$lib/tour/hudCapture')
  const photo = await captureStageWithHud(element, scene)
  if (photo) options.save(photo)
}

export function createTouristControls(options: TouristControlsOptions) {
  const { view, french, princeLabel } = options
  const angle = view
    ? {
        mangaViewLabel: mangaAngleLabel(view, french),
        mangaViewButtonLabel: view.id === 'royal-liner-prince-view' ? princeLabel : undefined,
        onJumpToAngle: () => openAngle(view, options),
      }
    : {}
  return {
    available: true,
    ...angle,
    onTakePhoto: () => takePhoto(options, false),
    onTakePhotoWithHud: () => takePhoto(options, true),
  }
}

export function tserriednichVisitHref(current: URL): string {
  const url = tserriednichRouteUrl(current)
  return `${parsePathname(url.pathname).path}${url.search}`
}

export function diningVisitHref(current: URL): string {
  return `/tour${diningVisitUrl(current).search}#tour-stage-container`
}
