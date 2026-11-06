<script lang="ts">
  import { link, t } from '$lib/i18n'
  import { reconstructionWords } from '$lib/reconstruction/workspaceWords'
</script>

<header class="reconstruction-heading" data-hatsu-pass>
  <div>
    <h1>{$t.reconstruction.title}</h1>
    <p>{$reconstructionWords.hint}</p>
  </div>
  <details>
    <summary>{$reconstructionWords.about}</summary>
    <div class="about">
      <p>{$t.reconstruction.intro}</p>
      <p>{$t.reconstruction.methodNote}</p>
      <a href={$link('/reconstruction/v3')}>V3 · Et si… →</a>
    </div>
  </details>
</header>

<style>
  .reconstruction-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    max-width: 1800px;
    margin: auto;
    padding: 1.5rem var(--page-gutter) 0.75rem;
  }
  h1 {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(1.5rem, 3vw, 2.3rem);
  }
  p {
    margin-top: 0.4rem;
    color: var(--text-secondary);
    font-size: 0.85rem;
    line-height: 1.5;
  }
  details {
    position: relative;
  }
  summary {
    min-height: 44px;
    padding: 0.75rem 0;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 0.75rem;
    white-space: nowrap;
  }
  .about {
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 60;
    width: min(430px, 85vw);
    padding: 1rem;
    border: 1px solid var(--line-default);
    border-radius: 5px;
    background: #11181c;
    box-shadow: 0 10px 40px #0008;
  }
  a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    margin-top: 0.5rem;
    color: #e5c57a;
    font-size: 0.8rem;
  }
  @media (max-width: 600px) {
    .reconstruction-heading {
      padding-top: 1rem;
    }
    .reconstruction-heading > div > p {
      display: none;
    }
  }
</style>
