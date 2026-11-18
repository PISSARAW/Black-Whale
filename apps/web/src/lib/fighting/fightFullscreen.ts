type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => void | Promise<void>
}
type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => void | Promise<void>
}
type LandscapeOrientation = ScreenOrientation & { lock?: (mode: 'landscape') => Promise<void> }

export function isFightFullscreen() {
  const doc = document as FullscreenDocument
  return Boolean(doc.fullscreenElement || doc.webkitFullscreenElement)
}

/** Call directly from a tap: browsers require transient user activation. */
export async function enterFightFullscreen(target: HTMLElement): Promise<'native' | 'viewport'> {
  try {
    if (!isFightFullscreen()) {
      const element = target as FullscreenElement
      if (element.requestFullscreen) await element.requestFullscreen({ navigationUI: 'hide' })
      else if (element.webkitRequestFullscreen) await element.webkitRequestFullscreen()
      else return 'viewport'
    }
  } catch {
    return 'viewport'
  }
  try {
    await (screen.orientation as LandscapeOrientation | undefined)?.lock?.('landscape')
  } catch {
    // Orientation lock is optional, including in native fullscreen on iPad.
  }
  return 'native'
}

export async function exitFightFullscreen() {
  const doc = document as FullscreenDocument
  if (!isFightFullscreen()) return
  if (doc.exitFullscreen) await doc.exitFullscreen()
  else await doc.webkitExitFullscreen?.()
}

/** The viewport fallback also works on iPhone where arbitrary fullscreen is unavailable. */
export function mountFightViewport(node: HTMLElement) {
  const position = { x: window.scrollX, y: window.scrollY }
  document.documentElement.classList.add('clash-immersive')
  return {
    destroy() {
      document.documentElement.classList.remove('clash-immersive')
      if (document.fullscreenElement === node) void exitFightFullscreen().catch(() => {})
      screen.orientation?.unlock?.()
      window.scrollTo(position.x, position.y)
    },
  }
}
