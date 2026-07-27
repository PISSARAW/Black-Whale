<script lang="ts">
  let {
    leftTitle,
    rightTitle,
    leftContent,
    rightContent,
  }: {
    leftTitle: string
    rightTitle: string
    leftContent: string
    rightContent: string
  } = $props()
</script>

<section class="split-map" aria-label="Comparaison de perspectives">
  <article>
    <header>{leftTitle}</header>
    <div>{leftContent}</div>
  </article>
  <article>
    <header>{rightTitle}</header>
    <div>{rightContent}</div>
  </article>
</section>

<style>
  .split-map {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.72rem;
  }

  article {
    border: 1px solid var(--line);
    border-radius: 0.72rem;
    background: color-mix(in srgb, var(--panel) 92%, #101624 8%);
    overflow: hidden;
  }

  header {
    padding: 0.5rem 0.72rem;
    font-size: 0.74rem;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    border-bottom: 1px solid var(--line);
    color: color-mix(in srgb, var(--ink) 74%, #8da4a4 26%);
  }

  div {
    min-height: 14rem;
    padding: 0.72rem;
    color: var(--ink);
  }

  @media (max-width: 900px) {
    .split-map {
      grid-template-columns: 1fr;
    }
  }
</style>
