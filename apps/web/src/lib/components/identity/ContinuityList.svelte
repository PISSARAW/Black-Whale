<script lang="ts">
  import type { ContinuityEntry, ContinuityKind } from '$lib/identity/continuity'
  import { link, t, type Messages } from '$lib/i18n'

  let { entries }: { entries: ContinuityEntry[] } = $props()

  type EnumDictionary = keyof Messages['identity']['enums']

  /** Which enum each kind of entry stores in `value`, and in `certainty`. */
  const VALUE_DICTIONARY: Record<ContinuityKind, EnumDictionary> = {
    OCCUPANCY: 'occupancyType',
    BODY_STATE: 'bodyState',
    PRESENCE: 'presencePrecision',
    APPEARANCE: 'appearanceCause',
    CONSCIOUSNESS_STATE: 'consciousnessState',
  }

  const CERTAINTY_DICTIONARY: Partial<Record<ContinuityKind, EnumDictionary>> = {
    OCCUPANCY: 'certainty',
    PRESENCE: 'presenceCertainty',
  }

  /**
   * An enum value the catalogue has no wording for is shown as it is stored
   * rather than blanked: a new `BodyStateType` should read oddly, not vanish.
   */
  function word(dictionary: EnumDictionary, value: string): string {
    return $t.identity.enums[dictionary][value] ?? value
  }
</script>

{#if entries.length === 0}
  <p class="empty">{$t.identity.noEntries}</p>
{:else}
  <ol class="continuity">
    {#each entries as entry (entry.id)}
      <li>
        <div class="head">
          <span class="kind">{$t.identity.entryKind[entry.kind]}</span>
          <span class="interval">
            {entry.until
              ? $t.identity.interval(
                  entry.from.chapter,
                  entry.from.sequence,
                  entry.until.chapter,
                  entry.until.sequence,
                )
              : $t.identity.intervalOpen(entry.from.chapter, entry.from.sequence)}
          </span>
        </div>

        <p class="value">
          {word(VALUE_DICTIONARY[entry.kind], entry.value)}
          {#if entry.link}
            <span class="arrow" aria-hidden="true">→</span>
            {#if entry.link.href}
              <a href={$link(entry.link.href)}>{entry.link.label}</a>
            {:else}
              <span class="plain">{entry.link.label}</span>
            {/if}
          {/if}
        </p>

        <p class="meta">
          {$t.identity.fromEvent(entry.from.title)}
          {#if entry.certainty && CERTAINTY_DICTIONARY[entry.kind]}
            · {$t.identity.certaintyLabel(word(CERTAINTY_DICTIONARY[entry.kind]!, entry.certainty))}
          {/if}
        </p>
      </li>
    {/each}
  </ol>
{/if}

<style>
  .continuity {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.6rem;
  }

  li {
    border: 1px solid var(--line, #2b3440);
    border-radius: 0.4rem;
    padding: 0.65rem 0.75rem;
  }

  .head {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    align-items: baseline;
    justify-content: space-between;
  }

  .kind,
  .interval {
    font-size: 0.62rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .kind {
    color: #e5c57a;
  }

  .interval,
  .meta {
    color: color-mix(in srgb, currentColor 58%, transparent);
  }

  .value {
    margin: 0.35rem 0 0.2rem;
    font-size: 0.9rem;
  }

  .arrow {
    opacity: 0.55;
    padding: 0 0.15rem;
  }

  .meta {
    margin: 0;
    font-size: 0.7rem;
  }

  a {
    color: #e5c57a;
  }

  .empty {
    border: 1px dashed var(--line, #2b3440);
    border-radius: 0.4rem;
    padding: 1.5rem;
    text-align: center;
    font-size: 0.82rem;
    font-style: italic;
    color: color-mix(in srgb, currentColor 62%, transparent);
  }
</style>
