<script lang="ts">
  import { FIGHTING_ROSTER } from '$lib/fighting/roster'
  import type { FighterId, FightState } from '$lib/fighting/types'
  import FightScene from './FightScene.svelte'
  export let language: 'fr' | 'en'
  let fighter: FighterId = 'kurapika'
  let state: FightState | null = null
  let loading: Promise<void> | undefined
  let opened = false
  let failure = false
  async function preview() {
    failure = false
    loading = import('$lib/fighting/engine')
      .then(({ createFight }) => {
        state = createFight(fighter, fighter)
      })
      .catch(() => {
        failure = true
      })
    await loading
  }
</script>

<details
  on:toggle={(event) => {
    opened = event.currentTarget.open
    if (opened && !state && !loading) void preview()
  }}
>
  <summary>{language === 'fr' ? 'Aperçu des tenues' : 'Outfit preview'}</summary>
  {#if opened}
    <label
      >{language === 'fr' ? 'Personnage de l’aperçu' : 'Preview character'}
      <select
        aria-label={language === 'fr' ? 'Personnage de l’aperçu' : 'Preview character'}
        bind:value={fighter}
        on:change={() => void preview()}
      >
        {#each FIGHTING_ROSTER as item (item.id)}<option value={item.id}>{item.name}</option>{/each}
      </select>
    </label>
    <p>
      P1 / P2 · {language === 'fr'
        ? 'poses de référence, duel non lancé'
        : 'reference poses, fight not started'}
    </p>
    {#if failure}<p role="status">
        {language === 'fr' ? 'Aperçu indisponible.' : 'Preview unavailable.'}
      </p>{:else if state}
      <div class="preview-scene" data-fighter={state.player.id}>
        {#key state.player.id}<FightScene {state} active={opened} />{/key}
      </div>
    {/if}
  {/if}
</details>

<style>
  .preview-scene {
    position: relative;
    height: clamp(240px, 40vw, 360px);
    overflow: hidden;
    isolation: isolate;
  }
  summary {
    cursor: pointer;
    min-height: 44px;
    display: list-item;
  }
  label {
    display: grid;
    gap: 0.4rem;
  }
  select {
    width: 100%;
    min-height: 44px;
    background: #17263b;
    color: #f8fafc;
    border: 1px solid #73839a;
    padding: 0.5rem;
  }
  p {
    font-size: 0.8rem;
  }
</style>
