<script lang="ts">
  interface TimelinePoint {
    id: string;
    label: string;
    index: number;
    emphasis?: boolean;
    detail?: string;
  }

  let {
    reality,
    body,
    consciousness,
    knowledge,
    currentIndex
  }: {
    reality: TimelinePoint[];
    body: TimelinePoint[];
    consciousness: TimelinePoint[];
    knowledge: TimelinePoint[];
    currentIndex: number;
  } = $props();

  let lines = $derived([
    { label: 'Realite', points: reality },
    { label: 'Corps', points: body },
    { label: 'Conscience', points: consciousness },
    { label: 'Connaissance', points: knowledge }
  ]);
</script>

<section class="timeline-v2" aria-label="Chronologie multi flux">
  {#each lines as line}
    <div class="line">
      <h3>{line.label}</h3>
      <ol>
        {#each line.points as point}
          <li class:active={point.index <= currentIndex} class:emphasis={point.emphasis}>
            <span class="dot" aria-hidden="true">●</span>
            <span class="text">{point.label}</span>
            {#if point.detail}
              <small>{point.detail}</small>
            {/if}
          </li>
        {/each}
      </ol>
    </div>
  {/each}
</section>

<style>
  .timeline-v2 {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.5rem;
    padding: 0.65rem 0.8rem;
    border: 1px solid var(--line);
    border-radius: 0.72rem;
    background: color-mix(in srgb, var(--panel) 90%, #0d141d 10%);
  }

  .line {
    display: grid;
    gap: 0.64rem;
    align-items: start;
  }

  h3 {
    margin: 0;
    font-size: 0.68rem;
    letter-spacing: 0.11em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--ink) 68%, #85a39d 32%);
    padding-top: 0.35rem;
  }

  ol {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
    overflow-x: auto;
  }

  li {
    min-width: 0;
    border: 1px solid color-mix(in srgb, var(--line) 74%, #f5f1df 10%);
    border-radius: 0.45rem;
    padding: 0.36rem 0.45rem;
    opacity: 0.58;
  }

  li.active {
    opacity: 1;
  }

  li.emphasis {
    border-style: dashed;
    border-color: var(--state-transferred);
  }

  .dot {
    margin-right: 0.3rem;
    color: color-mix(in srgb, var(--state-known) 60%, #f4f2e4 40%);
  }

  .text {
    font-size: 0.8rem;
    color: var(--ink);
  }

  small {
    display: block;
    margin-top: 0.2rem;
    color: color-mix(in srgb, var(--ink) 66%, #859695 34%);
    font-size: 0.68rem;
  }

  @media (max-width: 780px) {
    .timeline-v2 {
      grid-template-columns: 1fr;
    }

    .line {
      grid-template-columns: 1fr;
      gap: 0.3rem;
    }

    h3 {
      padding-top: 0;
    }
  }
</style>
