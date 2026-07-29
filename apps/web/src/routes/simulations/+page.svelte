<script lang="ts">
  import type { PageData, ActionData } from './$types'
  import Seo from '$lib/components/Seo.svelte'
  import { NenWhyPanel } from '$lib/nen'
  import { breadcrumbSchema } from '$lib/seo/schema'
  import { link, t } from '$lib/i18n'

  let { data, form }: { data: PageData; form: ActionData } = $props()
  let entities = $derived(Object.values(data.branch?.snapshot?.entities || {}) as any[])
  let effects = $derived(Object.values(data.branch?.snapshot?.effects || {}) as any[])
</script>

<Seo
  title={$t.simulations.seoTitle}
  description={$t.simulations.seoDescription}
  jsonLd={breadcrumbSchema([
    { name: $t.common.home, path: $link('/') },
    { name: $t.simulations.breadcrumb, path: $link('/simulations') },
  ])}
/>

<div class="lab">
  <header>
    <p>{$t.simulations.eyebrow}</p>
    <h1>{$t.simulations.title}</h1>
    <span>{$t.simulations.intro}</span>
  </header>

  {#if data.branchError}
    <aside class="error">
      <strong>{$t.simulations.branchUnavailable}</strong><span>{data.branchError}</span>
    </aside>
  {/if}
  {#if form?.message}<aside class="error"><span>{form.message}</span></aside>{/if}

  <section class="panel create-panel">
    <div>
      <small>01</small>
      <h2>{$t.simulations.forkTitle}</h2>
    </div>
    <form method="POST" action="?/create">
      <label>
        {$t.simulations.canonicalEvent}
        <select name="parentEventId" required disabled={!data.events.length}>
          {#each [...data.events].reverse() as event (event.id)}
            <option value={event.id}
              >{$t.simulations.eventOption(
                event.chapter.number,
                event.sequence,
                event.title,
              )}</option
            >
          {/each}
        </select>
      </label>
      <label>
        {$t.simulations.rulePolicy}
        <select name="mode">
          <option value="rule-compatible">{$t.simulations.policies.ruleCompatible}</option>
          <option value="strict-canon">{$t.simulations.policies.strictCanon}</option>
          <option value="sandbox">{$t.simulations.policies.sandbox}</option>
        </select>
      </label>
      <button type="submit" disabled={!data.events.length}>{$t.simulations.createBranch}</button>
    </form>
  </section>

  {#if data.branch}
    <section class="branch-grid">
      <article class="panel branch-state">
        <div class="heading">
          <small>02</small>
          <h2>{$t.simulations.branchStateTitle}</h2>
        </div>
        <dl>
          <div>
            <dt>{$t.simulations.id}</dt>
            <dd>{data.branch.branch.id}</dd>
          </div>
          <div>
            <dt>{$t.simulations.policy}</dt>
            <dd>{data.branch.branch.rulePolicy}</dd>
          </div>
          <div>
            <dt>{$t.simulations.fork}</dt>
            <dd>
              {$t.simulations.forkValue(
                data.branch.branch.forkCursor.chapterNumber,
                data.branch.branch.forkCursor.ordinal,
              )}
            </dd>
          </div>
          <div>
            <dt>{$t.simulations.currentCursor}</dt>
            <dd>{data.branch.snapshot.cursor.ordinal}</dd>
          </div>
          <div>
            <dt>{$t.simulations.entities}</dt>
            <dd>{entities.length}</dd>
          </div>
          <div>
            <dt>{$t.simulations.activeEffects}</dt>
            <dd>{effects.filter((effect) => effect.state === 'ACTIVE').length}</dd>
          </div>
        </dl>
      </article>

      <article class="panel ability-panel">
        <div class="heading">
          <small>03</small>
          <h2>{$t.simulations.executeTitle}</h2>
        </div>
        <p>{$t.simulations.executeCopy}</p>

        <!-- A GET form: the selection lives in the URL, so the plan is computed
             server-side and the panel works without any client-side JavaScript. -->
        <form method="GET" action={$link('/simulations')}>
          <input type="hidden" name="branch" value={data.branch.branch.id} />
          <label
            >{$t.simulations.actorReference}<input
              name="actor"
              value={data.selection.actorId}
              required
            /></label
          >
          <label>
            {$t.simulations.targetEntity}
            <select name="target" required>
              <option value="">{$t.simulations.selectTarget}</option>
              {#each entities.filter((entity) => entity.id !== data.selection.actorId) as entity (entity.id)}
                <option value={entity.id} selected={entity.id === data.selection.targetId}
                  >{entity.label} · {entity.kind}</option
                >
              {/each}
            </select>
          </label>
          <button type="submit">{$t.simulations.planAction}</button>
        </form>

        {#if data.plan}
          <NenWhyPanel plan={data.plan} />
        {/if}

        <form method="POST" action="?/activateBungee">
          <input type="hidden" name="branchId" value={data.branch.branch.id} />
          <input type="hidden" name="actorId" value={data.selection.actorId} />
          <input type="hidden" name="targetId" value={data.selection.targetId ?? ''} />
          <button type="submit" disabled={data.plan?.status !== 'AVAILABLE'}
            >{$t.simulations.attachAura}</button
          >
        </form>
      </article>
    </section>

    <section class="panel scene-panel">
      <div class="heading">
        <small>04</small>
        <h2>{$t.simulations.sceneTitle}</h2>
      </div>
      <div class="metrics">
        <span>{data.scene?.markers?.length || 0}<small>{$t.simulations.markers}</small></span>
        <span
          >{data.scene?.effectLinks?.length || 0}<small>{$t.simulations.effectLinks}</small></span
        >
        <span>{data.scene?.auraLayers?.length || 0}<small>{$t.simulations.auraLayers}</small></span>
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
        <p class="empty">{$t.simulations.noEffects}</p>
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
  .ability-panel {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
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
