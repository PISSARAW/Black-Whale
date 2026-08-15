/**
 * Captures the stage without asking `html-to-image` to read the live WebGL
 * canvas synchronously.
 *
 * Its canvas cloning path calls `toDataURL()`. On a Retina-sized WebGL buffer
 * that stalls Chromium's GPU compositor hard enough for macOS to expose other
 * windows while the capture is made. The scene already has an asynchronous
 * `toBlob()` path, so the HUD is rasterised separately and composited over it.
 */
export async function captureStageWithHud(
  stage: HTMLElement,
  sceneBlob: Blob,
): Promise<Blob | null> {
  const sceneCanvas = stage.querySelector('canvas')
  if (!(sceneCanvas instanceof HTMLCanvasElement)) return null

  const scene = await createImageBitmap(sceneBlob)
  const sceneShell = sceneCanvas.parentElement
  const previousBackground = sceneShell?.style.getPropertyValue('background-color') ?? ''
  const previousPriority = sceneShell?.style.getPropertyPriority('background-color') ?? ''

  try {
    // The shell's black background normally sits behind the WebGL canvas. Once
    // that canvas is filtered out it would instead cover the scene composited
    // below, so make only the cloned HUD layer transparent.
    sceneShell?.style.setProperty('background-color', 'transparent', 'important')

    const { toCanvas } = await import('html-to-image')
    const cssWidth = Math.max(1, sceneCanvas.clientWidth)
    const pixelRatio = scene.width / cssWidth
    const hud = await toCanvas(stage, {
      cacheBust: false,
      pixelRatio,
      backgroundColor: 'transparent',
      filter: (node) => node !== sceneCanvas,
    })

    const output = document.createElement('canvas')
    output.width = hud.width
    output.height = hud.height
    const context = output.getContext('2d')
    if (!context) return null

    context.drawImage(scene, 0, 0, output.width, output.height)
    context.drawImage(hud, 0, 0)
    return await new Promise<Blob | null>((resolve) => output.toBlob(resolve, 'image/png'))
  } finally {
    scene.close()
    if (sceneShell) {
      if (previousBackground) {
        sceneShell.style.setProperty('background-color', previousBackground, previousPriority)
      } else {
        sceneShell.style.removeProperty('background-color')
      }
    }
  }
}
