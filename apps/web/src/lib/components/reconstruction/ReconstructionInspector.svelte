<script lang="ts">
  import type { ComponentProps } from 'svelte'
  import { t } from '$lib/i18n'
  import { claimLevel } from '$lib/reconstruction/evidence'
  import { reconstructionWords } from '$lib/reconstruction/workspaceWords'
  import type {
    EventDetails,
    PresenceChange,
    DisplayPresence,
  } from '$lib/reconstruction/workspaceTypes'
  import ReconstructionPeople from './ReconstructionPeople.svelte'
  let {
    event,
    changes,
    people,
    statistics,
    initial = 'event',
  }: {
    event: EventDetails
    changes: PresenceChange[]
    people: ComponentProps<typeof ReconstructionPeople>
    statistics: { total: number; exact: number; approximate: number; unlocated: DisplayPresence[] }
    initial?: 'event' | 'person'
  } = $props()
  let tab: string = $derived(initial === 'person' ? 'people' : 'event')
  const tabs = $derived([
    { id: 'event', label: $reconstructionWords.event },
    { id: 'people', label: $reconstructionWords.people },
    { id: 'changes', label: $reconstructionWords.changes },
    { id: 'sources', label: $reconstructionWords.sources },
  ])
</script>

<nav class="inspector-tabs" aria-label={$reconstructionWords.details}>
  {#each tabs as item (item.id)}<button
      type="button"
      aria-pressed={tab === item.id}
      onclick={() => (tab = item.id)}>{item.label}</button
    >{/each}
</nav>
{#if tab === 'event'}
  <p class="eyebrow">
    {$t.common.chapterShort(event.chapter)}{#if event.time}
      · {event.time}{/if}
  </p>
  <h3>{event.title}</h3>
  <p class="summary">{event.summary}</p>
  <div class="quick-links">
    <button type="button" onclick={() => (tab = 'people')}
      >{$reconstructionWords.people} <span>{people.cast.length} →</span></button
    >
    <button type="button" onclick={() => (tab = 'changes')}
      >{$reconstructionWords.changes} <span>{changes.length} →</span></button
    >
    <button type="button" onclick={() => (tab = 'sources')}
      >{$reconstructionWords.sources} <span>{event.evidence.length} →</span></button
    >
  </div>
{:else if tab === 'people'}
  <ReconstructionPeople {...people} />
{:else if tab === 'changes'}
  <h3>{$t.reconstruction.changes}</h3>
  <ul class="changes">
    {#each changes as presence (presence.entityId)}
      <li data-change={presence.change}>
        <strong>{presence.name}</strong>
        <p>
          {#if presence.change === 'moved'}{presence.previousLocationLabel ?? $t.common.unknown} → {presence.locationLabel ??
              $t.common.unknown}{:else}{$t.reconstruction.changeLabels[
              presence.change
            ]}{#if presence.locationLabel}
              · {presence.locationLabel}{/if}{/if}
        </p>
        <small
          >{$t.reconstruction.evidenceLevels[
            claimLevel(presence.certainty, presence.precision)
          ]}</small
        >
      </li>
    {:else}<li class="muted">{$t.reconstruction.noChanges}</li>{/each}
  </ul>
{:else}
  <h3>{$t.reconstruction.sources}</h3>
  <ul class="evidence">
    {#each event.evidence as item (item.id)}<li data-evidence={item.level}>
        <small>{$t.reconstruction.evidenceLevels[item.level]}</small><strong>{item.label}</strong
        >{#if item.detail}<code>{item.detail}</code>{/if}
      </li>{/each}
  </ul>
  <h3 class="state-heading">{$t.reconstruction.shipState} · {statistics.total}</h3>
  <dl>
    <div>
      <dt>{$t.reconstruction.exact}</dt>
      <dd>{statistics.exact}</dd>
    </div>
    <div>
      <dt>{$t.reconstruction.approximate}</dt>
      <dd>{statistics.approximate}</dd>
    </div>
    <div>
      <dt>{$t.reconstruction.unlocated}</dt>
      <dd>{statistics.unlocated.length}</dd>
    </div>
  </dl>
  {#if statistics.unlocated.length}<details>
      <summary>{$t.reconstruction.showUnlocated(statistics.unlocated.length)}</summary>
      <ul>
        {#each statistics.unlocated as presence (presence.entityId)}<li>{presence.name}</li>{/each}
      </ul>
    </details>{/if}
  <p class="method">{$t.reconstruction.methodNote}</p>
{/if}

<style>
  .inspector-tabs {
    display: flex;
    gap: 0.2rem;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #303b40;
  }
  .inspector-tabs button {
    min-height: 44px;
    flex: 1;
    padding: 0.4rem;
    color: #a9b7bd;
    font-size: 0.75rem;
    border-radius: 4px;
  }
  .inspector-tabs button[aria-pressed='true'] {
    color: #e5c57a;
    background: #29271d;
  }
  h3 {
    margin: 0 0 0.5rem;
    font-size: 1.1rem;
    font-weight: 600;
    line-height: 1.4;
  }
  .eyebrow,
  small {
    color: #a3b2b9;
    font-size: 0.7rem;
  }
  .eyebrow {
    margin-bottom: 0.5rem;
    color: #e5c57a;
  }
  .summary {
    color: #bdc8cc;
    font-size: 0.9rem;
    line-height: 1.7;
  }
  .quick-links {
    display: grid;
    margin-top: 1.5rem;
  }
  .quick-links button {
    display: flex;
    min-height: 48px;
    align-items: center;
    justify-content: space-between;
    padding: 0.7rem;
    border-bottom: 1px solid #2e3b41;
    font-size: 0.8rem;
  }
  .quick-links button:hover {
    background: #1c2a30;
  }
  .quick-links span {
    color: #e5c57a;
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .changes,
  .evidence {
    display: grid;
    gap: 0.8rem;
    margin-top: 1rem;
  }
  .changes li,
  .evidence li {
    padding: 0.5rem 0.7rem;
    border-left: 2px solid #709fa5;
  }
  .changes li[data-change='arrived'] {
    border-color: #78c6a3;
  }
  .changes li[data-change='moved'] {
    border-color: #e5c57a;
  }
  .changes li[data-change='departed'] {
    border-color: #cf806c;
  }
  strong {
    display: block;
    font-size: 0.85rem;
    font-weight: 500;
  }
  .changes p {
    margin: 0.3rem 0;
    color: #a6b5bc;
    font-size: 0.8rem;
    line-height: 1.5;
  }
  code {
    display: block;
    overflow-wrap: anywhere;
    margin-top: 0.3rem;
    color: #8c9da5;
    font-size: 0.7rem;
  }
  .state-heading {
    margin-top: 1.5rem;
  }
  dl {
    display: grid;
    gap: 0.5rem;
    font-size: 0.8rem;
  }
  dl > div {
    display: flex;
    justify-content: space-between;
    color: #adbdc3;
  }
  dd {
    color: #edf1ee;
  }
  summary {
    min-height: 44px;
    padding: 0.8rem 0;
    font-size: 0.8rem;
    cursor: pointer;
  }
  details li {
    padding: 0.25rem;
    font-size: 0.8rem;
  }
  .method,
  .muted {
    color: #8e9ea6;
    font-size: 0.8rem;
    line-height: 1.6;
  }
  .method {
    margin-top: 1rem;
    border-left: 2px solid #a38c57;
    padding-left: 0.7rem;
  }
</style>
