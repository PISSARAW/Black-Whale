<script lang="ts">
  import { onMount } from 'svelte'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import { beginFight, createFight, performAuraAttack, tickFight } from '$lib/fighting/engine'
  import { attackData } from '$lib/fighting/frameData'
  import { toggleEmperorTime } from '$lib/fighting/kurapikaActions'
  import { EMPTY_INPUT, type FightSide, type FightState, type MoveSlot } from '$lib/fighting/types'

  const cases = [
    { slot: 'forwardSpecial', label: 'Dowsing Chain · Pendule' },
    { slot: 'backSpecial', label: 'Steal Chain · Seringue' },
    { slot: 'neutralSpecial', label: 'Chain Jail · Griffe' },
    { slot: 'downSpecial', label: 'Holy Chain · Croix' },
    { slot: 'finisher', label: 'Judgment Chain · Lame' },
  ] as const
  let selected: MoveSlot = 'forwardSpecial'
  let side: FightSide = 'player'
  let state: FightState
  let running = false
  let caption = ''

  function step(frames: number) {
    for (let i = 0; i < frames; i++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  }

  function choose(slot: MoveSlot, preview = true) {
    selected = slot
    running = false
    state = beginFight(
      createFight(
        side === 'player' ? 'kurapika' : 'phinks',
        side === 'player' ? 'phinks' : 'kurapika',
        { mode: 'versus-local', formatId: 'knockout' },
      ),
    )
    const gap = slot === 'finisher' ? 6 : 18
    state = {
      ...state,
      player: { ...state.player, x: side === 'player' ? 50 - gap : 50 },
      opponent: { ...state.opponent, x: side === 'player' ? 50 : 50 + gap },
    }
    if (slot === 'downSpecial') state = { ...state, [side]: { ...state[side], health: 40 } }
    if (slot === 'finisher') state = toggleEmperorTime(state, side)
    state = performAuraAttack({
      state,
      side,
      kind: 'special',
      moveId: `kurapika:${slot}`,
      auraCharged: false,
    })
    const frames = attackData('special', state[side]).startup
    if (preview) step(slot === 'neutralSpecial' || slot === 'backSpecial' ? frames + 1 : frames - 1)
    caption = cases.find((item) => item.slot === slot)!.label
  }
  choose(selected)

  onMount(() => {
    let frame = 0
    let previous = 0
    const animate = (now: number) => {
      if (running && previous)
        state = tickFight(state, EMPTY_INPUT, {
          dt: Math.min(0.05, (now - previous) / 1000),
          opponentInput: EMPTY_INPUT,
        })
      previous = now
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  })
</script>

<main>
  <h1>Kurapika · Les cinq chaînes de la visite</h1>
  <p>
    Scène de combat réelle, poses issues du moteur. Sélectionner une chaîne puis rejouer son
    animation.
  </p>
  <nav aria-label="Chaînes de Kurapika">
    {#each cases as item (item.slot)}
      <button aria-pressed={selected === item.slot} onclick={() => choose(item.slot)}
        >{item.label}</button
      >
    {/each}
  </nav>
  <div class="controls">
    <button
      onclick={() => {
        side = side === 'player' ? 'opponent' : 'player'
        choose(selected)
      }}>Changer de côté · {side === 'player' ? 'P1' : 'P2'}</button
    >
    <button
      onclick={() => {
        choose(selected, false)
        running = true
      }}>Rejouer</button
    >
    <button onclick={() => (running = !running)}>{running ? 'Pause' : 'Continuer'}</button>
    <button
      onclick={() => {
        running = false
        step(10)
      }}>Après contact</button
    >
  </div>
  <section class="arena" aria-label="Aperçu des chaînes en combat">
    {#key side}
      <FightScene {state} stageId="heavens-arena" />
    {/key}
    <div class="caption">{caption} · {side === 'player' ? 'P1' : 'P2'}</div>
  </section>
  <p class="state">
    Frame {state.frame} · {running ? 'Animation en cours' : 'Pose arrêtée'} · Main droite et embout issus
    du rendu réel du jeu.
  </p>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #080e14;
    color: #eef2f6;
    font-family: Arial, sans-serif;
  }
  main {
    max-width: 1180px;
    margin: auto;
    padding: 22px;
  }
  h1 {
    font-size: 24px;
    margin: 0 0 10px;
  }
  p {
    color: #afc2cf;
    font-size: 14px;
  }
  nav,
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 12px 0;
  }
  button {
    cursor: pointer;
    border: 1px solid #45657c;
    background: #162330;
    color: #edf5fa;
    border-radius: 5px;
    padding: 10px;
  }
  button[aria-pressed='true'] {
    border-color: #8ecae6;
    background: #24465d;
  }
  .arena {
    position: relative;
    height: 580px;
    overflow: hidden;
    border: 1px solid #537184;
    border-radius: 6px;
  }
  .caption {
    position: absolute;
    top: 18px;
    left: 20px;
    font-size: 19px;
    pointer-events: none;
    color: #c8e8fa;
  }
  .state {
    font-size: 12px;
  }
  @media (max-width: 700px) {
    main {
      padding: 12px;
    }
    .arena {
      height: 520px;
    }
  }
</style>
