<script lang="ts">
  import { tick } from 'svelte'
  import FightScene from '$lib/components/fighting/FightScene.svelte'
  import FightResources from '$lib/components/fighting/FightResources.svelte'
  import { beginFight, createFight, performAttack, tickFight } from '$lib/fighting/engine'
  import { EMPTY_INPUT, type FighterId, type FightSide } from '$lib/fighting/types'
  import { projectileProfile } from '$lib/fighting/projectiles'
  let state = beginFight(createFight('kurapika', 'hisoka', { mode: 'versus-local' }))
  let language: 'fr' | 'en' = 'fr'
  let sceneRevision = 0
  let sceneReady = false
  export function ready() {
    return sceneReady
  }
  export async function render(options: { id: FighterId; side: FightSide; language: 'fr' | 'en' }) {
    language = options.language
    const { id, side } = options
    const fresh = beginFight(
      createFight(side === 'player' ? id : 'hisoka', side === 'player' ? 'hisoka' : id, {
        mode: 'versus-local',
      }),
    )
    let current = {
      ...fresh,
      player: { ...fresh.player, x: 30 },
      opponent: { ...fresh.opponent, x: 70 },
    }
    current = {
      ...current,
      [side]: { ...current[side], aura: 0, nen: { ...current[side].nen, mode: 'zetsu' as const } },
    }
    current = performAttack(current, side, 'ranged')
    for (let i = 0; i < 11; i++)
      current = tickFight(current, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    sceneReady = false
    sceneRevision++
    state = current
    await tick()
    return {
      projectile: state.projectiles[0],
      profile: projectileProfile(id),
      kind: state[side].attack?.kind,
    }
  }
</script>

<main>
  <h1>Armes de service · Gardes du corps</h1>
  <div class="arena">
    {#key sceneRevision}
      <FightScene
        {state}
        {language}
        stageId="heavens-arena"
        onSceneReady={() => (sceneReady = true)}
      />
    {/key}
  </div>
  <FightResources {state} {language} onAura={() => {}} onEmperor={() => {}} />
</main>

<style>
  :global(body) {
    margin: 0;
    background: #080f15;
    color: #c9e0d3;
  }
  main {
    max-width: 1200px;
    margin: auto;
    padding: 1rem;
  }
  h1 {
    font: 700 1rem var(--font-mono);
  }
  .arena {
    height: min(64vh, 600px);
    min-height: 350px;
    border: 1px solid #355047;
    overflow: hidden;
    position: relative;
  }
</style>
