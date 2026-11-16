<script lang="ts">
  import { onMount } from 'svelte'
  import { beginFight, createFight, tickFight } from '$lib/fighting/engine'
  import { performEasterEgg } from '$lib/fighting/easterEggs'
  import type { EasterEggSlot } from '$lib/fighting/easterEggCatalogue'
  import { EMPTY_INPUT, type FighterId } from '$lib/fighting/types'
  import FightScene from './FightScene.svelte'
  import FightEasterEggCaptions from './FightEasterEggCaptions.svelte'
  export let fighterId: FighterId
  export let opponentId: FighterId
  export let slot: EasterEggSlot
  export let language: 'fr' | 'en'
  let preview = fresh()
  let playing = true
  function fresh() {
    const target = fighterId === 'kurapika' && slot === 4 ? 'hisoka' : opponentId
    const state = beginFight(createFight(fighterId, target, { mode: 'training' }))
    // A separate, silent sandbox. Unlock requirements are waived only for this preview.
    state.player = { ...state.player, easterEggSequence: 3, easterEggDiscoveries: 7 }
    return performEasterEgg(state, 'player', slot)
  }
  function replay() {
    preview = fresh()
    playing = true
  }
  onMount(() => {
    let last = performance.now()
    let handle = 0
    const animate = (now: number) => {
      if (playing) {
        preview = tickFight(preview, EMPTY_INPUT, {
          dt: Math.min(0.05, (now - last) / 1000),
          opponentInput: EMPTY_INPUT,
        })
        playing = Boolean(preview.player.easterEgg)
      }
      last = now
      handle = requestAnimationFrame(animate)
    }
    handle = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(handle)
  })
</script>

<div class="preview" aria-label={language === 'fr' ? 'Aperçu de la scène' : 'Scene preview'}>
  <div class="preview-arena">
    <FightScene state={preview} />
    <FightEasterEggCaptions state={preview} {language} />
  </div>
  <button type="button" onclick={replay}
    >{language === 'fr' ? 'Rejouer l’aperçu' : 'Replay preview'}</button
  >
</div>

<style>
  .preview {
    margin-top: 12px;
  }
  .preview-arena {
    position: relative;
    height: 280px;
    overflow: hidden;
    background: #080f15;
  }
  button {
    margin-top: 8px;
    border: 1px solid #516072;
    padding: 6px 12px;
    color: #e9dfca;
    background: #16202b;
  }
</style>
