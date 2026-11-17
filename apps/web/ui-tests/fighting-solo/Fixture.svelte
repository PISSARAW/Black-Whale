<script lang="ts">
  import { tick } from 'svelte'
  import { get } from 'svelte/store'
  import FightSolo from '$lib/components/fighting/FightSolo.svelte'
  import { createSoloController } from '$lib/fighting/solo/controller'
  import { EMPTY_INPUT, type FightInput, type MoveAction } from '$lib/fighting/types'
  const controller = createSoloController()
  let language: 'fr' | 'en' = 'fr'
  export async function advance(count: number, input: Partial<FightInput> = {}) {
    for (let i = 0; i < count; i++) controller.tick(1 / 60, { ...EMPTY_INPUT, ...input })
    await tick()
  }
  export async function move(action: MoveAction) {
    controller.enqueue({ kind: 'move', side: 'player', action, input: 0 })
    await tick()
  }
  export async function english() {
    language = 'en'
    await tick()
  }
  export function snapshot() {
    const { session, save, paused } = get(controller)
    return { run: session?.run, player: session?.state.player, paused, routes: save.routes }
  }
</script>

<main>
  <h1>Clash · {language === 'fr' ? 'Parcours et défis solo' : 'Solo routes and challenges'}</h1>
  <FightSolo {controller} {language} animate={false} />
</main>

<style>
  :global(body) {
    margin: 0;
    background: #0b1925;
    color: #edf4f8;
  }
  main {
    max-width: 1100px;
    margin: auto;
    padding: 1rem;
    box-sizing: border-box;
  }
</style>
