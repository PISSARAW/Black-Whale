<script lang="ts">
  import { t } from '$lib/i18n'
  import { reconstructionWords } from '$lib/reconstruction/workspaceWords'
  let {
    changeFilter = $bindable('all'),
    certaintyFilter = $bindable('all'),
    showNames,
    onNames,
    hatsu,
    status,
    onDone,
  }: {
    changeFilter?: 'all' | 'changed'
    certaintyFilter?: 'all' | 'CONFIRMED' | 'PROBABLE' | 'LAST_KNOWN'
    showNames: boolean
    onNames: (value: boolean) => void
    hatsu: {
      name: string | null
      reading: string | null
      color: string | null
      onChoose: () => void
    }
    status: { loading: boolean; error: boolean; summary: string | null }
    onDone: () => void
  } = $props()
  function chooseHatsu() {
    onDone()
    hatsu.onChoose()
  }
</script>

<section class="filters" aria-label={$t.reconstruction.filters}>
  <label
    ><span>{$t.reconstruction.allPresences}</span><select
      aria-label={$t.reconstruction.filters}
      bind:value={changeFilter}
      ><option value="all">{$t.reconstruction.allPresences}</option><option value="changed"
        >{$t.reconstruction.changesOnly}</option
      ></select
    ></label
  >
  <label
    ><span>{$t.reconstruction.certaintyFilter}</span><select bind:value={certaintyFilter}
      ><option value="all">{$t.reconstruction.allCertainties}</option><option value="CONFIRMED"
        >{$t.reconstruction.legendKnown}</option
      ><option value="PROBABLE">{$t.reconstruction.legendProbable}</option><option
        value="LAST_KNOWN">{$t.reconstruction.legendLastKnown}</option
      ></select
    ></label
  >
  <label class="names"
    ><input
      type="checkbox"
      checked={showNames}
      onchange={(event) => onNames(event.currentTarget.checked)}
    />{$reconstructionWords.names}</label
  >
</section>
{#if status.loading}<p role="status">
    {$t.reconstruction.loadingPerspective}
  </p>{:else if status.error}<p role="alert">
    {$t.reconstruction.perspectiveUnavailable}
  </p>{:else if status.summary}<p class="perspective-summary">{status.summary}</p>{/if}
<details class="legend">
  <summary>{$reconstructionWords.legend}</summary>
  <ul>
    <li><i class="active"></i>{$t.reconstruction.legendActive}</li>
    <li><i></i>{$t.reconstruction.legendKnown}</li>
    <li><i class="probable"></i>{$t.reconstruction.legendProbable}</li>
    <li><i class="last-known"></i>{$t.reconstruction.legendLastKnown}</li>
    <li><i class="arrived"></i>{$t.reconstruction.arrived}</li>
    <li><i class="departed"></i>{$t.reconstruction.departed}</li>
  </ul>
</details>
<section class="hatsu-reading" style:--hatsu={hatsu.color ?? '#6faeb2'}>
  <h3>{$t.reconstruction.hatsuLens}</h3>
  {#if hatsu.name}<strong>{hatsu.name}</strong>
    <p>{hatsu.reading}</p>{:else}<p>{$t.reconstruction.noHatsu}</p>
    <button type="button" onclick={chooseHatsu}>{$t.reconstruction.chooseHatsu}</button>{/if}
</section>

<style>
  .filters {
    display: grid;
    gap: 1.2rem;
  }
  label > span {
    display: block;
    margin-bottom: 0.5rem;
    color: #b7c6ca;
    font-size: 0.8rem;
  }
  select {
    width: 100%;
    min-height: 44px;
    border: 1px solid #344149;
    border-radius: 4px;
    background: #070c10;
    padding: 0.6rem;
    color: #edf1ee;
    font-size: 0.8rem;
  }
  .names {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    min-height: 44px;
    color: #c5d0d4;
    font-size: 0.85rem;
  }
  input {
    width: 18px;
    height: 18px;
    accent-color: #d5b86e;
  }
  p {
    margin-top: 0.5rem;
    color: #9cb0b8;
    font-size: 0.8rem;
    line-height: 1.6;
  }
  .legend {
    margin-top: 1rem;
    border-block: 1px solid #293840;
  }
  summary {
    min-height: 44px;
    padding: 0.8rem 0;
    color: #c9d2d6;
    font-size: 0.8rem;
    cursor: pointer;
  }
  ul {
    display: grid;
    gap: 0.7rem;
    padding: 0 0 1rem;
    list-style: none;
    font-size: 0.8rem;
    color: #acbdc4;
  }
  li {
    display: flex;
    align-items: center;
    gap: 0.7rem;
  }
  i {
    width: 10px;
    height: 10px;
    border: 1px solid #8daeb2;
    border-radius: 50%;
  }
  i.active {
    background: #e5c57a;
    border-color: #e5c57a;
  }
  i.probable {
    border-style: dashed;
  }
  i.last-known {
    border-style: dotted;
  }
  i.arrived {
    border-color: #78c6a3;
    background: #78c6a3;
  }
  i.departed {
    border-color: #cf806c;
    background: #cf806c;
  }
  .hatsu-reading {
    margin-top: 1rem;
    border-left: 2px solid var(--hatsu);
    padding-left: 0.75rem;
  }
  h3 {
    color: #adbdc4;
    font-size: 0.75rem;
    margin-bottom: 0.4rem;
  }
  strong {
    color: var(--hatsu);
    font-size: 0.9rem;
  }
  button {
    margin-top: 0.6rem;
    min-height: 44px;
    padding: 0.6rem;
    border: 1px solid #44545b;
    border-radius: 4px;
    color: #e5c57a;
    font-size: 0.8rem;
  }
</style>
