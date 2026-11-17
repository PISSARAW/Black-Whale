<script lang="ts">
  import { get } from 'svelte/store'
  import { setContext, onMount } from 'svelte'
  import * as THREE from 'three'
  import FightStage from '$lib/components/fighting/FightStage.svelte'
  import { createPvpClient } from '$lib/fighting/pvp/client'
  import { mountPvpDuelLoop } from '$lib/fighting/pvp/duelLoop'
  import { FIGHT_VISUAL_PREDICTION } from '$lib/fighting/fightVisualPrediction'
  import { packReplayInput } from '$lib/fighting/fightReplayInput'
  import {
    EMPTY_INPUT,
    type FighterId,
    type FightInput,
    type MoveAction,
  } from '$lib/fighting/types'
  import { PVP_RULESET, type PvpSession } from '$lib/fighting/pvp/types'
  import { createFightEnvironment } from '$lib/fighting/fightEnvironment'
  import type { installFrameProbe } from '../fighting-performance/frameProbe'
  export let probe: ReturnType<typeof installFrameProbe>
  let client = null as ReturnType<typeof createPvpClient> | null
  let rendered = true,
    legacy = false
  let held = { ...EMPTY_INPUT }
  let stop = () => {}
  let started = false
  let lastCompleted = -Infinity
  let requestBusy = false
  let marker: { at: number; command: string; queued: unknown } | null = null
  let latency: Array<{
    command: string
    ms: number
    confirmed: boolean
    queued: unknown
    drawn: unknown
  }> = []
  const failed = ''
  $: state = $client?.state ?? null
  setContext(FIGHT_VISUAL_PREDICTION, () => (legacy ? null : (client?.visualPrediction ?? null)))
  THREE.Scene.prototype.onAfterRender = function (renderer, scene) {
    if (!scene.getObjectByName('fight-collision-boxes')) return
    probe.draw(renderer)
    if (!marker || !client) return
    const authority = get(client).state
    const visual = legacy ? null : client.visualPrediction
    const attack = visual?.player.attack ?? authority?.player.attack
    if (attack) {
      latency.push({
        command: marker.command,
        ms: performance.now() - marker.at,
        confirmed: Boolean(authority?.player.attack),
        queued: marker.queued,
        drawn: client.predictionStats,
      })
      marker = null
    }
  }
  export async function setup(options: {
    fighter: FighterId
    opponent: FighterId
    rendered: boolean
    legacy: boolean
    network: string
  }) {
    stop()
    client?.stop()
    rendered = options.rendered
    legacy = options.legacy
    const endpoint = '/__response/' + options.network
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        kind: 'create',
        ruleset: PVP_RULESET,
        setup: {
          player: options.fighter,
          opponent: options.opponent,
          formatId: 'knockout',
          environment: createFightEnvironment({
            stageId: 'banquet-hall',
            arenaInteractions: false,
          }),
        },
      }),
    })
    const session = (await response.json()) as PvpSession
    await attach(session, endpoint)
    return session
  }
  export async function attach(session: PvpSession, endpoint: string) {
    sessionStorage.setItem('black-whale:clash:pvp:' + session.matchId, session.token)
    client = createPvpClient({
      matchId: session.matchId,
      endpoint: endpoint + '/' + session.matchId,
      fetch,
      storage: sessionStorage,
    })
    await client.join()
    startLoop()
    return session
  }
  export async function join(options: {
    matchId: string
    invitation: string
    network: string
    rendered: boolean
  }) {
    rendered = options.rendered
    client = createPvpClient({
      matchId: options.matchId,
      endpoint: '/__response/' + options.network + '/' + options.matchId,
      invitation: options.invitation,
      fetch,
      storage: sessionStorage,
    })
    await client.join()
    startLoop()
  }
  function startLoop() {
    if (!client) return
    const active = client
    if (legacy) {
      stop = mountPvpDuelLoop({
        client: {
          ...active,
          advance: () => {},
          pump(input: number) {
            if (requestBusy || performance.now() - lastCompleted < 50) return
            requestBusy = true
            void active.step(input).finally(() => {
              lastCompleted = performance.now()
              requestBusy = false
            })
          },
        },
        joined: () => true,
        input: () => packReplayInput(held),
        poll: () => {},
      })
    } else
      stop = mountPvpDuelLoop({
        client: active,
        joined: () => true,
        input: () => packReplayInput(held),
        poll: () => {},
      })
  }
  export async function ready() {
    await client!.ready()
    started = true
  }
  export function control(key: keyof FightInput, value: boolean) {
    held = { ...held, [key]: value }
  }
  export function move(action: MoveAction | 'ranged') {
    marker = { at: performance.now(), command: action, queued: client?.predictionStats }
    client!.queue({ kind: 'move', action, input: packReplayInput(held) })
  }
  export function reset() {
    latency = []
    probe.reset()
  }
  export function result() {
    return {
      ...probe.result(),
      latency,
      failed,
      state: client ? get(client) : null,
      prediction: client?.predictionStats,
      started,
    }
  }
  export function finish() {
    stop()
    client?.stop()
    probe.stop()
  }
  onMount(() => () => finish())
</script>

<main>
  <p>
    Production · réactivité · {legacy ? 'ancien ordonnancement' : 'prédiction et réconciliation'}
  </p>
  {#if state && rendered}<FightStage
      {state}
      language="fr"
      stageId={state.environment.stageId}
      onAttack={(kind) => move(kind)}
      onThrow={() => {}}
      onCall={() => {}}
      onFinisher={() => {}}
      onControl={control}
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
