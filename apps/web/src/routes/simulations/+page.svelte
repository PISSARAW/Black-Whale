<script lang="ts">
  import type { PageData, ActionData } from './$types'
  import Seo from '$lib/components/Seo.svelte'
  import { breadcrumbSchema } from '$lib/seo/schema'

  let { data, form }: { data: PageData; form: ActionData } = $props()
  let entities = $derived(Object.values(data.branch?.snapshot?.entities || {}) as any[])
  let effects = $derived(Object.values(data.branch?.snapshot?.effects || {}) as any[])
</script>

<Seo
  title="Simulation Lab"
  description="Fork the canonical Black Whale timeline, execute Nen rules against a branch, and inspect the projected world without altering canon."
  jsonLd={breadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Simulations', path: '/simulations' },
  ])}
/>

<div class="lab">
  <header>
    <p>WORLD KERNEL / BRANCH LAB</p>
    <h1>Simulation Lab</h1>
    <span
      >Fork canon, execute Nen rules and inspect the projected world without altering the canonical
      timeline.</span
    >
  </header>

  {#if data.branchError}
    <aside class="error"><strong>Branch unavailable</strong><span>{data.branchError}</span></aside>
  {/if}
  {#if form?.message}<aside class="error"><span>{form.message}</span></aside>{/if}

  <section class="panel create-panel">
    <div>
      <small>01</small>
      <h2>Fork canonical state</h2>
    </div>
    <form method="POST" action="?/create">
      <label>
        Canonical event
        <select name="parentEventId" required disabled={!data.events.length}>
          {#each [...data.events].reverse() as event (event.id)}
            <option value={event.id}
              >Ch. {event.chapter.number} · {event.sequence} — {event.title}</option
            >
          {/each}
        </select>
      </label>
      <label>
        Rule policy
        <select name="mode">
          <option value="rule-compatible">Rule compatible</option>
          <option value="strict-canon">Strict canon</option>
          <option value="sandbox">Sandbox</option>
        </select>
      </label>
      <button type="submit" disabled={!data.events.length}>Create branch</button>
    </form>
  </section>

  {#if data.branch}
    <section class="branch-grid">
      <article class="panel branch-state">
        <div class="heading">
          <small>02</small>
          <h2>Branch state</h2>
        </div>
        <dl>
          <div>
            <dt>ID</dt>
            <dd>{data.branch.branch.id}</dd>
          </div>
          <div>
            <dt>Policy</dt>
            <dd>{data.branch.branch.rulePolicy}</dd>
          </div>
          <div>
            <dt>Fork</dt>
            <dd>
              Ch. {data.branch.branch.forkCursor.chapterNumber} / ordinal {data.branch.branch
                .forkCursor.ordinal}
            </dd>
          </div>
          <div>
            <dt>Current cursor</dt>
            <dd>{data.branch.snapshot.cursor.ordinal}</dd>
          </div>
          <div>
            <dt>Entities</dt>
            <dd>{entities.length}</dd>
          </div>
          <div>
            <dt>Active effects</dt>
            <dd>{effects.filter((effect) => effect.state === 'ACTIVE').length}</dd>
          </div>
        </dl>
      </article>

      <article class="panel ability-panel">
        <div class="heading">
          <small>03</small>
          <h2>Execute Bungee Gum</h2>
        </div>
        <p>
          The server evaluates the same conditions used by the UI, then emits typed effect events
          into this branch.
        </p>
        <form method="POST" action="?/activateBungee">
          <input type="hidden" name="branchId" value={data.branch.branch.id} />
          <label>Actor reference<input name="actorId" value="hisoka" required /></label>
          <label>
            Target entity
            <select name="targetId" required>
              <option value="">Select target</option>
              {#each entities.filter((entity) => entity.id !== 'hisoka') as entity (entity.id)}
                <option value={entity.id}>{entity.label} · {entity.kind}</option>
              {/each}
            </select>
          </label>
          <button type="submit">Attach aura</button>
        </form>
      </article>
    </section>

    <section class="panel scene-panel">
      <div class="heading">
        <small>04</small>
        <h2>Projected MapScene</h2>
      </div>
      <div class="metrics">
        <span>{data.scene?.markers?.length || 0}<small>markers</small></span>
        <span>{data.scene?.effectLinks?.length || 0}<small>effect links</small></span>
        <span>{data.scene?.auraLayers?.length || 0}<small>aura layers</small></span>
      </div>
      {#if effects.length}
        <div class="effects">
          {#each effects as effect (effect.id)}
            <article>
              <strong>{effect.kind}</strong><span>{effect.abilityId}</span><code
                >{effect.state}</code
              >
            </article>
          {/each}
        </div>
      {:else}
        <p class="empty">No branch-specific effect has been emitted yet.</p>
      {/if}
    </section>
  {/if}
</div>

<style>
  .lab {
    max-width: 1200px;
    margin: 0 auto;
    padding: 3rem 1.5rem 6rem;
    color: var(--text-primary);
  }
  header {
    margin-bottom: 2rem;
    border-left: 2px solid var(--accent-gold);
    padding-left: 1.25rem;
  }
  header p,
  .heading small,
  .create-panel small {
    color: var(--accent-gold);
    font: 600 0.58rem/1 var(--font-mono);
    letter-spacing: 0.14em;
  }
  header h1 {
    margin: 0.35rem 0;
    font-size: clamp(2.4rem, 6vw, 5rem);
    font-weight: 500;
  }
  header span,
  .ability-panel > p,
  .empty {
    color: var(--text-muted);
    font-size: 0.8rem;
  }
  .panel {
    border: 1px solid var(--line-subtle);
    border-radius: 0.6rem;
    background: color-mix(in srgb, var(--surface-raised) 85%, transparent);
    padding: 1.25rem;
  }
  .create-panel > div,
  .heading {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    margin-bottom: 1rem;
  }
  .panel h2 {
    margin: 0;
    font-size: 1rem;
  }
  .create-panel form,
  .ability-panel form {
    display: grid;
    grid-template-columns: minmax(12rem, 2fr) minmax(10rem, 1fr) auto;
    gap: 0.8rem;
    align-items: end;
  }
  label {
    display: grid;
    gap: 0.35rem;
    color: var(--text-muted);
    font: 500 0.58rem/1.2 var(--font-mono);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  select,
  input {
    width: 100%;
    min-height: 2.6rem;
    border: 1px solid var(--line-strong);
    border-radius: 0.3rem;
    background: var(--surface-void);
    padding: 0.6rem;
    color: var(--text-primary);
  }
  button {
    min-height: 2.6rem;
    border: 1px solid var(--accent-gold);
    border-radius: 0.3rem;
    background: rgba(200, 169, 86, 0.1);
    padding: 0.6rem 1rem;
    color: var(--accent-gold-bright);
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
  .branch-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-top: 1rem;
  }
  .branch-state dl {
    display: grid;
    gap: 0.5rem;
    margin: 0;
  }
  .branch-state dl div {
    display: grid;
    grid-template-columns: 8rem 1fr;
    border-top: 1px solid var(--line-subtle);
    padding-top: 0.5rem;
  }
  .branch-state dt {
    color: var(--text-muted);
    font: 0.58rem var(--font-mono);
    text-transform: uppercase;
  }
  .branch-state dd {
    overflow-wrap: anywhere;
    margin: 0;
    font: 0.68rem var(--font-mono);
  }
  .ability-panel form {
    grid-template-columns: 1fr;
    margin-top: 1rem;
  }
  .scene-panel {
    margin-top: 1rem;
  }
  .metrics {
    display: flex;
    gap: 1rem;
  }
  .metrics > span {
    display: grid;
    min-width: 7rem;
    padding: 1rem;
    border: 1px solid var(--line-subtle);
    font: 1.8rem var(--font-mono);
  }
  .metrics small {
    color: var(--text-muted);
    font-size: 0.55rem;
    text-transform: uppercase;
  }
  .effects {
    display: grid;
    gap: 0.5rem;
    margin-top: 1rem;
  }
  .effects article {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: 1rem;
    padding: 0.7rem;
    border-left: 2px solid #f06bb5;
    background: rgba(240, 107, 181, 0.06);
    font: 0.65rem var(--font-mono);
  }
  .effects span {
    color: var(--text-muted);
  }
  .effects code {
    color: #f06bb5;
  }
  .error {
    display: grid;
    gap: 0.25rem;
    margin-bottom: 1rem;
    border: 1px solid #8e3f43;
    border-radius: 0.4rem;
    background: rgba(142, 63, 67, 0.12);
    padding: 0.8rem;
    color: #ffaaaa;
    font-size: 0.7rem;
  }
  @media (max-width: 800px) {
    .create-panel form,
    .branch-grid {
      grid-template-columns: 1fr;
    }
    .metrics {
      flex-wrap: wrap;
    }
  }
</style>
