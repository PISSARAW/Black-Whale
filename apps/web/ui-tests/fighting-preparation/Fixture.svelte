<script lang="ts">
  import { tick } from 'svelte'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import FightPreparationSetup from '$lib/components/fighting/FightPreparationSetup.svelte'
  import FightPreparationStatus from '$lib/components/fighting/FightPreparationStatus.svelte'
  import { beginFight, createFight, performAttack, tickFight } from '$lib/fighting/engine'
  import { createFightEnvironment, type FightEnvironment } from '$lib/fighting/fightEnvironment'
  import { fightSpecialPresentation } from '$lib/fighting/fightSpecialPresentation'
  import { EMPTY_INPUT, type FightInput, type FighterId } from '$lib/fighting/types'
  import type { PreparationResource } from '$lib/fighting/preparationTypes'

  let player: FighterId = 'bill'
  let environment = createFightEnvironment()
  let state = beginFight(createFight(player, 'hisoka', { mode: 'versus-local', environment }))
  let input = { ...EMPTY_INPUT }
  $: presentation = fightSpecialPresentation(state, 'fr')
  function control(key: keyof FightInput, active: boolean) {
    input = { ...input, [key]: active }
    advanceFrame()
  }
  function advanceFrame() {
    state = tickFight(state, input, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  }
  function reset(next: FightEnvironment) {
    environment = next
    const fresh = beginFight(createFight(player, 'hisoka', { mode: 'versus-local', environment }))
    state = { ...fresh, player: { ...fresh.player, aura: 100 } }
    input = { ...EMPTY_INPUT }
  }
  export async function renderCase(
    id: FighterId,
    resources: PreparationResource[] = [],
    copied = false,
  ) {
    player = id
    reset(
      createFightEnvironment({
        preparation: {
          mode: resources.length ? 'scenario' : 'duel',
          resources,
          cohorts: id === 'halkenburg' && resources.length ? ['player'] : [],
        },
      }),
    )
    if (copied)
      state = {
        ...state,
        player: {
          ...state.player,
          chrolloBook: { pages: ['melody'], page: 0, open: false, bookmark: 'melody' },
        },
      }
    await tick()
  }
  export async function advance(frames: number) {
    for (let frame = 0; frame < frames; frame++) advanceFrame()
    await tick()
  }
  export function snapshot() {
    return {
      battlefield: state.battlefield,
      equipment: state.player.equipment,
      health: state.opponent.health,
      music: Boolean(state.player.melodyPerformance),
      nocked: state.player.hatsuEffects.arrowNocked,
    }
  }
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key === '6') {
      event.preventDefault()
      control('interact', true)
    }
  }}
  onkeyup={(event) => {
    if (event.key === '6') control('interact', false)
  }}
/>
<main>
  <FightPreparationSetup {environment} {player} opponent="hisoka" language="fr" onChange={reset} />
  <div class="arena">
    {#key player}<FightScene {state} stageId="heavens-arena" />{/key}
  </div>
  <section class="status">
    <FightPreparationStatus {state} side="player" language="fr" onControl={control} />
    <button
      type="button"
      aria-label="Activer L"
      disabled={!presentation.ready}
      onclick={() => {
        state = performAttack(state, 'player', 'special')
      }}>{presentation.label} · L</button
    >
    <p>{presentation.hint}</p>
  </section>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #080e14;
    color: #e0eaf2;
    font: 500 0.8rem/1.5 var(--font-mono);
  }
  main {
    max-width: 1100px;
    margin: auto;
  }
  .arena {
    height: 420px;
    position: relative;
  }
  .status {
    padding: 1rem;
    display: grid;
    gap: 0.5rem;
  }
  button {
    min-height: 44px;
    padding: 0.6rem;
    border: 1px solid #7894a0;
    background: #18303a;
    color: inherit;
    font: inherit;
  }
  button:disabled {
    opacity: 0.5;
  }
  p {
    overflow-wrap: anywhere;
  }
</style>
