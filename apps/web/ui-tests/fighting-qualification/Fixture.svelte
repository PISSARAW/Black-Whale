<script lang="ts">
  import { onMount } from 'svelte'
  import * as THREE from 'three'
  import FightStage from '../../src/lib/components/fighting/FightStage.svelte'
  import { defaultFightComfort } from '../../src/lib/fighting/fightComfort'
  import { initialReplayState } from '../../src/lib/fighting/fightReplayCommands'
  import { revalidateCombatReference } from '../../src/lib/fighting/revalidateCombatReference'
  import { fightReplayHash } from '../../src/lib/fighting/fightReplayHash'
  import { createLiveDriver } from '../fighting-performance/liveDriver'
  import { performanceTape } from '../fighting-performance/scenario'
  import { stressManifested, type StressScenario } from '../fighting-performance/stressScenario'
  import {
    BASELINE_FIGHTERS,
    type BaselineFighter,
    type BaselineTerrain,
  } from '../../src/lib/fighting/combatBaseline'
  import type { FightReplay } from '../../src/lib/fighting/fightReplayTypes'
  import type { FightState } from '../../src/lib/fighting/types'
  import type { FightGraphics } from '../../src/lib/fighting/fightGraphics'
  import { createQualificationInput } from './inputDriver'
  import type { installQualificationProbe } from './renderProbe'
  import { soakSegment } from './soakSchedule'
  export let probe: ReturnType<typeof installQualificationProbe>
  let tapes: Record<string, FightReplay> = {}
  let bank: FightReplay[] = [],
    index = 0
  let driver: ReturnType<typeof createLiveDriver> | null = null
  let state: FightState | null = null
  let input: ReturnType<typeof createQualificationInput> | null = null
  let mode: 'idle' | 'latency' | 'performance' = 'idle'
  let comfort = defaultFightComfort()
  let verified = 0,
    failure = '',
    effectSeen = true
  let stress: StressScenario | undefined
  let soak = false,
    startedAt = 0,
    segment = 0
  let transitions: { fighter: string; at: number }[] = []
  let selected: { fighter: BaselineFighter; terrain: BaselineTerrain; graphics: FightGraphics }
  THREE.Scene.prototype.onAfterRender = function (renderer, scene) {
    if (scene.userData.fightView !== 'primary') return
    scene.userData.measureFight = true
    probe.draw(renderer, scene.userData.drawnFight)
  }
  export async function load() {
    const raw = await (await fetch('/qualification-replays.json')).json()
    let measuredRuleset = '',
      checkpointsVerified = 0
    for (const [id, tape] of Object.entries(raw.tapes)) {
      const verified = revalidateCombatReference(tape as FightReplay)
      tapes[id] = verified.replay
      measuredRuleset = verified.measuredRuleset
      checkpointsVerified += verified.checkpointsVerified
    }
    return {
      ruleset: raw.ruleset,
      measuredRuleset,
      checkpointsVerified,
      archiveSha256: raw.archiveSha256,
      cases: Object.keys(tapes).length,
    }
  }
  function selectBank(fighter: BaselineFighter, terrain: BaselineTerrain) {
    bank = Object.entries(tapes)
      .filter(
        ([id]) => id.startsWith(`route-${fighter}-`) && id.endsWith(`-${terrain}-right-center-6`),
      )
      .map(([, replay]) => replay)
    if (bank.length !== 8) throw Error(`Expected eight frozen tapes for ${fighter}/${terrain}`)
    index = 0
    driver = createLiveDriver(bank[0])
    state = driver.state
  }
  export function start(options: {
    fighter: BaselineFighter
    terrain: BaselineTerrain
    graphics: FightGraphics
    soak?: boolean
    stress?: StressScenario
    stressFighter?: string
  }) {
    mode = 'idle'
    input?.pause(true)
    selected = options
    stress = options.stress
    soak = options.soak ?? false
    comfort = { ...defaultFightComfort(), graphics: options.graphics }
    verified = 0
    failure = ''
    effectSeen = !stress
    segment = 0
    startedAt = performance.now()
    transitions = []
    if (stress) {
      bank = [
        performanceTape({
          fighter: options.stressFighter as BaselineFighter,
          stage: stress === 'guards' ? 'heilly-hideout' : 'banquet-hall',
          effects: true,
          live: true,
          scenario: stress,
        }),
      ]
      index = 0
      driver = createLiveDriver(bank[0])
      state = driver.state
    } else selectBank(options.fighter, options.terrain)
    mode = 'performance'
    probe.reset()
  }
  export function latency(fighter: BaselineFighter, simulated: boolean) {
    mode = 'latency'
    soak = false
    stress = undefined
    comfort = { ...defaultFightComfort(), graphics: 'balanced' }
    selected = { fighter, terrain: 'neutral', graphics: 'balanced' }
    input!.simulatedPad(simulated)
    resetTrial()
    input!.clearResults()
  }
  export function resetTrial() {
    const tape = tapes[`route-${selected.fighter}-confirm-neutral-right-center-6`]
    state = initialReplayState(tape.setup)
    input!.reset(state)
  }
  export function ready() {
    return input?.ready() ?? false
  }
  export function completed() {
    return input?.completed() ?? false
  }
  export function pressPad() {
    input!.pressPad()
  }
  export function inputResult() {
    return input!.result()
  }
  export function inputSnapshot() {
    return input!.snapshot()
  }
  export function pause(on: boolean) {
    input!.pause(on)
  }
  export function resetMeasurement() {
    verified = 0
    probe.reset()
    startedAt = performance.now()
    transitions = []
    segment = 0
    effectSeen = state ? stressManifested(state, stress) : !stress
  }
  export function result() {
    return {
      ...probe.result(),
      verified,
      failure: failure || driver?.error || '',
      effectSeen,
      transitions,
      failedScene: Boolean(document.querySelector('.fight-scene.failed')),
      finalHash: state ? fightReplayHash(state) : null,
      stateFrame: state?.frame,
    }
  }
  export function status() {
    return {
      verified,
      failure: failure || driver?.error || '',
      frame: state?.frame,
      fighter: state?.player.id,
    }
  }
  function advancePerformance(now: number, dt: number) {
    if (!driver) return
    const next = soak ? soakSegment(now, startedAt) : 0
    if (next !== segment) {
      segment = next
      transitions.push({ fighter: BASELINE_FIGHTERS[next], at: now })
      selectBank(BASELINE_FIGHTERS[next], 'interactive')
    }
    if (driver.done) {
      if (driver.error) {
        failure = driver.error
        mode = 'idle'
        return
      }
      verified++
      index = (index + 1) % bank.length
      driver = createLiveDriver(bank[index])
    }
    state = driver.advance(dt)
    effectSeen ||= stressManifested(state, stress)
  }
  onMount(() => {
    input = createQualificationInput()
    probe.observe((drawn) => {
      if (mode === 'latency') input?.draw(drawn)
    })
    let last = performance.now(),
      frame = 0
    const advance = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      if (mode === 'performance') advancePerformance(now, dt)
      if (mode === 'latency') state = input!.advance(dt)
      last = now
      frame = requestAnimationFrame(advance)
    }
    frame = requestAnimationFrame(advance)
    return () => {
      cancelAnimationFrame(frame)
      input?.dispose()
    }
  })
</script>

<main>
  <p>Qualification · {state?.player.id ?? 'loading'} · {mode}</p>
  {#if state}<FightStage
      {state}
      {comfort}
      language="fr"
      stageId={state.environment.stageId}
      minimal
      victoryEnabled={false}
      onAttack={() => {}}
      onThrow={() => {}}
      onCall={() => {}}
      onFinisher={() => {}}
      onControl={() => {}}
      onOpponentControl={() => {}}
    />{/if}
</main>

<style>
  :global(body) {
    margin: 0;
    background: #081019;
    color: #e9eef4;
  }
  main {
    padding: 0.5rem;
  }
  :global(.fight-arena) {
    height: 560px !important;
    min-height: 560px !important;
  }
</style>
