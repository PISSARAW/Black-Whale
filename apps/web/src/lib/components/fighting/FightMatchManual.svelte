<script lang="ts">
  import FightControlsManual from './FightControlsManual.svelte'
  import { fightingCopy } from '../../../routes/fighting/fightingCopy'
  import type { FighterId, FightMode } from '$lib/fighting/types'
  export let language: 'fr' | 'en'
  export let fighterId: FighterId
  export let mode: FightMode
  $: copy = fightingCopy(language)
</script>

<details class="fight-manual">
  <summary>{language === 'fr' ? 'Commandes et techniques' : 'Controls and techniques'}</summary>
  <FightControlsManual {language} {fighterId} {mode} title={copy.controls} />
</details>
