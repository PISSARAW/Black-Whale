import { expect, type Page } from 'playwright/test'
import {
  TOUR_CAMERA_FRAME_EVENT,
  TOUR_CAMERA_TRACE_ATTRIBUTE,
  type TourCameraSample,
} from '../../apps/web/src/lib/components/tour/TourCameraTrace'
import { LOOK_SENSITIVITY } from '../../apps/web/src/lib/tour/sceneOptics'

interface WalkTarget {
  label: string
  at: readonly [number, number]
  spaceId?: string
  tolerance?: number
}

export type TourWalkLeg = WalkTarget | { label: string; yaw: number; destination: string }

interface CameraCapture {
  current: TourCameraSample | null
  frames: TourCameraSample[]
}

declare global {
  interface Window {
    tourCameraCapture: CameraCapture
  }
}

export async function installTourCameraCapture(page: Page): Promise<void> {
  await page.addInitScript((eventName) => {
    window.tourCameraCapture = { current: null, frames: [] }
    // The event belongs to the observed canvas. A capturing listener can be
    // installed before the renderer and does not depend on a mounted component.
    document.addEventListener(
      eventName,
      (event) => {
        const frame = (event as CustomEvent<TourCameraSample>).detail
        window.tourCameraCapture.current = frame
        window.tourCameraCapture.frames.push(frame)
      },
      true,
    )
    localStorage.setItem('black-whale:tour-comfort', JSON.stringify({ quality: 'low' }))
  }, TOUR_CAMERA_FRAME_EVENT)
}

export async function engageTourCamera(page: Page): Promise<void> {
  const canvas = page.locator('#tour-stage-container canvas').first()
  await expect(canvas).toBeVisible({ timeout: 45_000 })
  await canvas.evaluate(
    (element, attribute) => element.setAttribute(attribute, ''),
    TOUR_CAMERA_TRACE_ATTRIBUTE,
  )
  await page.waitForFunction(() => window.tourCameraCapture.current !== null, undefined, {
    timeout: 45_000,
  })
  // Hold a drag so looking also works in headless Chromium without pointer lock.
  await canvas.hover()
  await page.mouse.down()
}

/** Follow the requested points with the same look and walk input the visitor uses. */
export async function walkTour(page: Page, legs: readonly TourWalkLeg[]): Promise<void> {
  await page.evaluate(
    async ({ legs, sensitivity, attribute }) => {
      const capture = window.tourCameraCapture
      const canvas = document.querySelector(`canvas[${attribute}]`)
      if (!(canvas instanceof HTMLCanvasElement))
        throw new Error('The observed tour canvas is missing')
      let movingForward = false
      const forward = (pressed: boolean) => {
        if (movingForward === pressed) return
        movingForward = pressed
        canvas.dispatchEvent(
          new KeyboardEvent(pressed ? 'keydown' : 'keyup', {
            bubbles: true,
            code: 'ArrowUp',
            key: 'ArrowUp',
          }),
        )
      }
      const angleDifference = (target: number, yaw: number) =>
        Math.atan2(Math.sin(target - yaw), Math.cos(target - yaw))
      const look = (turn: number) => {
        canvas.dispatchEvent(
          new MouseEvent('mousemove', {
            bubbles: true,
            movementX: Math.round(-turn / sensitivity),
          }),
        )
      }

      async function until(
        label: string,
        accept: (frame: TourCameraSample) => boolean,
        timeout: number,
      ) {
        const limit = performance.now() + timeout
        let previous: TourCameraSample | null = null
        while (performance.now() < limit) {
          const frame = capture.current
          if (frame && frame !== previous && accept(frame)) return
          previous = frame
          await new Promise(requestAnimationFrame)
        }
        const here = capture.current
        throw new Error(
          `${label} stopped at ${here?.at.join(', ')} in ${here?.spaceId} (yaw ${here?.yaw})`,
        )
      }

      async function aim(yaw: number, label: string) {
        await until(
          `Turn toward ${label}`,
          (frame) => {
            const error = angleDifference(yaw, frame.yaw)
            if (Math.abs(error) <= 0.004) return true
            look(error)
            return false
          },
          12_000,
        )
      }

      async function approach(leg: WalkTarget) {
        const [x, z] = leg.at
        const tolerance = leg.tolerance ?? 0.18
        let previous = capture.current!.at
        await until(
          leg.label,
          (frame) => {
            const [dx, dz] = [frame.at[0] - x, frame.at[1] - z]
            const remaining = Math.hypot(dx, dz)
            if (remaining <= tolerance) return true
            const step = distanceBetween(previous, frame.at)
            previous = frame.at
            const error = angleDifference(Math.atan2(dx, dz), frame.yaw)
            look(error)
            // Brake close to a waypoint so a long rendered frame cannot carry
            // the visitor through a narrow turn at full walking speed.
            forward(Math.abs(error) < 0.15 && step <= Math.max(tolerance / 2, remaining / 3))
            return false
          },
          30_000,
        )
      }

      function distanceBetween(a: TourCameraSample['at'], b: TourCameraSample['at']) {
        return Math.hypot(a[0] - b[0], a[1] - b[1])
      }

      async function settle(label: string) {
        let previous = capture.current!
        await until(
          `Stop after ${label}`,
          (frame) => {
            if (frame === previous) return false
            const settled = distanceBetween(previous.at, frame.at) < 0.008
            previous = frame
            return settled
          },
          10_000,
        )
      }

      for (const leg of legs) {
        try {
          if ('at' in leg) await approach(leg)
          else {
            await aim(leg.yaw, leg.label)
            forward(true)
            // The spiral alone spans four and a half turns. Software rendering
            // advances the walking simulation more slowly than the wall clock.
            await until(leg.label, ({ spaceId }) => spaceId === leg.destination, 120_000)
          }
        } finally {
          forward(false)
        }
        await settle(leg.label)
        const wanted = 'at' in leg ? leg.spaceId : leg.destination
        if (wanted && capture.current?.spaceId !== wanted) {
          throw new Error(`${leg.label} ended in ${capture.current?.spaceId}, expected ${wanted}`)
        }
      }
    },
    { legs, sensitivity: LOOK_SENSITIVITY, attribute: TOUR_CAMERA_TRACE_ATTRIBUTE },
  )
}

export async function readTourCameraFrames(page: Page, start = 0): Promise<TourCameraSample[]> {
  return page.evaluate((index) => window.tourCameraCapture.frames.slice(index), start)
}
