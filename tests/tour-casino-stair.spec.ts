import { expect, test } from 'playwright/test'
import {
  CASINO_LOWER_HALL,
  CASINO_SPACE,
  CASINO_STAIR_LANDING,
  CASINO_STAIR_ROOM,
} from '../apps/web/src/lib/tour/casinoLayout'
import type { TourCameraSample } from '../apps/web/src/lib/components/tour/TourCameraTrace'
import {
  engageTourCamera,
  installTourCameraCapture,
  readTourCameraFrames,
  walkTour,
} from './helpers/tour-camera'

const CORRIDOR = 'tier-1-c-port-corridor'

test.use({
  viewport: { width: 860, height: 570 },
  channel: 'chromium',
  launchOptions: { args: ['--ignore-gpu-blocklist'] },
})

function deckChanges(frames: readonly TourCameraSample[]) {
  return frames.flatMap((after, index) => {
    const before = frames[index - 1]
    return before && before.tierId !== after.tierId ? [{ before, after }] : []
  })
}

function cameraDistance(before: TourCameraSample, after: TourCameraSample): number {
  return Math.hypot(...after.position.map((value, axis) => value - before.position[axis]))
}

function cameraTurn(before: TourCameraSample, after: TourCameraSample): number {
  const dot = after.quaternion.reduce(
    (sum, value, axis) => sum + value * before.quaternion[axis],
    0,
  )
  return 2 * Math.acos(Math.min(1, Math.abs(dot)))
}

function expectSpiralCrossing(frames: readonly TourCameraSample[], direction: 'down' | 'up') {
  const descending = direction === 'down'
  const spiral = frames.filter((frame) => frame.onSpiral)
  expect(spiral.length).toBeGreaterThan(60)
  const heightChange = spiral.at(-1)!.ground - spiral[0].ground
  expect(descending ? -heightChange : heightChange).toBeGreaterThan(10)
  const largestStep = Math.max(
    ...spiral.slice(1).map((frame, index) => Math.abs(frame.ground - spiral[index].ground)),
  )
  expect(largestStep, 'the visitor traverses the staircase tread by tread').toBeLessThan(0.5)

  const transitions = deckChanges(frames)
  expect(transitions).toHaveLength(1)
  const { before, after } = transitions[0]
  expect([before.tierId, after.tierId]).toEqual(
    descending ? ['tier-1-c', 'tier-1'] : ['tier-1', 'tier-1-c'],
  )
  expect(before.onSpiral).toBe(true)
  expect([before.spaceId, after.spaceId]).toEqual(
    descending
      ? [CASINO_STAIR_ROOM, CASINO_STAIR_LANDING]
      : [CASINO_STAIR_LANDING, CASINO_STAIR_ROOM],
  )

  // Allow two rendered frames of walking at a slow frame rate. Vertical and
  // angular continuity have tighter limits because the handoff is on a landing.
  expect(cameraDistance(before, after), 'camera translation at the deck handoff').toBeLessThan(0.45)
  expect(Math.abs(after.position[1] - before.position[1]), 'vertical camera jump').toBeLessThan(
    0.12,
  )
  expect(cameraTurn(before, after), 'camera rotation at the deck handoff').toBeLessThan(
    Math.PI / 90,
  )
}

