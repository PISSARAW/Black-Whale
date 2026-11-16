<script lang="ts">
  import { onMount } from 'svelte'
  import { get } from 'svelte/store'
  import FightReplays from '$lib/components/fighting/FightReplays.svelte'
  import FightTeams from '$lib/components/fighting/FightTeams.svelte'
  import FightSeason from '$lib/components/fighting/FightSeason.svelte'
  import { createFightMatchRuntime } from '$lib/fighting/fightMatchRuntime'
  import { beginFight, createFight } from '$lib/fighting/engine'
  import { EMPTY_INPUT, type FightState } from '$lib/fighting/types'
  import { rankingToken } from '$lib/fighting/career/ranking'
  const runtime = createFightMatchRuntime(),
    replays = runtime.replays
  let state: FightState | null = null,
    language: 'fr' | 'en' = 'fr',
    ready = false
  let sourceId = ''
  function assign(next: FightState | null) {
    if (next) state = next
  }
  const review = {
    seek: (packet: number) => assign(runtime.seekReplay(packet)),
    takeover: () => assign(runtime.takeoverReplay()),
    repeat: () => assign(runtime.repeatReplayPractice()),
    returnToReplay: () => assign(runtime.returnToReplay()),
  }
  async function resolve() {
    await fetch('/__resolve', {
      method: 'POST',
      headers: { authorization: `Bearer ${rankingToken()}` },
    })
  }
  onMount(() => {
    let stopped = false,
      frame = 0,
      last = performance.now()
    const prepare = async () => {
      state = beginFight(
        createFight('chrollo', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
      )
      runtime.begin(state)
      for (let i = 0; i < 60; i++) state = runtime.advance(state, EMPTY_INPUT, { dt: 1 / 60 })
      const entry = await replays.save()
      sourceId = entry!.id
      ready = true
    }
    void prepare()
    const loop = (now: number) => {
      if (stopped) return
      if (state && (replays.active || replays.practicing))
        state = runtime.advance(state, EMPTY_INPUT, { dt: Math.min(0.05, (now - last) / 1000) })
      last = now
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    Object.assign(window, {
      phase9Fixture: {
        source: () =>
          JSON.stringify(get(replays).library.find((entry) => entry.id === sourceId)?.replay),
        state: () => state,
        english: () => (language = 'en'),
      },
    })
    return () => {
      stopped = true
      cancelAnimationFrame(frame)
    }
  })
</script>

<main>
  <h1>Clash · Phase 9</h1>
  {#if ready}<FightReplays
      {replays}
      {language}
      {review}
      expanded
      onOpen={(id) => assign(replays.open(id, state))}
      onClose={() => assign(replays.close())}
      onRestart={() => assign(replays.restart())}
    />{/if}
  {#if state?.replayPractice}<output data-practice
      >{state.player.id} · {state.player.aura.toFixed(2)}
      <button
        onclick={() =>
          state &&
          runtime.enqueue(state, { kind: 'move', side: 'player', action: 'light', input: 0 })}
        >Frapper pendant l’essai</button
      ></output
    >{/if}
  <FightSeason {language} endpoint="/__season" />
  <button onclick={resolve}>Résoudre un duel serveur</button><button
    onclick={() => fetch('/__restart', { method: 'POST' })}>Redémarrer le registre</button
  >
  <FightTeams {language} />
</main>

<style>
  main {
    max-width: 1100px;
    margin: auto;
    padding: 0.6rem;
    color: #e5eff9;
  }
  button {
    padding: 0.5rem;
    margin: 0.3rem;
  }
  :global(*) {
    box-sizing: border-box;
  }
</style>
