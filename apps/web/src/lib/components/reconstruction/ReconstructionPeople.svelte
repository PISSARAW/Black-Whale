<script lang="ts">
  import { t, locale } from '$lib/i18n'
  import { reconstructionWords } from '$lib/reconstruction/workspaceWords'
  import { claimLevel } from '$lib/reconstruction/evidence'
  import { deckOf } from '$lib/reconstruction/mapGroups'
  import {
    reconstructionPeople,
    type DisplayPresence,
    type SceneCharacter,
    type SceneTarget,
  } from '$lib/reconstruction/workspaceTypes'
  import type { Apparition } from '$lib/tour/apparitions'
  let {
    presences,
    cast,
    avatars,
    selectedId,
    followedId,
    onSelect,
    onWatch,
    onFollow,
    onDone,
    initialDeck = null,
  }: {
    presences: DisplayPresence[]
    cast: SceneCharacter[]
    avatars: Apparition[]
    selectedId: string | null
    followedId: string | null
    onSelect: (id: string) => void
    onWatch: (target: SceneTarget) => void
    onFollow: (id: string) => void
    onDone: () => void
    initialDeck?: string | null
  } = $props()
  let query = $state('')
  let deck = $derived(initialDeck ?? '')
  const people = $derived(
    reconstructionPeople({ presences, cast, avatars }).sort((a, b) =>
      a.name.localeCompare(b.name, $locale),
    ),
  )
  const selected = $derived(people.find((person) => person.entityId === selectedId))
  const decks = $derived(
    [
      ...new Set(
        people.map((person) => deckOf(person.tierId)).filter((id): id is string => id !== null),
      ),
    ].sort(),
  )
  const filtered = $derived(
    people.filter(
      (person) =>
        (!deck || deckOf(person.tierId) === deck) &&
        `${person.name} ${person.locationLabel ?? ''}`
          .toLocaleLowerCase($locale)
          .includes(query.trim().toLocaleLowerCase($locale)),
    ),
  )
  function watch() {
    if (!selected?.shown) return
    onWatch({ bodyId: selected.entityId, shown: selected.shown })
    onDone()
  }
</script>

{#if selected}
  <section class="selected-person" aria-label={$reconstructionWords.selected}>
    <h3>{selected.name}</h3>
    <p>{selected.locationLabel ?? $t.reconstruction.unlocated}</p>
    <small
      >{$t.reconstruction.evidenceLevels[claimLevel(selected.certainty, selected.precision)]}</small
    >
    <div>
      <button
        type="button"
        onclick={() => onFollow(selected.entityId)}
        aria-pressed={followedId === selected.entityId}
        >{followedId === selected.entityId
          ? $reconstructionWords.unfollow
          : $reconstructionWords.follow}</button
      >
      <button
        type="button"
        onclick={watch}
        disabled={!selected.shown}
        title={!selected.shown ? $t.reconstruction.unknownPosition : undefined}
        >{$reconstructionWords.watch}</button
      >
    </div>
  </section>
{/if}
<label class="search"
  ><span class="sr-only">{$reconstructionWords.searchPeople}</span><input
    type="search"
    bind:value={query}
    placeholder={$reconstructionWords.searchPeople}
  /></label
>
<select class="deck-filter" bind:value={deck} aria-label={$reconstructionWords.allDecks}>
  <option value="">{$reconstructionWords.allDecks}</option>
  {#each decks as id (id)}<option value={id}
      >{$reconstructionWords.deck(Number(id.split('-')[1]))}</option
    >{/each}
</select>
<p class="count">{$reconstructionWords.allPeople} · {filtered.length}</p>
<ul>
  {#each filtered as person (person.entityId)}
    <li>
      <button
        type="button"
        onclick={() => onSelect(person.entityId)}
        data-person={person.entityId}
        aria-pressed={person.entityId === selectedId}
      >
        <strong
          >{person.name}{#if person.entityId === followedId}<span aria-hidden="true">
              ◎</span
            >{/if}</strong
        >
        <span>{person.locationLabel ?? $t.reconstruction.unlocated}</span>
        {#if person.role}<small>{$t.reconstruction.roles[person.role]}</small>{/if}
      </button>
    </li>
  {:else}<li class="empty">{$reconstructionWords.noPeople}</li>{/each}
</ul>

<style>
  .selected-person {
    margin-bottom: 1rem;
    padding: 1rem;
    border: 1px solid #777049;
    border-radius: 5px;
    background: #20251e;
  }
  h3 {
    font-size: 1.1rem;
    font-weight: 600;
  }
  p {
    margin-top: 0.35rem;
    font-size: 0.85rem;
    color: #b9c6ca;
  }
  small {
    display: block;
    margin-top: 0.3rem;
    color: #90a6ad;
    font-size: 0.7rem;
  }
  .selected-person > div {
    display: grid;
    gap: 0.5rem;
    margin-top: 0.8rem;
  }
  .selected-person button {
    min-height: 44px;
    padding: 0.6rem;
    border: 1px solid #4e5d60;
    border-radius: 4px;
    color: #edf1ee;
    font-size: 0.8rem;
  }
  .selected-person button:disabled {
    opacity: 0.4;
  }
  .selected-person button[aria-pressed='true'] {
    color: #e5c57a;
    border-color: #b69c60;
  }
  input,
  .deck-filter {
    width: 100%;
    min-height: 44px;
    padding: 0.7rem;
    border: 1px solid #344149;
    border-radius: 4px;
    background: #070c10;
    color: #edf1ee;
    font-size: 0.85rem;
  }
  .count {
    margin: 0.75rem 0;
    color: #8c9da4;
    font-size: 0.75rem;
  }
  .deck-filter {
    margin-top: 0.5rem;
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  li > button {
    display: block;
    width: 100%;
    min-height: 60px;
    padding: 0.7rem;
    border-bottom: 1px solid #28353b;
    text-align: left;
  }
  li > button:hover,
  li > button[aria-pressed='true'] {
    background: #1e2c31;
  }
  li strong {
    display: block;
    font-size: 0.85rem;
    font-weight: 500;
  }
  li button > span {
    display: block;
    color: #94a5ad;
    font-size: 0.75rem;
    margin-top: 0.25rem;
  }
  .empty {
    padding: 1rem 0;
    color: #8c9da4;
    font-size: 0.8rem;
  }
</style>