test('walks from the casino entrance to the lower hall and back without camera jumps', async ({
  page,
  isMobile,
}, testInfo) => {
  test.skip(isMobile, 'The first-person replay uses desktop mouse and keyboard controls.')
  test.setTimeout(240_000)
  await installTourCameraCapture(page)
  await page.goto('/fr/tour?mangaView=casino-420-gaming-floor')
  await engageTourCamera(page)

  try {
    await test.step('Start outside the casino and cross its entrance on foot', async () => {
      // The authored view starts just inside the door. Walk out to establish
      // the starting point without moving the camera from the test.
      await walkTour(page, [
        { label: 'Line up with the entrance', at: [-49, 5.6] },
        { label: 'Reach the corridor', at: [-39.47, 5.6], spaceId: CORRIDOR, tolerance: 0.12 },
        { label: 'Enter the casino', at: [-49, 5.6], spaceId: CASINO_SPACE },
      ])
    })

    await test.step('Climb the four gaming terraces and pass SWAMP BALL', async () => {
      await walkTour(page, [
        { label: 'First terrace', at: [-49, 12.3] },
        { label: 'Second terrace', at: [-49, 18.8] },
        { label: 'Third terrace', at: [-49, 24.8] },
        { label: 'Fourth terrace', at: [-49, 29.85] },
        { label: 'Reach the SWAMP BALL dais', at: [-49, 30.8], tolerance: 0.13 },
        { label: 'Pass the side of SWAMP BALL', at: [-46.28, 30.8] },
        { label: 'Take the aisle beyond SWAMP BALL', at: [-46.28, 37.1] },
      ])
    })

    await test.step('Descend the colimaçon and walk into the lower hall', async () => {
      await walkTour(page, [
        { label: 'Top of the exit steps', at: [-48.5, 42.3] },
        { label: 'Foot of the exit steps', at: [-48.5, 49.1] },
        { label: 'Align with the emergency room door', at: [-49.94, 49.1] },
        {
          label: 'Emergency room',
          at: [-49.94, 54.25],
          spaceId: CASINO_STAIR_ROOM,
          tolerance: 0.11,
        },
        { label: 'Approach the spiral stair', at: [-49.45, 54.25], tolerance: 0.1 },
        {
          label: 'Walk down the spiral stair',
          yaw: -Math.PI / 2,
          destination: CASINO_STAIR_LANDING,
        },
        { label: 'Align with the grand staircase', at: [-51.05, 52.05], tolerance: 0.11 },
        {
          label: 'Reach the foot of the grand staircase',
          at: [-51.05, 58.4],
          spaceId: CASINO_LOWER_HALL,
        },
      ])
    })

    const descent = await readTourCameraFrames(page)
    await test.step('Check camera continuity on the way down', () => {
      expectSpiralCrossing(descent, 'down')
    })

    await test.step('Walk from the lower hall back up the colimaçon', async () => {
      await walkTour(page, [
        { label: 'Climb the grand staircase', at: [-51.05, 52.05], spaceId: CASINO_STAIR_LANDING },
        { label: 'Approach the lower spiral gate', at: [-49.45, 52.05], tolerance: 0.1 },
        { label: 'Walk up the spiral stair', yaw: -Math.PI / 2, destination: CASINO_STAIR_ROOM },
      ])
    })
    await test.step('Return past SWAMP BALL to the casino entrance', async () => {
      await walkTour(page, [
        { label: 'Align with the emergency room door', at: [-49.94, 54.25], tolerance: 0.11 },
        { label: 'Re-enter the casino', at: [-49.94, 49.1], spaceId: CASINO_SPACE },
        { label: 'Foot of the exit steps', at: [-48.5, 49.1] },
        { label: 'Top of the exit steps', at: [-48.5, 42.3] },
        { label: 'Take the aisle behind SWAMP BALL', at: [-46.28, 37.1] },
        { label: 'Pass the side of SWAMP BALL', at: [-46.28, 30.8] },
        { label: 'Pass the SWAMP BALL dais', at: [-49, 30.8], tolerance: 0.13 },
        { label: 'Fourth terrace', at: [-49, 29.85] },
        { label: 'Third terrace', at: [-49, 24.8] },
        { label: 'Second terrace', at: [-49, 18.8] },
        { label: 'First terrace', at: [-49, 12.3] },
        { label: 'Align with the casino entrance', at: [-49, 5.6] },
        { label: 'Return to the corridor', at: [-39.47, 5.6], spaceId: CORRIDOR, tolerance: 0.12 },
      ])
    })
    await test.step('Check camera continuity on the way up', async () => {
      expectSpiralCrossing(await readTourCameraFrames(page, descent.length), 'up')
    })
  } catch (error) {
    const frames = await readTourCameraFrames(page).catch(() => [])
    await testInfo.attach('rendered camera frames', {
      body: JSON.stringify(frames),
      contentType: 'application/json',
    })
    throw error
  } finally {
    await page.mouse.up()
  }
})
