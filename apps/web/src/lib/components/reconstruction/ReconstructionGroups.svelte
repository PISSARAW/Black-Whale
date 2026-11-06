<script lang="ts">
  import { reconstructionWords } from '$lib/reconstruction/workspaceWords'
  import { mapGroups } from '$lib/reconstruction/mapGroups'
  let {
    markers,
    onChoose,
  }: {
    markers: { tierId: string; change: string }[]
    onChoose: (id: string) => void
  } = $props()
  const groups = $derived(mapGroups(markers))
  const y = [0, 32.3, 45.1, 58.2, 71.1, 83.8]
</script>

<div class="deck-groups">
  {#each groups as group (group.id)}
    <button
      type="button"
      class="deck-group"
      data-hatsu-pass
      style:left="{group.number % 2 ? 30 : 70}%"
      style:top="{y[group.number] ?? 50}%"
      onclick={() => onChoose(group.id)}
      aria-haspopup="dialog"
    >
      <span>{$reconstructionWords.deck(group.number)}</span><strong>{group.count}</strong>
    </button>
  {/each}
</div>

<style>
  .deck-groups {
    position: absolute;
    inset: 0;
    z-index: 3;
    pointer-events: none;
  }
  button {
    position: absolute;
    transform: translate(-50%, -50%);
    pointer-events: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    min-height: 44px;
    min-width: 105px;
    padding: 0.5rem 0.7rem;
    border: 1px solid #637c80;
    border-radius: 5px;
    background: #102329f5;
    box-shadow: 0 3px 18px #0008;
    color: #e0e9e7;
    font-size: 0.75rem;
  }
  button:hover,
  button:focus-visible {
    border-color: #e5c57a;
    background: #29291e;
  }
  strong {
    color: #e5c57a;
    font-size: 0.85rem;
  }
</style>
