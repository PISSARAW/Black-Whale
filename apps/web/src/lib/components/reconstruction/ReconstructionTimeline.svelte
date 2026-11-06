<script lang="ts">
  import { tick } from 'svelte'
  import { t } from '$lib/i18n'
  import { reconstructionWords } from '$lib/reconstruction/workspaceWords'
  interface Entry {
    index: number
    event: { id: string; title: string; occurredAtLabel: string | null }
    chapter: { number: number }
  }
  let {
    entries,
    query = $bindable(''),
    currentIndex,
    followed,
    onChoose,
    onDone,
  }: {
    entries: Entry[]
    query?: string
    currentIndex: number
    followed: number[]
    onChoose: (index: number) => void
    onDone: () => void
  } = $props()
  let list: HTMLElement
  function reveal(node: HTMLElement) {
    void tick().then(() =>
      node.querySelector('[aria-current]')?.scrollIntoView({ block: 'center' }),
    )
  }
  function choose(index: number) {
    onChoose(index)
    onDone()
  }
</script>

<div class="timeline-picker">
  <label
    ><span>{$t.reconstruction.searchEvents}</span><input
      type="search"
      bind:value={query}
      placeholder={$t.reconstruction.searchPlaceholder}
    /></label
  >
  <nav bind:this={list} use:reveal aria-label={$t.reconstruction.timeline}>
    {#each entries as entry (entry.event.id)}
      <button
        type="button"
        aria-current={entry.index === currentIndex ? 'step' : undefined}
        class:followed={followed.includes(entry.index)}
        onclick={() => choose(entry.index)}
      >
        <span class="index">{String(entry.index + 1).padStart(3, '0')}</span>
        <span
          ><small
            >{$t.common.chapterShort(entry.chapter.number)}{entry.event.occurredAtLabel
              ? ` · ${entry.event.occurredAtLabel}`
              : ''}</small
          ><strong>{entry.event.title}</strong></span
        >
      </button>
    {:else}<p>{$reconstructionWords.noEvents}</p>{/each}
  </nav>
</div>

<style>
  .timeline-picker {
    display: grid;
    gap: 1rem;
  }
  label span {
    display: block;
    margin-bottom: 0.5rem;
    color: #b5c0c4;
    font-size: 0.8rem;
  }
  input {
    width: 100%;
    min-height: 44px;
    padding: 0.7rem;
    border: 1px solid #344149;
    border-radius: 4px;
    background: #070c10;
    color: #edf1ee;
    font-size: 0.85rem;
  }
  nav {
    display: grid;
  }
  button {
    display: grid;
    grid-template-columns: 2.2rem 1fr;
    gap: 0.6rem;
    width: 100%;
    min-height: 56px;
    padding: 0.8rem 0.4rem;
    border-bottom: 1px solid #293137;
    border-left: 2px solid transparent;
    text-align: left;
    color: #c8d0d2;
  }
  button:hover,
  button[aria-current] {
    background: #25251c;
    color: #f2e5c9;
    border-left-color: #d5b86e;
  }
  .index,
  small {
    color: #85949b;
    font-size: 0.7rem;
  }
  strong {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.85rem;
    font-weight: 500;
    line-height: 1.45;
  }
  .followed:not([aria-current]) {
    border-left-color: #6faeb2;
  }
  nav > p {
    color: #9ba9b0;
    font-size: 0.85rem;
  }
</style>
